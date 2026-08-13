// ─────────────────────────────────────────────────────────────────────────────
// Prix affichés sur le paywall — SOURCE UNIQUE pour les 2 écrans
// (app/(onboarding)/pricing.tsx et app/(app)/pricing-upgrade.tsx).
// ─────────────────────────────────────────────────────────────────────────────
// - WEB, ou NATIF INERTE (STORES_ACTIVE=false) : prix USD indicatifs
//   (PRICES / formatUSD), comportement INCHANGÉ. Sur web, Paddle affiche de toute
//   façon le vrai prix localisé au checkout.
// - NATIF + STORES_ACTIVE : prix RÉELS localisés d'Adapty/Play (localizedString),
//   TOUT-OU-RIEN sur les 3 produits (chargement / erreur gérés → l'appelant
//   désactive l'achat et propose « Réessayer »). Conformité Google : le prix
//   affiché = le prix facturé.
//
// Carte annuelle : option A = cadrage « /mois » calculé depuis le montant localisé,
// AVEC le total annuel toujours affiché. Repli automatique option B (total annuel
// « /an ») si Intl échoue OU si un montant dérivé s'arrondit à zéro
// (formatLocalizedMoney → null). Mensuel + lifetime : localizedString DIRECT.

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { auth } from '../../services/firebase';
import { canPay } from '../../services/config';
import { PRICES, formatUSD, formatLocalizedMoney } from '../../services/prices';
import { nativeGetPrices, type NativePricesResult } from '../../services/purchasesNative';
import { previewPrices } from '../../services/paddle';
import { type Lang } from '../i18n/translations';

export type PriceCards = {
  lifetime: string;
  monthly: string;
  annualBig: string;
  annualUnit: 'mois' | 'an'; // 'mois' = option A, 'an' = repli option B
  // Non-null → sous-titre « Facturé {prixAn}/an · soit {prixCycle}/cycle » (option A).
  // Null → sous-titre de repli (option B).
  annualPrixAn: string | null;
  annualPrixCycle: string | null;
};

export type LocalizedPrices = {
  phase: 'web' | 'loading' | 'error' | 'ready';
  pricesReady: boolean; // true si l'achat est autorisé du point de vue prix
  cards: PriceCards;
  retry: () => void;
};

const DASH = '…';

function webCards(lang: Lang): PriceCards {
  return {
    lifetime: formatUSD(PRICES.lifetime, lang),
    monthly: formatUSD(PRICES.mensuel, lang),
    annualBig: formatUSD(PRICES.annuelParMois, lang),
    annualUnit: 'mois',
    annualPrixAn: formatUSD(PRICES.annuel, lang),
    annualPrixCycle: formatUSD(PRICES.annuelParCycle, lang),
  };
}

function placeholderCards(): PriceCards {
  return {
    lifetime: DASH,
    monthly: DASH,
    annualBig: DASH,
    annualUnit: 'mois',
    annualPrixAn: null,
    annualPrixCycle: null,
  };
}

function nativeCards(res: Extract<NativePricesResult, { ok: true }>, lang: Lang): PriceCards {
  const { mensuel, annuel, lifetime } = res.prices;
  // Annuel : option A si le /mois ET le /cycle se formatent (non nuls), sinon repli B.
  const perMonth = formatLocalizedMoney(annuel.amount / 12, annuel.currencyCode, lang);
  const perCycle = formatLocalizedMoney(annuel.amount / 365, annuel.currencyCode, lang);
  if (perMonth && perCycle) {
    return {
      lifetime: lifetime.localized,
      monthly: mensuel.localized,
      annualBig: perMonth,
      annualUnit: 'mois',
      annualPrixAn: annuel.localized, // total réellement facturé — toujours visible
      annualPrixCycle: perCycle,
    };
  }
  // Repli option B : total annuel « /an », aucun montant dérivé.
  return {
    lifetime: lifetime.localized,
    monthly: mensuel.localized,
    annualBig: annuel.localized,
    annualUnit: 'an',
    annualPrixAn: null,
    annualPrixCycle: null,
  };
}

export function useLocalizedPrices(lang: Lang): LocalizedPrices {
  // NATIF (Adapty) : INCHANGÉ — même condition, même fetch, mêmes phases.
  const useNative = Platform.OS !== 'web' && canPay();
  // WEB (Paddle PricePreview) : nouveau chemin, prix localisés en direct.
  const useWeb = Platform.OS === 'web' && canPay();
  // Les deux chemins « live » partagent la machinerie loading/error/ready +
  // nativeCards + tout-ou-rien. Sinon (natif-inerte, ou web sans Paddle) : le
  // fallback USD statique historique reste EXACTEMENT tel quel.
  const useFetch = useNative || useWeb;

  const [res, setRes] = useState<NativePricesResult | 'loading'>(
    useFetch ? 'loading' : { ok: false },
  );

  const load = useCallback(() => {
    if (!useFetch) return;
    setRes('loading');
    // WEB → Paddle (anonyme, pas d'uid) ; NATIF → Adapty (uid), INCHANGÉ.
    const fetcher = useWeb
      ? previewPrices()
      : nativeGetPrices(auth.currentUser?.uid ?? '');
    fetcher.then(setRes).catch(() => setRes({ ok: false }));
  }, [useFetch, useWeb]);

  useEffect(() => {
    load();
  }, [load]);

  if (!useFetch) {
    // Natif-inerte (STORES_ACTIVE=false) ou web sans Paddle : USD statique, INCHANGÉ.
    return { phase: 'web', pricesReady: true, cards: webCards(lang), retry: () => {} };
  }
  if (res === 'loading') {
    return { phase: 'loading', pricesReady: false, cards: placeholderCards(), retry: load };
  }
  if (!res.ok) {
    return { phase: 'error', pricesReady: false, cards: placeholderCards(), retry: load };
  }
  return { phase: 'ready', pricesReady: true, cards: nativeCards(res, lang), retry: load };
}
