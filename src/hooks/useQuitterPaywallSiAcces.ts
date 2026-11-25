// ManifestMind — le paywall se ferme de lui-même si l'accès arrive (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// Monté par les DEUX paywalls (onboarding et mise à niveau), site et apps.
// Si la personne N'AVAIT PAS l'accès à l'ouverture du paywall et que l'accès
// arrive pendant qu'il est affiché (cache local posé par useSubscriptionSync
// après une connexion, un webhook en retard…), on quitte le paywall : vers
// l'accueil, ou vers l'écran du prénom s'il manque.
//
// Jamais : si la personne était DÉJÀ abonnée en ouvrant l'écran (« Changer
// d'abonnement » depuis les Paramètres), ni pendant un achat ou une restauration
// en cours (ces parcours mènent eux-mêmes à l'écran d'activation).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { confirmerAccesServeur } from '../../services/subscription';

const INTERVALLE_MS = 1500;
// 1.1.0 (b) : en plus du cache local, on demande au serveur toutes les 15 s tant
// que le paywall est affiché (au plus 4 lectures Firestore par minute ; arrêt dès
// que le paywall est fermé). Couvre une synchronisation arrêtée ou en retard.
const SERVEUR_TOUS_LES = 10; // 10 × 1,5 s = 15 s

export function useQuitterPaywallSiAcces(occupe: () => boolean) {
  const router = useRouter();
  const occupeRef = useRef(occupe);
  occupeRef.current = occupe;

  useEffect(() => {
    let annule = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    (async () => {
      let initial: string | null = null;
      try {
        initial = await AsyncStorage.getItem('subscription_active');
      } catch {
        return;
      }
      if (annule || initial === 'true') return; // déjà abonnée à l'ouverture
      let tour = 0;
      timer = setInterval(async () => {
        if (annule || occupeRef.current()) return;
        tour += 1;
        try {
          if ((await AsyncStorage.getItem('subscription_active')) !== 'true') {
            if (tour % SERVEUR_TOUS_LES !== 0) return;
            // confirmerAccesServeur pose le cache local si l'accès est actif.
            if (annule || !(await confirmerAccesServeur()) || annule) return;
          }
          if (timer) clearInterval(timer);
          annule = true;
          await AsyncStorage.setItem('onboarding_completed', 'true');
          const nom = await AsyncStorage.getItem('user_name');
          router.replace((nom ? '/(app)/home' : '/(app)/name') as any);
        } catch {
          // lecture impossible : on réessaie au prochain passage
        }
      }, INTERVALLE_MS);
    })();
    return () => {
      annule = true;
      if (timer) clearInterval(timer);
    };
  }, []);
}
