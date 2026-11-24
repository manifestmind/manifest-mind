// ─────────────────────────────────────────────────────────────────────────────
// Prix affichés sur le paywall — SOURCE UNIQUE pour les 2 écrans
// (app/(onboarding)/pricing.tsx et app/(app)/pricing-upgrade.tsx).
// ─────────────────────────────────────────────────────────────────────────────
// - WEB (canPay) : prix RÉELS localisés récupérés EN DIRECT via Paddle
//   (Paddle.PricePreview → services/paddle.ts previewPrices). Même machinerie
//   tout-ou-rien que le natif ci-dessous.
// - NATIF INERTE (STORES_ACTIVE=false) : aucune source de prix vivante et aucune
//   vente possible → placeholder « … », achat désactivé (plus AUCUN prix en dur).
// - NATIF + STORES_ACTIVE : prix RÉELS localisés d'Adapty/Play (localizedString),
//   TOUT-OU-RIEN sur les 3 produits (chargement / erreur gérés → l'appelant
//   désactive l'achat et propose « Réessayer »). Conformité Google : le prix
//   affiché = le prix facturé.
//
// ─────────────────────────────────────────────────────────────────────────────
// CARTE ANNUELLE — HIÉRARCHIE IMPOSÉE PAR LES DEUX MAGASINS (corrigé 2026-08-22)
// ─────────────────────────────────────────────────────────────────────────────
// Le MONTANT RÉELLEMENT FACTURÉ (total annuel) occupe TOUJOURS la place
// dominante. Le prix par mois est CALCULÉ : il est subordonné, en sous-titre.
//
// 🔴 NE JAMAIS RE-INVERSER. Rejet Apple du 2026-08-22, règle 3.1.2(c) :
// « L'abonnement renouvelable affiche le prix calculé par an de manière plus
// claire et plus visible que le montant facturé. » Tout élément autre que le
// montant facturé (essai, prix d'introduction, prix calculé) doit être
// subordonné en POSITION et en TAILLE — police, taille, couleur, emplacement.
// Google porte la MÊME exigence (politique Play sur les abonnements) : interdit
// d'« afficher le plus en évidence le prix sous forme de coût mensuel décomposé
// plutôt que ce qui sera réellement facturé ». Ce n'était donc pas qu'un sujet
// Apple : l'app était non conforme EN PRODUCTION sur Play.
//
// Le prix par mois reste affiché (utile à la comparaison) mais uniquement en
// sous-titre 10 px gris, contre 20 px serif coloré pour le montant facturé.
// Si le calcul échoue (Intl indisponible, arrondi à zéro), il disparaît
// simplement : le montant facturé, lui, est toujours là.
// Mensuel + lifetime : localizedString DIRECT — le montant affiché EST le
// montant prélevé, donc déjà conformes, RIEN À Y CHANGER.

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { auth } from '../../services/firebase';
import { canPay } from '../../services/config';
import { formatLocalizedMoney } from '../../services/prices';
import { nativeGetPrices, type NativePricesResult } from '../../services/purchasesNative';
import { previewPrices } from '../../services/paddle';
import { type Lang } from '../i18n/translations';

export type PriceCards = {
  lifetime: string;
  monthly: string;
  // TOUJOURS le montant FACTURÉ (total annuel), jamais un montant calculé.
  annualBig: string;
  // Prix par mois CALCULÉ, subordonné → sous-titre « soit {prix}/mois ».
  // Null si le calcul échoue → sous-titre de repli, sans aucun prix dérivé.
  annualPrixMois: string | null;
};

export type LocalizedPrices = {
  phase: 'web' | 'loading' | 'error' | 'ready';
  pricesReady: boolean; // true si l'achat est autorisé du point de vue prix
  cards: PriceCards;
  retry: () => void;
};

const DASH = '…';

function placeholderCards(): PriceCards {
  return {
    lifetime: DASH,
    monthly: DASH,
    annualBig: DASH,
    annualPrixMois: null,
  };
}

function nativeCards(res: Extract<NativePricesResult, { ok: true }>, lang: Lang): PriceCards {
  const { mensuel, annuel, lifetime } = res.prices;
  // `annuel.localized` = le montant RÉELLEMENT FACTURÉ, tel que formaté par le
  // store. Il occupe la place dominante dans TOUS les cas — y compris si le
  // calcul du /mois échoue ci-dessous. C'est l'invariant exigé par Apple 3.1.2(c)
  // et par la politique Play : jamais un montant calculé au-dessus de lui.
  const perMonth = formatLocalizedMoney(annuel.amount / 12, annuel.currencyCode, lang);
  return {
    lifetime: lifetime.localized,
    monthly: mensuel.localized,
    annualBig: annuel.localized,
    // Subordonné, et facultatif : si Intl échoue ou si le montant s'arrondit à
    // zéro, on n'affiche simplement aucun prix dérivé. Le prix par CYCLE a été
    // retiré le 2026-08-22 — un montant calculé de moins après deux rejets.
    annualPrixMois: perMonth,
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
    // Natif-inerte (STORES_ACTIVE=false) ou web sans Paddle : aucune source de prix
    // vivante ET aucune vente possible (canPay()=false bloque l'achat en aval). On
    // n'affiche donc PAS de prix (plus aucune valeur USD en dur) : placeholder « … »
    // + achat désactivé. Le plan gratuit, non gaté par pricesReady, reste utilisable.
    return { phase: 'web', pricesReady: false, cards: placeholderCards(), retry: () => {} };
  }
  if (res === 'loading') {
    return { phase: 'loading', pricesReady: false, cards: placeholderCards(), retry: load };
  }
  if (!res.ok) {
    return { phase: 'error', pricesReady: false, cards: placeholderCards(), retry: load };
  }
  return { phase: 'ready', pricesReady: true, cards: nativeCards(res, lang), retry: load };
}
