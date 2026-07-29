// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — prix affichés (SOURCE DE VÉRITÉ UNIQUE côté UI)
// ─────────────────────────────────────────────────────────────────────────────
//
// L'app vend en DOLLARS US uniquement, quel que soit le pays (catalogue Paddle
// prod ET sandbox configurés en USD, devise unique).
//
// ⚠️ Ces montants sont AFFICHAGE SEULEMENT : la facturation réelle vient des
// price IDs Paddle (.env, EXPO_PUBLIC_PADDLE_PRICE_*). À maintenir en phase
// avec le dashboard Paddle À LA MAIN (contrepartie assumée de l'Option A,
// cf. claude_master.md point 13) — le vrai montant s'affiche de toute façon
// dans l'overlay Paddle au checkout.
//
// Ne JAMAIS ré-écrire un montant en dur dans un écran : toujours passer par
// PRICES + formatUSD.

import { type Lang } from '../src/i18n/translations';

export const PRICES = {
  lifetime: 149,
  mensuel: 12.99,
  annuel: 79,
  // 79 / 12 = 6,583… → arrondi marketing, tête de la carte annuelle.
  annuelParMois: 6.58,
  // 79 / 365 = 0,216… → arrondi SUPÉRIEUR (ne jamais sous-annoncer un coût).
  annuelParCycle: 0.22,
} as const;

// Formateur manuel volontaire — PAS d'Intl.NumberFormat : il rend « 12,99 $US »
// en fr/es et son support React Native est partiel.
//   en    → $149 · $12.99   (symbole avant, point décimal)
//   fr/es → 149 $ · 12,99 $ (virgule décimale, symbole après, espace INSÉCABLE
//               pour ne jamais orpheliner le $ sur une nouvelle ligne)
// Les montants entiers s'affichent sans décimales ($149, pas $149.00).
export function formatUSD(montant: number, lang: Lang): string {
  const brut = Number.isInteger(montant) ? String(montant) : montant.toFixed(2);
  if (lang === 'en') {
    return `$${brut}`;
  }
  return `${brut.replace('.', ',')}\u00A0$`;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Formatage localis\u00E9 d'un montant (NATIF \u2014 prix Adapty/Play localis\u00E9s).
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Utilise Intl.NumberFormat (style currency) avec le currencyCode d'Adapty \u2192
// symbole + s\u00E9parateurs + d\u00E9cimales corrects selon la devise (le yen/won sans
// d\u00E9cimales, etc.), sans formateur maison fragile.
//
// D\u00C9TECTION RUNTIME + REPLI : renvoie `null` si
//   - Intl l\u00E8ve une exception (Hermes sans ICU, code devise invalide\u2026), OU
//   - la sortie ne contient AUCUN chiffre non-nul (Intl absent/stub renvoyant du
//     vide, OU montant arrondi \u00E0 Z\u00C9RO dans la devise \u2014 ex. \u00AB 0,00 \u20AC \u00BB).
// L'appelant retombe alors sur l'option B (afficher le total tel quel, jamais un
// prix bricol\u00E9 ni un \u00AB 0,00 \u00BB).
export function formatLocalizedMoney(
  amount: number,
  currencyCode: string,
  lang: Lang,
): string | null {
  try {
    if (!currencyCode || !Number.isFinite(amount)) return null;
    const s = new Intl.NumberFormat(lang, { style: 'currency', currency: currencyCode }).format(amount);
    // Doit contenir au moins un chiffre NON nul, sinon Intl indisponible/stub ou
    // arrondi \u00E0 z\u00E9ro \u2192 on ne l'affiche pas.
    if (!/[1-9]/.test(s)) return null;
    return s;
  } catch {
    return null;
  }
}
