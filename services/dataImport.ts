// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — import du fichier d'export (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// Permet de retrouver SON CYCLE après un changement de téléphone ou une
// réinstallation : la personne exporte son fichier (Paramètres → « Exporter mes
// données »), puis le réimporte (Paramètres → « Importer mes données »).
//
// Rien ne part vers un serveur : le fichier est lu sur l'appareil.
//
// Ce qui est restauré : cycle, points, tour, état du cycle en cours, journal,
// prénom, langue, réglages de notifications, photos (vision board, profil) quand
// le fichier les contient EN DONNÉES (data:image/…). Les exports d'Android/iPhone
// 1.0.0 ne contiennent que des CHEMINS de fichiers : ces photos sont ignorées
// (signalé à la personne), le reste est restauré.
//
// 🔒 JAMAIS importé : l'abonnement et le compte. L'accès payant vient toujours du
// serveur (webhooks → Firestore). Un fichier modifié à la main ne peut rien
// débloquer : il ne change que la progression de la personne elle-même.
//
// Tout est VÉRIFIÉ avant la moindre écriture (format, plages de valeurs). Une
// entrée de journal ou une photo invalide est ignorée, sans bloquer le reste.
//
// Formats acceptés : `formatVersion: 1` (exports 1.0.0 et 1.1.0 ; un fichier sans
// numéro de tour = tour 1).

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { TOUR_KEY } from './levels';
import { NOTIF_KEYS, rescheduleAll } from './notifications';

const MAX_FILE_CHARS = 30_000_000; // ~30 Mo : garde-fou contre un fichier aberrant
const MAX_JOURNAL_CHARS = 2000; // même plafond que le champ du journal
const STEPS = ['opening', 'affirmation', 'action_easy', 'action_hard', 'visualisation', 'journal', 'vision_board'] as const;
const PHOTO_RE = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/;

export type ImportSummary = {
  dateExport: string | null;
  cycle: number;
  tour: number;
  points: number;
  journaux: number;
  photos: number;
  photosIgnorees: number;
};

type Plan = {
  summary: ImportSummary;
  progress: [string, string][];
  journal: [string, string][];
  visionPhotos: Record<string, string> | null; // null = rien de restaurable → on garde l'existant
  profilePhoto: string | null;
  prefs: [string, string][];
  langue: 'fr' | 'en' | 'es' | null;
};

export type PickResult =
  | { ok: true; plan: Plan }
  | { ok: false; reason: 'annule' | 'lecture' | 'format' };

// ── Lecture du fichier choisi ────────────────────────────────────────────────
export async function choisirFichierImport(): Promise<PickResult> {
  let res: DocumentPicker.DocumentPickerResult;
  try {
    // '*/*' : selon le téléphone, un .json téléchargé n'a pas toujours le bon
    // type ; le contenu est vérifié juste après.
    res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  } catch {
    return { ok: false, reason: 'lecture' };
  }
  if (res.canceled || !res.assets?.length) return { ok: false, reason: 'annule' };
  const asset = res.assets[0];
  let text: string;
  try {
    if (Platform.OS === 'web') {
      const file = (asset as unknown as { file?: File }).file;
      text = file ? await file.text() : await (await fetch(asset.uri)).text();
    } else {
      text = await FileSystem.readAsStringAsync(asset.uri);
    }
  } catch {
    return { ok: false, reason: 'lecture' };
  }
  if (!text || text.length > MAX_FILE_CHARS) return { ok: false, reason: 'format' };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'format' };
  }
  const plan = construirePlan(data);
  return plan ? { ok: true, plan } : { ok: false, reason: 'format' };
}

// ── Vérification complète, sans rien écrire ──────────────────────────────────
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const intIn = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export function construirePlan(data: unknown): Plan | null {
  if (!isObj(data) || !isObj(data.export) || data.export.app !== 'ManifestMind' || data.export.formatVersion !== 1) return null;
  const p = data.progression;
  if (!isObj(p) || !intIn(p.cycleCourant, 1, 365)) return null;
  const cycle = p.cycleCourant as number;
  const points = intIn(p.pointsTotal, 0, 10_000_000) ? (p.pointsTotal as number) : null;
  if (points === null) return null;
  const tour = intIn(p.tourCourant, 1, 1000) ? (p.tourCourant as number) : 1;

  // État du cycle en cours : seules les étapes connues, en booléens.
  const etapes: Record<string, boolean> = {};
  for (const s of STEPS) etapes[s] = isObj(p.etapesDuCycle) && p.etapesDuCycle[s] === true;
  const gagnes: Record<string, number> = {};
  for (const s of STEPS) {
    const v = isObj(p.pointsParEtape) ? p.pointsParEtape[s] : 0;
    gagnes[s] = intIn(v, 0, 100) ? (v as number) : 0;
  }
  const minuit = new Date(); minuit.setHours(24, 0, 0, 0);
  const prochain = intIn(p.prochainCycleA, 1, 9_000_000_000_000) ? (p.prochainCycleA as number) : minuit.getTime();

  const progress: [string, string][] = [
    ['current_cycle', String(cycle)],
    ['current_theme', String(intIn(p.themeCourant, 1, 8) ? p.themeCourant : ((cycle - 1) % 7) + 1)],
    ['cycle_completed', p.cycleTermine === true ? 'true' : 'false'],
    ['cycle_points', String(intIn(p.pointsCycle, 0, 1000) ? p.pointsCycle : 0)],
    ['points_total', String(points)],
    ['cycle_step_status', JSON.stringify(etapes)],
    ['cycle_earned_points', JSON.stringify(gagnes)],
    ['next_cycle_time', String(prochain)],
    [TOUR_KEY, String(tour)],
    ['onboarding_completed', 'true'],
  ];
  if (intIn(p.meilleurCycle, 0, 1000)) progress.push(['best_cycle_points', String(p.meilleurCycle)]);

  // Journal : chaque entrée vérifiée ; une entrée invalide est simplement ignorée.
  const journal: [string, string][] = [];
  if (Array.isArray(data.journal)) {
    for (const e of data.journal) {
      if (!isObj(e) || !intIn(e.cycle, 1, 365) || !isObj(e.contenu)) continue;
      const skipped = e.contenu.skipped === true;
      const t = typeof e.contenu.text === 'string' ? e.contenu.text.slice(0, MAX_JOURNAL_CHARS) : '';
      if (!skipped && !t.trim()) continue;
      journal.push([`journal_cycle_${e.cycle}`, JSON.stringify({ text: skipped ? '' : t, skipped, cycle: e.cycle })]);
    }
  }

  // Photos : seulement celles contenues EN DONNÉES.
  let photosIgnorees = 0;
  let visionPhotos: Record<string, string> | null = null;
  if (isObj(data.visionBoard) && isObj(data.visionBoard.photos)) {
    const ok: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.visionBoard.photos)) {
      if (typeof v !== 'string' || !v) continue;
      if (PHOTO_RE.test(v) && /^[a-z_]{1,30}$/.test(k)) ok[k] = v; else photosIgnorees++;
    }
    if (Object.keys(ok).length) visionPhotos = ok;
  }
  let profilePhoto: string | null = null;
  if (typeof data.photoProfil === 'string' && data.photoProfil) {
    if (PHOTO_RE.test(data.photoProfil)) profilePhoto = data.photoProfil; else photosIgnorees++;
  }

  // Préférences (toutes facultatives).
  const prefs: [string, string][] = [];
  let langue: Plan['langue'] = null;
  const pr = isObj(data.preferences) ? data.preferences : {};
  if (typeof pr.prenom === 'string' && pr.prenom.trim()) prefs.push(['user_name', pr.prenom.trim().slice(0, 40)]);
  if (pr.langue === 'fr' || pr.langue === 'en' || pr.langue === 'es') { langue = pr.langue; prefs.push(['user_language', pr.langue]); }
  const bool = (k: string, v: unknown) => { if (typeof v === 'boolean') prefs.push([k, String(v)]); };
  bool(NOTIF_KEYS.affirmation, pr.notifAffirmation);
  bool(NOTIF_KEYS.rappel, pr.notifRappel);
  bool(NOTIF_KEYS.bienveillants, pr.notifMessagesBienveillants);
  if (typeof pr.heureRappel === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(pr.heureRappel)) prefs.push([NOTIF_KEYS.time, pr.heureRappel]);

  return {
    summary: {
      dateExport: typeof data.export.date === 'string' ? data.export.date : null,
      cycle, tour, points,
      journaux: journal.filter(([, v]) => !JSON.parse(v).skipped).length,
      photos: (visionPhotos ? Object.keys(visionPhotos).length : 0) + (profilePhoto ? 1 : 0),
      photosIgnorees,
    },
    progress, journal, visionPhotos, profilePhoto, prefs, langue,
  };
}

// ── Écriture (après confirmation de la personne) ─────────────────────────────
// Remplace la progression et le journal de l'appareil. Les photos ne sont
// remplacées que si le fichier en contient. Ne touche JAMAIS à l'abonnement ni au
// compte. Renvoie le nombre de photos qui n'ont pas pu être enregistrées.
export async function appliquerImport(plan: Plan): Promise<{ ok: boolean; photosEchec: number }> {
  let photosEchec = 0;
  try {
    // 1. Journal : on repart de celui du fichier.
    const anciens = (await AsyncStorage.getAllKeys()).filter((k) => /^journal_cycle_\d+$/.test(k));
    if (anciens.length) await AsyncStorage.multiRemove(anciens);
    if (plan.journal.length) await AsyncStorage.multiSet(plan.journal);

    // 2. Progression + préférences.
    await AsyncStorage.multiSet([...plan.progress, ...plan.prefs]);
  } catch {
    return { ok: false, photosEchec };
  }

  // 3. Photos (chacune isolée : un échec n'empêche ni les autres ni le reste).
  if (plan.visionPhotos) {
    const out: Record<string, string> = {};
    for (const [k, data] of Object.entries(plan.visionPhotos)) {
      const uri = await enregistrerPhoto(data, `vb_${k}`);
      if (uri) out[k] = uri; else photosEchec++;
    }
    try { await AsyncStorage.setItem('vision_board_photos', JSON.stringify(out)); } catch { photosEchec += Object.keys(out).length; }
  }
  if (plan.profilePhoto) {
    const uri = await enregistrerPhoto(plan.profilePhoto, 'profil');
    try { if (uri) await AsyncStorage.setItem('profile_photo', uri); else photosEchec++; } catch { photosEchec++; }
  }

  rescheduleAll(); // notifications : nouveau cycle, nouveaux réglages (natif ; rien sur web)
  return { ok: true, photosEchec };
}

// Web : la photo reste en données (comme à l'ajout d'une photo sur le site).
// Natif : on l'écrit en fichier durable dans documentDirectory/photos/.
async function enregistrerPhoto(dataUri: string, nom: string): Promise<string | null> {
  if (Platform.OS === 'web') return dataUri;
  try {
    const dir = FileSystem.documentDirectory + 'photos/';
    try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }); } catch {}
    const dest = `${dir}import_${nom}_${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(dest, dataUri.slice(dataUri.indexOf(',') + 1), { encoding: FileSystem.EncodingType.Base64 });
    return dest;
  } catch {
    return null;
  }
}
