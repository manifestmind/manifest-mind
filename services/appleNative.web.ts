// services/appleNative.web.ts — stub web d'Apple Sign-In.
//
// Le web NE propose PAS Apple Sign-In (paiement Paddle + connexion Google /
// e-mail). Ce stub garantit que `expo-apple-authentication` et `expo-crypto`
// n'entrent JAMAIS dans le bundle web. Symétrique de googleNative.web.ts.

export type NativeAppleResult =
  | { status: 'ok'; identityToken: string; rawNonce: string }
  | { status: 'cancelled' }
  | { status: 'unsupported' }
  | { status: 'error'; code: string };

export async function nativeAppleIdToken(): Promise<NativeAppleResult> {
  return { status: 'unsupported' };
}
