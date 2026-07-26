// services/googleNative.web.ts — stub WEB de googleNative.
//
// 🔴 N'IMPORTE RIEN de `@react-native-google-signin/google-signin` (lib
// native-only). Metro résout ce fichier `.web.ts` pour le web → la lib native
// n'entre JAMAIS dans le bundle web. Le Google Sign-In web passe par la branche
// web de googleAuth.ts (signInWithPopup/Redirect), qui n'appelle jamais ceci.
// Ce stub existe seulement pour que l'import `./googleNative` résolve un module
// valide côté web.

export type NativeGoogleResult =
  | { status: 'ok'; idToken: string }
  | { status: 'cancelled' }
  | { status: 'error'; code: string };

export async function nativeGoogleIdToken(): Promise<NativeGoogleResult> {
  return { status: 'error', code: 'web-not-supported' };
}
