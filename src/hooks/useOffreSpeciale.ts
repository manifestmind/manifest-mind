// ManifestMind — minuterie de l'offre annuelle spéciale (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// Monté par les DEUX paywalls (onboarding et mise à niveau), sur le site comme
// dans les apps. À l'ouverture du paywall :
//   1. compte la visite (services/offreSpeciale.ts) ;
//   2. dès la 2ᵉ visite, charge le prix de l'offre dans la console (Paddle sur
//      le site, Google Play / App Store via Adapty dans les apps) ;
//   3. 30 s après l'ouverture, affiche la fenêtre — sauf si la personne est
//      abonnée entre-temps, ou si un achat est en cours.
// Sans prix fiable (produit absent, réseau…), l'offre ne s'affiche jamais.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { auth } from '../../services/firebase';
import { canPay } from '../../services/config';
import { OFFRE_DELAI_MS, OFFRE_VISITE_MIN, enregistrerVisitePaywall } from '../../services/offreSpeciale';
import { previewOfferPrice } from '../../services/paddle';
import { nativeGetOfferPrice } from '../../services/purchasesNative';

export type OffreSpeciale = {
  prix: string | null; // prix formaté par la console, null tant qu'inconnu
  visible: boolean; // fenêtre ouverte
  revelee: boolean; // la carte de l'offre est affichée dans la liste
  fermer: () => void;
  choisir: () => void; // ferme la fenêtre et révèle la carte de l'offre
};

export function useOffreSpeciale(occupe: () => boolean): OffreSpeciale {
  const [prix, setPrix] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [revelee, setRevelee] = useState(false);
  const occupeRef = useRef(occupe);
  occupeRef.current = occupe;

  useEffect(() => {
    if (!canPay()) return;
    const ouverture = Date.now();
    let annule = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      const visites = await enregistrerVisitePaywall();
      if (annule || visites < OFFRE_VISITE_MIN) return;
      const info =
        Platform.OS === 'web'
          ? await previewOfferPrice()
          : await nativeGetOfferPrice(auth.currentUser?.uid ?? '');
      if (annule || !info) return;
      setPrix(info.localized);
      timer = setTimeout(async () => {
        if (annule || occupeRef.current()) return;
        try {
          if ((await AsyncStorage.getItem('subscription_active')) === 'true') return;
        } catch {
          // lecture impossible : on n'affiche pas (jamais sur une info incertaine)
          return;
        }
        if (!annule) setVisible(true);
      }, Math.max(0, OFFRE_DELAI_MS - (Date.now() - ouverture)));
    })();
    return () => {
      annule = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return {
    prix,
    visible,
    revelee,
    fermer: () => setVisible(false),
    choisir: () => {
      setVisible(false);
      setRevelee(true);
    },
  };
}
