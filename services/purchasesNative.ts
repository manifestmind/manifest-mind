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

// ⏳ Clé publique Android RevenueCat → Adapty (format `public_live_…`).
// À REMPLIR en Phase B (fournie au moment de basculer STORES_ACTIVE=true).
const ADAPTY_API_KEY = '';
// ⏳ ID du placement Adapty qui expose le paywall (les 3 produits). À REMPLIR en
// Phase B (créé dans le dashboard Adapty : Placements → paywall → produits).
const PLACEMENT_ID = '';
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
  await adapty.activate(ADAPTY_API_KEY, { customerUserId });
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
