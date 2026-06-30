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
              await AsyncStorage.setItem('subscription_active', 'true');
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

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        attachFirestoreListener(user);
      } else {
        detachFirestoreListener();
      }
    });

    return () => {
      unsubscribeAuth();
      detachFirestoreListener();
    };
  }, []);
}
