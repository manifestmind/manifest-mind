// -----------------------------------------------------------------------------
// ManifestMind - formatage des prix localises (cote UI)
// -----------------------------------------------------------------------------
//
// Les PRIX ne sont plus codes en dur : ils viennent EN DIRECT de la plateforme.
//   - WEB   : Paddle.PricePreview  (services/paddle.ts -> previewPrices)
//   - NATIF : Adapty               (services/purchasesNative.ts -> nativeGetPrices)
// Les deux renvoient un prix DEJA formate et localise (localizedString). Ce
// fichier ne garde que le formateur ci-dessous, utilise pour DERIVER les
// sous-montants de la carte annuelle (par mois / par cycle) a partir du montant
// numerique localise - jamais pour inventer un prix.
//
// (Historique : l'ancienne constante `PRICES` + `formatUSD` - valeurs USD codees
// en dur - ont ete supprimees le 2026-08-13 une fois le fetch Paddle web valide
// en production. Plus aucune valeur de prix en dur dans le code.)

import { type Lang } from '../src/i18n/translations';

// Formatage localise d'un montant (prix Adapty/Play/Paddle localises).
// Utilise Intl.NumberFormat (style currency) avec le currencyCode fourni ->
// symbole + separateurs + decimales corrects selon la devise (le yen/won sans
// decimales, etc.), sans formateur maison fragile.
//
// DETECTION RUNTIME + REPLI : renvoie `null` si
//   - Intl leve une exception (Hermes sans ICU, code devise invalide...), OU
//   - la sortie ne contient AUCUN chiffre non-nul (Intl absent/stub renvoyant du
//     vide, OU montant arrondi a ZERO dans la devise - ex. « 0,00 EUR »).
// L'appelant retombe alors sur l'option B (afficher le total tel quel, jamais un
// prix bricole ni un « 0,00 »).
export function formatLocalizedMoney(
  amount: number,
  currencyCode: string,
  lang: Lang,
): string | null {
  try {
    if (!currencyCode || !Number.isFinite(amount)) return null;
    const s = new Intl.NumberFormat(lang, { style: 'currency', currency: currencyCode }).format(amount);
    // Doit contenir au moins un chiffre NON nul, sinon Intl indisponible/stub ou
    // arrondi a zero -> on ne l'affiche pas.
    if (!/[1-9]/.test(s)) return null;
    return s;
  } catch {
    return null;
  }
}
