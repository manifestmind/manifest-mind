// services/googleNative.ts — Google Sign-In NATIF (Android/iOS).
//
// SEUL fichier qui importe `@react-native-google-signin/google-signin` (lib
// NATIVE, sans support web). Le pendant `googleNative.web.ts` n'importe RIEN de
// cette lib → Metro résout `.web.ts` pour le web, donc la lib native n'entre
// JAMAIS dans le bundle web (protection du Google Sign-In web).
//
// Ce module renvoie uniquement l'idToken Google ; la conversion en session
// Firebase (signInWithCredential) reste dans googleAuth.ts, mutualisée avec la
// logique existante. On ne duplique donc pas Firebase ici.

import {
  GoogleSignin,
  statusCodes,
  isCancelledResponse,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

// Client OAuth WEB (type 3) de google-services.json — c'est LUI (et pas le
// client Android type 1) que Google exige comme webClientId pour délivrer un
// idToken exploitable par Firebase. Identifiant PUBLIC (comme la config
// Firebase), non sensible.
const WEB_CLIENT_ID =
  '481097482104-4ejbttk32beo5vsbdabajf41airk3am8.apps.googleusercontent.com';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
}

export type NativeGoogleResult =
  | { status: 'ok'; idToken: string }
  | { status: 'cancelled' }
  | { status: 'error'; code: string };

// Ouvre le sélecteur de compte Google natif et renvoie l'idToken.
export async function nativeGoogleIdToken(): Promise<NativeGoogleResult> {
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) return { status: 'cancelled' };
    if (!isSuccessResponse(response)) return { status: 'error', code: 'no-success' };

    const idToken = response.data.idToken;
    if (!idToken) return { status: 'error', code: 'no-id-token' };
    return { status: 'ok', idToken };
  } catch (e: any) {
    const code = e?.code ?? 'unknown';
    // Annulation remontée par exception (compat) → silencieux.
    if (code === statusCodes.SIGN_IN_CANCELLED) return { status: 'cancelled' };
    // DEVELOPER_ERROR (code 10) = mismatch SHA / clientId / package → remonte ici.
    return { status: 'error', code: String(code) };
  }
}
