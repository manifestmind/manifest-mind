// services/purchasesNative.ts — Achats natifs via RevenueCat (react-native-purchases).
//
// SEUL fichier qui importe `react-native-purchases` (lib NATIVE, sans support web).
// Le pendant `purchasesNative.web.ts` n'importe RIEN → Metro résout `.web.ts` sur
// web → la lib native n'entre JAMAIS dans le bundle web. Le paiement WEB (Paddle)
// est totalement indépendant et protégé.
//
// ⏳ PHASE A = STRUCTURE seulement. La clé API et le mapping des produits sont des
// PLACEHOLDERS à compléter en Phase B (après création des produits Play + de l'app
// RevenueCat). Ces fonctions ne sont appelées QUE si STORES_ACTIVE=true (faux en
// Phase A) → code inerte pour l'instant, paywall natif = « Disponible prochainement ».

import Purchases, {
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

// ⏳ Clé publique Android RevenueCat — À REMPLIR en Phase B.
const REVENUECAT_API_KEY = '';
// Entitlement RevenueCat qui déverrouille le premium.
const ENTITLEMENT_ID = 'premium';

let configured = false;
function ensureConfigured(appUserID: string) {
  if (configured) return;
  // appUserID = UID Firebase → le webhook RevenueCat saura quel doc Firestore
  // (users/{uid}.subscription_active) mettre à jour. Symétrique au firebase_uid de Paddle.
  Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID });
  configured = true;
}

// ⏳ Mapping produit À COMPLÉTER en Phase B (dépend des offerings RevenueCat créés).
// Sélectionne le package correspondant au plan dans l'offering courant.
function pickPackage(
  _offerings: PurchasesOfferings,
  _plan: 'mensuel' | 'annuel' | 'lifetime',
): PurchasesPackage | null {
  // TODO Phase B : mapper plan → package (par type de package ou product identifier).
  return null;
}

export type NativePurchaseResult =
  | { status: 'purchased' }
  | { status: 'restored' }
  | { status: 'nothing' }
  | { status: 'cancelled' }
  | { status: 'error'; code: string };

// Achat natif d'un plan. Renvoie 'purchased' si l'entitlement premium est actif.
export async function nativePurchase(
  plan: 'mensuel' | 'annuel' | 'lifetime',
  appUserID: string,
): Promise<NativePurchaseResult> {
  try {
    ensureConfigured(appUserID);
    const offerings = await Purchases.getOfferings();
    const pkg = pickPackage(offerings, plan);
    if (!pkg) return { status: 'error', code: 'no-package' };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = !!customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive;
    return active ? { status: 'purchased' } : { status: 'error', code: 'no-entitlement' };
  } catch (e: any) {
    if (e?.userCancelled) return { status: 'cancelled' };
    return { status: 'error', code: e?.code ?? 'unknown' };
  }
}

// Restauration des achats. 'restored' si l'entitlement premium est retrouvé.
export async function nativeRestore(appUserID: string): Promise<NativePurchaseResult> {
  try {
    ensureConfigured(appUserID);
    const customerInfo = await Purchases.restorePurchases();
    const active = !!customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive;
    return active ? { status: 'restored' } : { status: 'nothing' };
  } catch (e: any) {
    return { status: 'error', code: e?.code ?? 'unknown' };
  }
}
