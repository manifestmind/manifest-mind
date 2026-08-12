// services/purchasesNative.ts — Achats natifs via Adapty (react-native-adapty).
//
// SEUL fichier qui importe `react-native-adapty` (lib NATIVE, sans support web).
// Le pendant `purchasesNative.web.ts` n'importe RIEN → Metro résout `.web.ts` sur
// web → la lib native n'entre JAMAIS dans le bundle web. Le paiement WEB (Paddle)
// est totalement indépendant et protégé.
//
// ⏳ PHASE A = STRUCTURE seulement. La clé API et l'ID de placement sont des
// PLACEHOLDERS à compléter en Phase B (après config du dashboard Adapty). Ces
// fonctions ne sont appelées QUE si STORES_ACTIVE=true (faux en Phase A) → code
// inerte pour l'instant, paywall natif = « Disponible prochainement ».

import { adapty, AdaptyError } from 'react-native-adapty';
import type { AdaptyPaywallProduct } from 'react-native-adapty';

// Clé PUBLIQUE SDK Adapty (format `public_live_…`) — conçue pour être embarquée
// dans l'app cliente. AUCUNE clé secrète ici (les secrets serveur vivent dans
// Secret Manager côté Cloud Functions). Chemin NATIF uniquement (le web résout le
// stub purchasesNative.web.ts → cette valeur n'entre jamais dans le bundle web).
const ADAPTY_API_KEY = 'public_live_R76ZtGAr.9eGdj72wFhOYgZcHHqU9';
// ID du placement Adapty qui expose le paywall (les 3 produits), créé et publié
// dans le dashboard (audience « Tous les utilisateurs », statut En direct).
const PLACEMENT_ID = 'main_paywall';
// Niveau d'accès Adapty (« access level ») qui déverrouille le premium.
// Défini côté dashboard, symétrique de l'entitlement RevenueCat.
const ACCESS_LEVEL_ID = 'premium';

// Mapping plan interne → Product ID Google Play (= `vendorProductId` côté Adapty).
// Les Product IDs sont ceux créés dans Google Play et reliés dans Adapty :
//   mensuel  → mm_premium_monthly   (base plan monthly-autorenew)
//   annuel   → mm_premium_annual    (base plan mm-premium-annual)
//   lifetime → mm_premium_lifetime  (achat unique, pas de base plan)
const PRODUCT_ID_BY_PLAN: Record<'mensuel' | 'annuel' | 'lifetime', string> = {
  mensuel: 'mm_premium_monthly',
  annuel: 'mm_premium_annual',
  lifetime: 'mm_premium_lifetime',
};

// Active le SDK une seule fois, en rattachant l'UID Firebase comme `customerUserId`
// → le webhook Adapty saura quel doc Firestore (users/{uid}.subscription_active)
// mettre à jour. Symétrique au firebase_uid de Paddle.
// Robuste : si le SDK est déjà actif (ex. activé au démarrage en Phase B), on se
// contente d'`identify` pour garantir le bon utilisateur, sinon on `activate`.
async function ensureActivated(customerUserId: string) {
  if (await adapty.isActivated()) {
    if (customerUserId) await adapty.identify(customerUserId);
    return;
  }
  // Coupe la collecte des identifiants PUBLICITAIRES : IDFA (iOS) + AdvertisingID
  // (Android). L'IP reste ACTIVE volontairement (Adapty en a besoin pour résoudre
  // le storefront / la devise ; cf. écart pays iOS non résolu). Aligne le build
  // avec la déclaration de confidentialité : Adapty 4.0.1 ne collecte alors que
  // « Purchase History » (cf. son manifeste PrivacyInfo.xcprivacy) → pas de Device ID.
  await adapty.activate(ADAPTY_API_KEY, {
    customerUserId,
    ios: { idfaCollectionDisabled: true },
    android: { adIdCollectionDisabled: true },
  });
}

// Activation d'Adapty AU DÉMARRAGE (appelée par le root layout, natif +
// STORES_ACTIVE). Idempotente : ensureActivated active une fois, puis ré-identifie
// l'UID courant à chaque appel (utile après une conversion / changement de session).
// À utiliser en FIRE-AND-FORGET côté appelant : ne doit jamais bloquer le démarrage.
export async function nativeInitAdapty(appUserID: string): Promise<void> {
  if (!appUserID) return;
  await ensureActivated(appUserID);
}

// Sélectionne le produit correspondant au plan dans les produits du placement,
// par `vendorProductId` (Product ID Google Play).
function pickProduct(
  products: AdaptyPaywallProduct[],
  plan: 'mensuel' | 'annuel' | 'lifetime',
): AdaptyPaywallProduct | null {
  const vendorId = PRODUCT_ID_BY_PLAN[plan];
  return products.find((p) => p.vendorProductId === vendorId) ?? null;
}

export type NativePurchaseResult =
  | { status: 'purchased' }
  | { status: 'restored' }
  | { status: 'nothing' }
  | { status: 'cancelled' }
  | { status: 'error'; code: string };

// Achat natif d'un plan. Renvoie 'purchased' si l'access level premium est actif.
export async function nativePurchase(
  plan: 'mensuel' | 'annuel' | 'lifetime',
  appUserID: string,
): Promise<NativePurchaseResult> {
  try {
    await ensureActivated(appUserID);
    const flow = await adapty.getFlow(PLACEMENT_ID);
    const products = await adapty.getPaywallProducts(flow);
    const product = pickProduct(products, plan);
    if (!product) return { status: 'error', code: 'no-product' };
    // Adapty ne LÈVE PAS d'exception sur annulation : le statut est porté par le
    // type de retour (union discriminée). Le catch ci-dessous ne gère que les
    // vraies erreurs (réseau, etc.).
    const result = await adapty.makePurchase(product);
    switch (result.type) {
      case 'user_cancelled':
        return { status: 'cancelled' };
      case 'pending':
        // Paiement différé (ex. validation parentale / hors-ligne) : pas encore
        // de premium. Le webhook posera subscription_active à la conclusion.
        // (UX 'pending' affinable en Phase B ; le contrat de retour reste intact.)
        return { status: 'nothing' };
      case 'success': {
        const active = !!result.profile.accessLevels?.[ACCESS_LEVEL_ID]?.isActive;
        return active ? { status: 'purchased' } : { status: 'error', code: 'no-access-level' };
      }
      default:
        return { status: 'error', code: 'unknown-result' };
    }
  } catch (e: any) {
    const code = e instanceof AdaptyError ? String(e.adaptyCode) : (e?.code ?? 'unknown');
    return { status: 'error', code };
  }
}

// Restauration des achats. 'restored' si l'access level premium est retrouvé.
export async function nativeRestore(appUserID: string): Promise<NativePurchaseResult> {
  try {
    await ensureActivated(appUserID);
    const profile = await adapty.restorePurchases();
    const active = !!profile.accessLevels?.[ACCESS_LEVEL_ID]?.isActive;
    return active ? { status: 'restored' } : { status: 'nothing' };
  } catch (e: any) {
    const code = e instanceof AdaptyError ? String(e.adaptyCode) : (e?.code ?? 'unknown');
    return { status: 'error', code };
  }
}

// Prix LOCALISÉS d'un produit (total formaté par le store + montant + devise).
export type NativePriceInfo = {
  localized: string; // ex. « 12,99 € » — prix total formaté par Google Play
  amount: number; // montant numérique dans la devise locale
  currencyCode: string; // ex. 'EUR', 'USD', 'JPY'
};
export type NativePricesResult =
  | { ok: true; prices: Record<'mensuel' | 'annuel' | 'lifetime', NativePriceInfo> }
  | { ok: false };

// Récupère les prix LOCALISÉS des 3 produits du placement. TOUT-OU-RIEN : renvoie
// ok:false si Adapty échoue OU si un seul des 3 produits manque / n'a pas de prix
// localisé complet (localized + amount + devise) → le paywall bloque l'achat et
// propose « Réessayer ». Jamais de paywall partiel, jamais d'achat à prix incertain.
export async function nativeGetPrices(appUserID: string): Promise<NativePricesResult> {
  try {
    await ensureActivated(appUserID);
    const flow = await adapty.getFlow(PLACEMENT_ID);
    const products = await adapty.getPaywallProducts(flow);
    const plans = ['mensuel', 'annuel', 'lifetime'] as const;
    const prices = {} as Record<'mensuel' | 'annuel' | 'lifetime', NativePriceInfo>;
    for (const plan of plans) {
      const price = pickProduct(products, plan)?.price;
      const localized = price?.localizedString;
      const amount = price?.amount;
      const currencyCode = price?.currencyCode;
      if (!localized || typeof amount !== 'number' || !currencyCode) {
        return { ok: false };
      }
      prices[plan] = { localized, amount, currencyCode };
    }
    return { ok: true, prices };
  } catch {
    return { ok: false };
  }
}
