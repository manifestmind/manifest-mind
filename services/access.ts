// services/access.ts — Règle d'accès au contenu payant.
//
// SOURCE DE VÉRITÉ UNIQUE du gate freemium. Toute décision « cet utilisateur
// a-t-il le droit de voir le contenu ? » passe par ici, et par ici seulement.
//
// Deux points d'application, volontairement distincts et complémentaires :
//
//   1. app/(app)/_layout.tsx — le PÉRIMÈTRE. Vérifie à chaque navigation dans
//      le groupe (app). Bloque l'accès par URL directe (/affirmation, /journal…)
//      sans passer par home.
//
//   2. app/(app)/home.tsx — la TRANSITION. Le passage au cycle 8 ne vient pas
//      d'une navigation : home fait avancer `current_cycle` lui-même quand
//      minuit est passé. Au moment où le layout a vérifié la route, le cycle
//      valait encore 7 — il a donc laissé passer, à raison. C'est le gate de
//      home qui attrape la bascule, juste après l'incrément.
//
// Les deux appellent isPaywalled() : une seule règle, jamais deux copies qui
// dérivent.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEBUG_SKIP_PAYWALL, FREE_CYCLES } from './config';

/**
 * L'utilisateur doit-il être renvoyé vers le paywall ?
 *
 * Règle : au-delà de l'essai gratuit (FREE_CYCLES cycles), TOUT utilisateur
 * sans abonnement actif est bloqué. On ne regarde PAS `selected_plan` : un
 * anonyme d'essai comme un compte permanent non abonné sont paywallés au
 * cycle 8 de la même façon.
 *
 * `subscription_active` n'est jamais écrit par le client : il est posé par le
 * webhook Paddle → Firestore → useSubscriptionSync → AsyncStorage. Les règles
 * Firestore interdisent au client de le forger (cf. firestore.rules).
 *
 * FAIL-OPEN : si AsyncStorage est illisible, on renvoie `false` (accès permis).
 * Un pépin de stockage ne doit JAMAIS enfermer dehors un abonné qui a payé.
 * Même arbitrage que hasActiveSubscription() dans services/subscription.ts.
 */
export async function isPaywalled(): Promise<boolean> {
  // Court-circuit de debug (tests Expo Go sans payer). Doit être false en prod.
  if (DEBUG_SKIP_PAYWALL) return false;

  try {
    const [[, cycleRaw], [, subRaw]] = await AsyncStorage.multiGet([
      'current_cycle',
      'subscription_active',
    ]);

    const cycle = parseInt(cycleRaw || '1', 10);
    if (Number.isNaN(cycle)) return false; // valeur corrompue → fail-open

    const subActive = subRaw === 'true';

    return cycle > FREE_CYCLES && !subActive;
  } catch {
    return false; // fail-open
  }
}
