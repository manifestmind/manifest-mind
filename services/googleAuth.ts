// Connexion Google — web uniquement.
//
// signInWithPopup / signInWithRedirect n'existent PAS sur React Native : la
// version native exigera expo-auth-session ou @react-native-google-signin
// (chantier séparé, avec le pipeline RevenueCat). Sur native, ces fonctions
// renvoient donc 'unsupported' et l'appelant garde son toast.
//
// Stratégie popup → redirect, et pourquoi la distinction est essentielle :
//
//   - auth/popup-blocked, auth/operation-not-supported-in-environment
//       → le NAVIGATEUR a refusé le popup. L'utilisateur, lui, veut se
//         connecter : on bascule sur signInWithRedirect.
//
//   - auth/popup-closed-by-user, auth/cancelled-popup-request
//       → l'UTILISATEUR a fermé le popup (ou en a ouvert deux). Enchaîner sur un
//         redirect le renverrait de force chez Google alors qu'il vient de dire
//         non. On abandonne silencieusement.
//
// ⚠️ Fragilité connue du redirect (à traiter au déploiement web) : il repose sur
// un aller-retour via manifestmind.firebaseapp.com, un domaine tiers — donc
// cassé par les navigateurs qui cloisonnent les cookies tiers (Safari/ITP, et
// Chrome qui s'y met). Correctif prod : servir le handler depuis notre propre
// domaine (authDomain: 'manifest-mind.app' + rewrite Firebase Hosting).

import { Platform } from 'react-native';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export type GoogleSignInResult =
  // Session établie immédiatement (popup) → l'appelant finalise et route.
  | { status: 'signed-in'; user: User }
  // Redirection vers Google en cours : la page va être quittée. Le retour est
  // récupéré au démarrage par getRedirectResult (cf. _layout.tsx).
  | { status: 'redirecting' }
  // L'utilisateur a fermé le popup — aucun message d'erreur à afficher.
  | { status: 'cancelled' }
  // Native : provider non câblé.
  | { status: 'unsupported' }
  | { status: 'error'; code: string };

function buildProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Force le sélecteur de compte : sans ça, un utilisateur ayant plusieurs
  // comptes Google est reconnecté silencieusement au dernier utilisé — et se
  // retrouverait sur le mauvais UID, donc sans son abonnement.
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (Platform.OS !== 'web') return { status: 'unsupported' };

  try {
    const cred = await signInWithPopup(auth, buildProvider());
    if (__DEV__) console.log('[google] popup OK uid=', cred.user.uid, 'email=', cred.user.email);
    return { status: 'signed-in', user: cred.user };
  } catch (e: any) {
    const code: string = e?.code ?? '';
    if (__DEV__) console.log('[google] popup échoué', code);

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { status: 'cancelled' };
    }

    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-environment') {
      try {
        if (__DEV__) console.log('[google] popup bloqué par le navigateur → repli signInWithRedirect');
        await signInWithRedirect(auth, buildProvider());
        return { status: 'redirecting' };
      } catch (redirectErr: any) {
        return { status: 'error', code: redirectErr?.code ?? 'auth/unknown' };
      }
    }

    return { status: 'error', code: code || 'auth/unknown' };
  }
}
