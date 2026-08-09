// services/appleAuth.ts — échange du token Apple contre une session Firebase.
//
// Symétrique de googleAuth.ts, mais SANS flux web : Apple Sign-In = iOS natif
// uniquement dans cette app. Reçoit l'identityToken + nonce d'appleNative
// (résolu par Metro : le stub .web.ts renvoie 'unsupported' → aucun code Apple
// natif dans le bundle web), crée la credential OAuth Apple et ouvre la session
// Firebase. La finalisation (clés de cycle, routage) reste dans finalizeSignIn
// (authSession.ts), commune à tous les providers — on ne duplique rien ici.

import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';
import { nativeAppleIdToken } from './appleNative';

export type AppleSignInResult =
  | { status: 'signed-in' }
  | { status: 'cancelled' }
  | { status: 'unsupported' }
  | { status: 'error'; code: string };

export async function signInWithApple(): Promise<AppleSignInResult> {
  const res = await nativeAppleIdToken();
  // 'cancelled' | 'unsupported' | 'error' transmis tels quels à l'appelant.
  if (res.status !== 'ok') return res;

  try {
    // signInWithCredential BASCULE sur l'UID Apple (comme le Google natif) →
    // useSubscriptionSync (monté dans _layout) restaure l'abonnement depuis
    // users/{uid}. L'identité Apple (`sub` stable) donne le MÊME UID à chaque
    // reconnexion, adresse relais ou non.
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: res.identityToken,
      rawNonce: res.rawNonce,
    });
    const r = await signInWithCredential(auth, credential);
    if (__DEV__) console.log('[apple] natif OK uid=', r.user.uid);
    return { status: 'signed-in' };
  } catch (e: any) {
    if (__DEV__) console.log('[apple] signInWithCredential échoué', e?.code);
    return { status: 'error', code: String(e?.code ?? 'auth/unknown') };
  }
}
