// Finalisation d'une session authentifiée — commune à TOUS les providers.
//
// Extrait du DeepLinkHandler (_layout.tsx), qui était le seul à savoir le faire
// pour le magic link. Google (et Apple demain) a besoin exactement des mêmes
// étapes : sans ce helper, on dupliquerait la logique à chaque provider et une
// divergence finirait par s'installer.
//
// Ce que « finaliser » veut dire :
//   1. Initialiser les clés de cycle SI elles sont absentes (première entrée
//      dans l'app, ou appareil neuf). On ne les écrase JAMAIS si elles existent :
//      la progression est locale (Option A) et doit survivre à une reconnexion.
//   2. Poser onboarding_completed → index.tsx routera vers splash aux prochains
//      démarrages au lieu de renvoyer sur l'onboarding.
//   3. Router vers splash.
//
// Note : le paywall n'est PAS géré ici. C'est le gate de home.tsx qui décide, en
// aval, en lisant subscription_active (posée par useSubscriptionSync depuis
// Firestore). Un utilisateur au cycle 1 entre donc légitimement dans l'app.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const INITIAL_STEP_STATUS = {
  opening: false,
  affirmation: false,
  action_easy: false,
  action_hard: false,
  visualisation: false,
  journal: false,
  vision_board: false,
};

const INITIAL_EARNED_POINTS = {
  opening: 0,
  affirmation: 0,
  action_easy: 0,
  action_hard: 0,
  visualisation: 0,
  journal: 0,
  vision_board: 0,
};

export async function finalizeSignIn(): Promise<void> {
  try {
    // Init du cycle UNIQUEMENT si absent — ne jamais écraser une progression.
    const cycle = await AsyncStorage.getItem('current_cycle');
    if (!cycle) {
      await AsyncStorage.multiSet([
        ['current_cycle', '1'],
        ['current_theme', '1'],
        ['cycle_completed', 'false'],
        ['cycle_points', '0'],
        ['points_total', '0'],
        ['cycle_step_status', JSON.stringify(INITIAL_STEP_STATUS)],
        ['cycle_earned_points', JSON.stringify(INITIAL_EARNED_POINTS)],
      ]);
    }
    await AsyncStorage.setItem('onboarding_completed', 'true');
  } catch {
    // AsyncStorage indisponible — on route quand même : home.tsx sait
    // réinitialiser les clés manquantes au chargement.
  }
  router.replace('/(app)/splash' as any);
}
