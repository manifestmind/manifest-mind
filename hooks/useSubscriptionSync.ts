// useSubscriptionSync — listener Firestore qui synchronise subscription_active
// vers AsyncStorage.
//
// Architecture cible :
//   1. Backend webhook (Paddle ou RevenueCat) écrit users/{uid}.subscription_active
//      = true dans Firestore après validation HMAC.
//   2. Ce hook, monté au root layout, écoute users/{uid} en temps réel via
//      onSnapshot dès qu'un Firebase user est connecté.
//   3. Quand le doc change, on lit le champ subscription_active et on écrit
//      sa valeur ('true' ou null) dans AsyncStorage.
//   4. Le gate home.tsx lit AsyncStorage et lève le paywall au prochain focus.
//
// Single source of truth : Firestore. AsyncStorage est un cache local pour
// lecture rapide synchrone (le gate home.tsx ne peut pas attendre Firestore).
//
// Sécurité : aucune écriture optimiste côté client. Seul ce hook écrit
// subscription_active dans AsyncStorage, et il ne le fait qu'en lisant la
// valeur Firestore (elle-même posée par le webhook serveur).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { auth, db } from '../services/firebase';

export function useSubscriptionSync() {
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    function attachFirestoreListener(user: User) {
      // Nettoyage d'un éventuel listener précédent (changement d'utilisateur).
      unsubscribeFirestore?.();

      const userDocRef = doc(db, 'users', user.uid);
      unsubscribeFirestore = onSnapshot(
        userDocRef,
        async (snap) => {
          try {
            const subActive = snap.exists() && snap.data()?.subscription_active === true;
            if (subActive) {
              // `had_subscription` = marqueur d'appareil, volontairement JAMAIS
              // retiré ici ni à la déconnexion : il sert à reconnaître un ancien
              // abonné qui revient (cf. services/subscription.ts). Seul
              // « Supprimer mon compte » (AsyncStorage.clear()) l'efface.
              await AsyncStorage.multiSet([
                ['subscription_active', 'true'],
                ['had_subscription', 'true'],
              ]);
            } else {
              await AsyncStorage.removeItem('subscription_active');
            }
          } catch {
            // AsyncStorage indisponible — on retentera à la prochaine update.
          }
        },
        () => {
          // Erreur Firestore (offline, rules, etc.) — on ne touche pas à
          // AsyncStorage pour ne pas invalider à tort un état déjà payé.
        },
      );
    }

    function detachFirestoreListener() {
      unsubscribeFirestore?.();
      unsubscribeFirestore = null;
    }

    // Purge des droits hérités à tout CHANGEMENT d'identité.
    //
    // `subscription_active` est un cache local ; il appartient à l'UID qui l'a
    // fait écrire. Si l'utilisateur connecté change (reconnexion magic link,
    // Google demain, nouvel anonyme…), l'ancienne valeur n'est plus la sienne :
    // on l'efface AVANT d'écouter Firestore. Sans ça, deux trous :
    //   - le gate de home.tsx lit AsyncStorage immédiatement après la bascule,
    //     avant l'arrivée du 1er snapshot → accès accordé à tort le temps de la
    //     synchro ;
    //   - si Firestore est injoignable (hors ligne, règles, panne), le handler
    //     d'erreur ci-dessus ne touche volontairement à rien → la clé résiduelle
    //     survivrait indéfiniment sur un compte qui n'a jamais payé.
    //
    // On ne purge QUE si l'UID a réellement changé : à un simple rechargement de
    // page (même UID), effacer puis reposer la clé ferait rebondir un abonné
    // légitime sur le paywall pendant la fenêtre de synchro.
    async function purgeIfIdentityChanged(uid: string | null) {
      try {
        const lastUid = await AsyncStorage.getItem('sub_sync_uid');
        if (lastUid === uid) return;
        await AsyncStorage.removeItem('subscription_active');
        if (uid) {
          await AsyncStorage.setItem('sub_sync_uid', uid);
        } else {
          await AsyncStorage.removeItem('sub_sync_uid');
        }
        if (__DEV__) console.log('[subSync] identité changée', lastUid, '→', uid, '— subscription_active purgé');
      } catch {
        // AsyncStorage indisponible — le snapshot Firestore fera foi.
      }
    }

    // La purge doit être TERMINÉE avant que le listener ne s'attache : sinon son
    // removeItem() pourrait s'exécuter APRÈS le 1er snapshot et effacer un
    // `subscription_active='true'` légitime tout juste reposé — l'abonné se
    // retrouverait bloqué jusqu'au prochain rechargement.
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await purgeIfIdentityChanged(user.uid);
        attachFirestoreListener(user);
      } else {
        // Plus d'identité → plus d'accès premium.
        detachFirestoreListener();
        await purgeIfIdentityChanged(null);
      }
    });

    return () => {
      unsubscribeAuth();
      detachFirestoreListener();
    };
  }, []);
}
