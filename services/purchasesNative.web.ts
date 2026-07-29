// services/purchasesNative.web.ts — stub WEB de purchasesNative.
//
// 🔴 N'importe RIEN de `react-native-purchases` (lib native-only) → Metro résout
// ce fichier `.web.ts` sur web → la lib native n'entre JAMAIS dans le bundle web.
// Jamais appelé sur web : le paiement web passe par Paddle (branche séparée de
// pricing-upgrade, `Platform.OS === 'web'`). Ce stub existe seulement pour que
// l'import `./purchasesNative` résolve un module valide côté web.

export type NativePurchaseResult =
  | { status: 'purchased' }
  | { status: 'restored' }
  | { status: 'nothing' }
  | { status: 'cancelled' }
  | { status: 'error'; code: string };

export async function nativePurchase(): Promise<NativePurchaseResult> {
  return { status: 'error', code: 'web-not-supported' };
}

export async function nativeRestore(): Promise<NativePurchaseResult> {
  return { status: 'error', code: 'web-not-supported' };
}

// no-op sur web : aucun SDK natif à activer. Le root layout garde déjà l'appel
// derrière `Platform.OS !== 'web'`, mais ce stub garantit un module résolvable.
export async function nativeInitAdapty(): Promise<void> {
  // rien à faire sur web
}
