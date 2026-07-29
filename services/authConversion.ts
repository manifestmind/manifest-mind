// Conversion d'un compte anonyme (essai gratuit) en compte permanent
// email+password, SANS friction et SANS perte de progression.
//
// Modèle (Option A) : la progression est locale (AsyncStorage), non clé par
// UID → elle survit quoi qu'il arrive à la conversion. L'UID ne sert qu'à
// rattacher le paiement Paddle au bon doc Firestore (webhook → subscription_active).
//
// linkWithCredential upgrade le compte anonyme EN PLACE : l'UID est conservé.

import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export type ConversionResult =
  | { ok: true; user: User }
  | { ok: false; code: string };

// Messages d'erreur localisés (bloc t.compte).
type ConversionMessages = {
  errEmailInvalide: string;
  errPasswordCourt: string;
  errEmailDejaUtilise: string;
  errReseau: string;
  errGenerique: string;
};

// Traduit un code d'erreur Firebase en message utilisateur (via t.compte).
export function mapConversionError(code: string, msg: ConversionMessages): string {
  switch (code) {
    case 'auth/invalid-email':
      return msg.errEmailInvalide;
    case 'auth/weak-password':
      return msg.errPasswordCourt;
    // Email connu mais connexion impossible avec ce mot de passe. Pour un compte
    // créé par magic link (jamais de mot de passe), il n'y a AUCUN mot de passe à
    // se rappeler — l'ancien message « mot de passe incorrect » envoyait chercher
    // une chose qui n'existe pas. Message honnête : « connecte-toi ».
    case 'mm/email-exists-signin-failed':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return msg.errEmailDejaUtilise;
    case 'auth/network-request-failed':
      return msg.errReseau;
    default:
      return msg.errGenerique;
  }
}

// true si l'utilisateur courant n'a pas de compte permanent (anonyme ou absent)
// → il faut lui demander email + mot de passe avant de payer.
export function needsAccount(): boolean {
  const u = auth.currentUser;
  return !u || u.isAnonymous;
}

// Convertit / connecte selon l'état courant :
//   - anonyme            → linkWithCredential (upgrade in-place, UID conservé)
//   - aucun user         → createUserWithEmailAndPassword (ex. anon échoué offline)
//   - déjà permanent     → renvoie l'utilisateur courant tel quel
//   - email déjà utilisé → signInWithEmailAndPassword sur le compte existant
//                          (progression locale intacte car non clé par UID)
export async function convertOrSignIn(
  email: string,
  password: string,
): Promise<ConversionResult> {
  const user = auth.currentUser;
  try {
    if (user && user.isAnonymous) {
      const cred = EmailAuthProvider.credential(email, password);
      const res = await linkWithCredential(user, cred);
      return { ok: true, user: res.user };
    }
    if (!user) {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      return { ok: true, user: res.user };
    }
    return { ok: true, user };
  } catch (e: any) {
    const code: string = e?.code ?? '';
    if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
      // Email déjà enregistré → on connecte au compte existant avec ce mot de passe.
      try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        return { ok: true, user: res.user };
      } catch (signInErr: any) {
        const sc: string = signInErr?.code ?? '';
        // Le réseau reste distingué (message « réessaie »).
        if (sc === 'auth/network-request-failed') return { ok: false, code: sc };
        // Tout autre échec ici = l'email a bien un compte, mais on n'a pas pu s'y
        // connecter avec ce mot de passe (mauvais mot de passe, OU compte magic
        // link sans mot de passe, OU compte Google-only). Code dédié → l'appelant
        // affiche « cet e-mail a déjà un compte, connecte-toi » + bouton de
        // reconnexion, au lieu du trompeur « mot de passe incorrect ».
        return { ok: false, code: 'mm/email-exists-signin-failed' };
      }
    }
    return { ok: false, code: code || 'auth/unknown' };
  }
}

// Conversion LINK-ONLY (carte post-achat natif Q2) : upgrade EN PLACE du compte
// anonyme → UID CONSERVÉ (l'abonnement qu'on vient de payer reste sur SON doc).
// N'utilise PAS convertOrSignIn : celle-ci, sur « e-mail déjà pris », se CONNECTE
// à un autre compte → bascule d'UID → abonnement orphelin. Ici, « e-mail déjà
// pris » = erreur propre renvoyée telle quelle, on ne bascule JAMAIS d'UID.
// Après le link : e-mail de vérification (langue = auth.languageCode posée juste
// avant l'envoi). L'envoi est NON critique : le compte est créé même s'il échoue.
export async function linkAnonymousEmail(
  email: string,
  password: string,
  lang: string,
): Promise<ConversionResult> {
  const user = auth.currentUser;
  if (!user || !user.isAnonymous) {
    return { ok: false, code: 'mm/not-anonymous' };
  }
  try {
    const cred = EmailAuthProvider.credential(email, password);
    const res = await linkWithCredential(user, cred);
    try {
      auth.languageCode = lang;
      await sendEmailVerification(res.user);
    } catch {
      // E-mail de vérification non critique : le compte EST créé (même UID). On
      // ne fait pas échouer la conversion pour un échec d'envoi.
    }
    return { ok: true, user: res.user };
  } catch (e: any) {
    return { ok: false, code: e?.code ?? 'auth/unknown' };
  }
}
