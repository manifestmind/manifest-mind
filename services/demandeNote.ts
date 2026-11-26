// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — demande de note NATIVE (version 1.2.0, Android et iOS)
// ─────────────────────────────────────────────────────────────────────────────
//
// Décision utilisatrice (2026-11-26) : la fenêtre de note du magasin (Apple /
// Google Play) est demandée à un MOMENT NATUREL, sur l'écran de célébration :
//   - une fois, à la fin du cycle 7 (première semaine complète) ;
//   - une fois par CHANGEMENT DE NIVEAU (Éveil → Ancrage → Expansion →
//     Manifestation, puis les niveaux des tours suivants).
// Seulement pour une abonnée, dans les apps (le site utilise
// demandeNote.web.ts, qui ne fait rien). Chaque demande faite est mémorisée
// sur l'appareil et n'est jamais répétée.
//
// Règles des magasins (ne pas contourner) : jamais depuis un bouton (le bouton
// « Noter l'application » des Paramètres reste un simple lien vers la fiche),
// jamais de question préalable du type « Aimez-vous l'app ? », jamais
// d'incitation à bien noter. Apple n'affiche la fenêtre qu'au plus 3 fois par an
// (et jamais dans TestFlight) ; Google applique un quota non communiqué. On ne
// sait jamais si la fenêtre s'est affichée ni si la personne a noté.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { levelIndexFor } from './levels';

export const NOTE_CLES = {
  cycle7: 'note_demandee_cycle7',
  niveaux: 'note_demandee_niveaux', // JSON : ["tour:niveau", …]
} as const;

export type MotifNote = { type: 'cycle7' } | { type: 'niveau'; tour: number; niveau: number };

// Décision SANS effet (exportée pour les tests).
export function decisionDemandeNote(p: {
  cycleTermine: number;
  tour: number;
  pointsAvant: number;
  pointsApres: number;
  abonnee: boolean;
  dejaCycle7: boolean;
  niveauxDejaDemandes: string[];
}): MotifNote | null {
  if (!p.abonnee) return null;
  const avant = levelIndexFor(Math.max(0, p.pointsAvant));
  const apres = levelIndexFor(Math.max(0, p.pointsApres));
  if (apres > avant && !p.niveauxDejaDemandes.includes(`${p.tour}:${apres}`)) {
    return { type: 'niveau', tour: p.tour, niveau: apres };
  }
  if (p.cycleTermine === 7 && !p.dejaCycle7) return { type: 'cycle7' };
  return null;
}

// Appelée par l'écran de célébration, une fois le cycle enregistré comme terminé.
// Renvoie le motif si la demande a été envoyée au magasin, sinon null.
export async function demanderNoteSiMoment(p: {
  cycleTermine: number;
  tour: number;
  pointsAvant: number;
  pointsApres: number;
}): Promise<MotifNote | null> {
  try {
    const [[, abo], [, c7], [, nv]] = await AsyncStorage.multiGet([
      'subscription_active', NOTE_CLES.cycle7, NOTE_CLES.niveaux,
    ]);
    let niveaux: string[] = [];
    try {
      const v = JSON.parse(nv || '[]');
      if (Array.isArray(v)) niveaux = v.filter((x) => typeof x === 'string');
    } catch {
      niveaux = [];
    }
    const motif = decisionDemandeNote({
      ...p,
      abonnee: abo === 'true',
      dejaCycle7: c7 === 'true',
      niveauxDejaDemandes: niveaux,
    });
    if (!motif) return null;
    if (!(await StoreReview.isAvailableAsync())) return null;
    // Mémorisée AVANT l'appel : jamais répétée, même si l'app est fermée pendant.
    if (motif.type === 'cycle7') await AsyncStorage.setItem(NOTE_CLES.cycle7, 'true');
    else await AsyncStorage.setItem(NOTE_CLES.niveaux, JSON.stringify([...niveaux, `${motif.tour}:${motif.niveau}`]));
    await StoreReview.requestReview();
    return motif;
  } catch {
    return null; // jamais d'erreur visible pour une demande de note
  }
}
