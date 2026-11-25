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
import { confirmerAccesServeur } from './subscription';

/**
 * L'utilisateur doit-il être renvoyé vers le paywall ?
 *
 * Règle : au-delà de FREE_CYCLES cycles, TOUT utilisateur sans abonnement
 * actif est bloqué. Depuis la 1.1.0, FREE_CYCLES = 0 → payant dès l'ouverture :
 * tout non-abonné est bloqué dès le cycle 1. On ne regarde PAS `selected_plan` :
 * un anonyme comme un compte permanent non abonné sont bloqués de la même façon.
 *
 * `subscription_active` n'est jamais écrit par le client : il est posé par le
 * webhook Paddle → Firestore → useSubscriptionSync → AsyncStorage. Les règles
 * Firestore interdisent au client de le forger (cf. firestore.rules).
 *
 * FAIL-OPEN : si AsyncStorage est illisible, on renvoie `false` (accès permis).
 * Un pépin de stockage ne doit JAMAIS enfermer dehors un abonné qui a payé.
 * Même arbitrage que hasActiveSubscription() dans services/subscription.ts.
 */
/**
 * L'utilisateur a-t-il un abonnement actif ?
 *
 * ⚠️ CE N'EST PAS L'INVERSE DE isPaywalled(). Trois états, pas deux :
 *   - essai en cours (cycle ≤ FREE_CYCLES, pas d'abonnement)
 *       → isPaywalled() = false  ET  isSubscriber() = false
 *   - essai épuisé (cycle > FREE_CYCLES, pas d'abonnement)
 *       → isPaywalled() = true   ET  isSubscriber() = false
 *   - abonné
 *       → isPaywalled() = false  ET  isSubscriber() = true
 *
 * Autrement dit, un utilisateur d'essai au cycle 3 n'est PAS bloqué, mais il
 * n'est PAS abonné non plus. Utiliser `!isPaywalled()` comme preuve
 * d'abonnement lui ouvrirait des fonctions réservées aux abonnés.
 *
 * Sert à réserver aux abonnés « Réinitialiser ma progression » (profil.tsx) :
 * pour un utilisateur d'essai, remettre le compteur à zéro reviendrait à se
 * redonner FREE_CYCLES cycles gratuits, en boucle (cf. A.3 dans CLAUDE_MASTER).
 *
 * FAIL-CLOSED, à l'inverse d'isPaywalled() : en cas d'erreur de lecture on
 * renvoie `false` (= pas abonné). Ici, se tromper dans le sens permissif
 * rouvrirait la faille ; dans le sens restrictif, un abonné voit juste une
 * fonction annexe disparaître le temps d'un rechargement.
 */
export async function isSubscriber(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem('subscription_active')) === 'true';
  } catch {
    return false; // fail-closed
  }
}

export async function isPaywalled(): Promise<boolean> {
  // Court-circuit de debug (tests Expo Go sans payer). Doit être false en prod.
  if (DEBUG_SKIP_PAYWALL) return false;

  try {
    const [[, cycleRaw], [, subRaw]] = await AsyncStorage.multiGet([
      'current_cycle',
      'subscription_active',
    ]);

    // 1.1.0 (f) : valeur de cycle illisible → traitée comme un cycle payant
    // (avant : accès laissé ouvert = accès gratuit complet, maintenant que l'app
    // est payante dès l'ouverture).
    const lu = parseInt(cycleRaw || '1', 10);
    const cycle = Number.isNaN(lu) ? FREE_CYCLES + 1 : lu;

    const subActive = subRaw === 'true';

    if (!(cycle > FREE_CYCLES && !subActive)) return false;
  } catch {
    // 1.1.0 (f) : stockage en erreur → on ne laisse plus tout passer : on
    // demande au serveur ci-dessous.
  }
  // 1.1.0 : le cache local dit « pas d'accès » — il peut simplement ne pas être
  // encore posé (juste après une connexion, au lancement). On demande au
  // serveur AVANT de bloquer. Hors ligne / erreur → bloqué, comme avant.
  return !(await confirmerAccesServeur());
}
