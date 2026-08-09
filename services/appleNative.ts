// services/appleNative.ts — Apple Sign-In NATIF (iOS uniquement).
//
// SEUL fichier qui importe `expo-apple-authentication` (module NATIF iOS, sans
// support web ni Android). Le pendant `appleNative.web.ts` n'importe RIEN de ce
// module → Metro résout `.web.ts` pour le web, donc la lib native n'entre JAMAIS
// dans le bundle web. Même patron que googleNative.ts / googleNative.web.ts.
//
// Ce module renvoie uniquement l'identityToken Apple + le nonce BRUT ; la
// conversion en session Firebase (signInWithCredential) est isolée dans
// appleAuth.ts, et la finalisation (clés de cycle, routage) reste dans
// finalizeSignIn (authSession.ts), commune à tous les providers.

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

export type NativeAppleResult =
  | { status: 'ok'; identityToken: string; rawNonce: string }
  | { status: 'cancelled' }
  | { status: 'unsupported' }
  | { status: 'error'; code: string };

// Nonce anti-rejeu : Apple reçoit le HASH SHA-256, Firebase reçoit le nonce
// BRUT et vérifie qu'il correspond au hash contenu dans l'identityToken. Sans
// ça, un token intercepté pourrait être rejoué sur une autre session.
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    raw,
  );
  return { raw, hashed };
}

// Ouvre la feuille native Apple et renvoie l'identityToken + le nonce brut.
export async function nativeAppleIdToken(): Promise<NativeAppleResult> {
  // Garde matériel/OS : Sign in with Apple indisponible (appareil/simulateur non
  // configuré) → on ne tente rien plutôt que de crasher.
  const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
  if (!available) return { status: 'unsupported' };

  try {
    const { raw, hashed } = await makeNonce();
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });
    // identityToken = le JWT qu'attend Firebase. Nom/e-mail ne sont fournis qu'à
    // la 1re connexion (comportement Apple) — non requis ici : Firebase gère
    // l'identité via le `sub` stable contenu dans le token.
    if (!credential.identityToken) return { status: 'error', code: 'no-identity-token' };
    return { status: 'ok', identityToken: credential.identityToken, rawNonce: raw };
  } catch (e: any) {
    // L'utilisateur a fermé la feuille → annulation silencieuse.
    if (e?.code === 'ERR_REQUEST_CANCELED') return { status: 'cancelled' };
    return { status: 'error', code: String(e?.code ?? 'unknown') };
  }
}
