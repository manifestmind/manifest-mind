// ManifestMind — niveaux, jauges et tours (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// SOURCE UNIQUE du calcul des niveaux. Avant la 1.1.0, la même règle était
// recopiée dans 8 fichiers (6 écrans d'étape, accueil, partage). Les copies
// étaient identiques, à une différence près conservée ici : les écrans d'étape
// font vibrer le téléphone au palier, l'accueil non (option `haptics`).
//
// Règle (inchangée) : 36 500 points par tour ; niveau selon le pourcentage
// atteint — < 25 % · < 50 % · < 75 % · au-delà.
//
// Tours (1.1.0) : après le cycle 365, un nouveau tour recommence au cycle 1 avec
// des points remis à zéro (`points_total` = points du TOUR EN COURS). Le tour 1
// garde les noms historiques (Éveil · Ancrage · Expansion · Manifestation) ; les
// tours suivants ont leurs propres noms (Renouveau · Approfondissement ·
// Rayonnement · Maîtrise). Le numéro du tour vit dans `current_tour` (défaut 1).

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { Lang, Translations } from '../src/i18n/translations';

// Traductions d'UNE langue (ce que renvoie useTranslation()).
type T = Translations[Lang];

export const POINTS_PER_TOUR = 36500;
export const CYCLES_PER_TOUR = 365;
export const TOUR_KEY = 'current_tour';

// Index du niveau (0 à 3) pour un total de points du tour en cours.
export function levelIndexFor(points: number): number {
  const pct = (points / POINTS_PER_TOUR) * 100;
  if (pct < 25) return 0;
  if (pct < 50) return 1;
  if (pct < 75) return 2;
  return 3;
}

// Pourcentage de la jauge, plafonné à 100 (jamais de débordement).
export function gaugePercentFor(points: number): number {
  return Math.min(100, Math.max(0, (points / POINTS_PER_TOUR) * 100));
}

// Les 4 noms de niveau du tour donné.
export function levelNamesFor(t: T, tour: number): string[] {
  if (tour <= 1) return [t.niveaux.eveil, t.niveaux.ancrage, t.niveaux.expansion, t.niveaux.manifestation];
  const s = t.niveauxSuite;
  return [s.renouveau, s.approfondissement, s.rayonnement, s.maitrise];
}

export function levelNameFor(t: T, tour: number, points: number): string {
  return levelNamesFor(t, tour)[levelIndexFor(points)];
}

export async function readTour(): Promise<number> {
  try {
    const n = parseInt((await AsyncStorage.getItem(TOUR_KEY)) || '1', 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  } catch {
    return 1;
  }
}

// Message au franchissement d'un palier de 1 000 points, sinon au changement de
// niveau. Même comportement qu'avant la mise en commun.
export function checkMilestones(
  oldTotal: number,
  newTotal: number,
  setToast: (msg: string) => void,
  t: T,
  tour: number,
  opts: { haptics: boolean },
) {
  const oldK = Math.floor(oldTotal / 1000);
  const newK = Math.floor(newTotal / 1000);
  if (newK > oldK && newTotal > 0) {
    if (opts.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast(t.home.toastMilestone.replace('{n}', String(newK * 1000)));
    return;
  }
  const oldLevel = levelNameFor(t, tour, oldTotal);
  const newLevel = levelNameFor(t, tour, newTotal);
  if (oldLevel !== newLevel) {
    if (opts.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast(t.home.toastNewLevel.replace('{level}', newLevel));
  }
}
