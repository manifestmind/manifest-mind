// services/demandeNote.web.ts — version SITE de la demande de note : ne fait rien.
//
// 🔴 N'importe RIEN d'`expo-store-review` : Metro résout ce fichier `.web.ts`
// sur le site, donc le module natif n'entre jamais dans le code du site (même
// montage que purchasesNative.web.ts ; cf. l'incident expo-audio de juillet,
// qui avait cassé le rendu statique).

export const NOTE_CLES = {
  cycle7: 'note_demandee_cycle7',
  niveaux: 'note_demandee_niveaux',
} as const;

export type MotifNote = { type: 'cycle7' } | { type: 'niveau'; tour: number; niveau: number };

export async function demanderNoteSiMoment(): Promise<MotifNote | null> {
  return null;
}
