// Détection d'abonnement — deux niveaux, deux usages distincts.
//
// 1. `deviceHadSubscription()` — marqueur LOCAL (AsyncStorage `had_subscription`).
//    Posé par useSubscriptionSync la première fois qu'un abonnement actif est
//    constaté sur cet appareil, et JAMAIS retiré par la déconnexion (il ne
//    figure pas dans le multiRemove de parametres.tsx). Il ne prouve pas qu'un
//    abonnement est actif MAINTENANT — il dit seulement « quelqu'un a déjà payé
//    depuis cet appareil ». Sert à poser la question au clic « essai gratuit »
//    plutôt que de laisser l'utilisateur se fabriquer un compte anonyme neuf et
//    perdre l'accès à son abonnement. Effacé par « Supprimer mon compte »
//    (AsyncStorage.clear()), ce qui est le comportement voulu.
//
// 2. `hasActiveSubscription(uid)` — vérité SERVEUR (Firestore users/{uid}).
//    Lue une fois, juste après authentification et AVANT d'ouvrir Paddle : si
//    l'utilisateur est déjà abonné, on ne le fait pas payer une seconde fois.
//    C'est le vrai garde-fou : il rattrape aussi bien l'abonné qui a cliqué
//    « essai gratuit » par erreur que celui qui se reconnecte au paywall.
//
// En cas d'échec de lecture Firestore (hors ligne, règles, panne), on renvoie
// `false` — on laisse donc le paiement se faire. Arbitrage assumé : hors ligne,
// le checkout Paddle échouerait de toute façon, et bloquer un client légitime
// coûte plus cher qu'un remboursement exceptionnel.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function hasActiveSubscription(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() && snap.data()?.subscription_active === true;
  } catch (e) {
    if (__DEV__) console.log('[subscription] lecture Firestore échouée', e);
    return false;
  }
}

export async function deviceHadSubscription(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem('had_subscription')) === 'true';
  } catch {
    return false;
  }
}

// 1.1.0 — Accès confirmé PAR LE SERVEUR pour le compte connecté.
// Payant dès l'ouverture : juste après une connexion (ou un lancement à froid),
// le cache local `subscription_active` n'est pas encore posé par
// useSubscriptionSync → un abonné était envoyé sur le paywall (constaté le
// 2026-11-25 avec le compte de démonstration des examinateurs Google). On lit
// Firestore ; si l'accès est actif, on pose le cache local (avec `sub_sync_uid`,
// pour que la purge de changement d'identité ne l'efface pas). Hors ligne ou
// erreur → false : on ne débloque jamais dans le doute.
export async function confirmerAccesServeur(): Promise<boolean> {
  try {
    await auth.authStateReady();
  } catch {
    // on continue avec l'état connu
  }
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  if (!(await hasActiveSubscription(uid))) return false;
  try {
    await AsyncStorage.multiSet([
      ['subscription_active', 'true'],
      ['had_subscription', 'true'],
      ['sub_sync_uid', uid],
    ]);
  } catch {
    // cache indisponible : l'accès est tout de même confirmé
  }
  return true;
}
