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
