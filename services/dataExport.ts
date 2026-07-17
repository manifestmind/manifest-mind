// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — export des données personnelles (droit RGPD de portabilité)
// ─────────────────────────────────────────────────────────────────────────────
//
// Assemble TOUTES les données de l'utilisateur dans un JSON unique :
//   - locales (AsyncStorage) : progression, journal, vision board, préférences
//     — avec l'Option A elles ne vivent QUE sur l'appareil, seule l'app peut
//     les exporter (un processus par e-mail serait matériellement impossible)
//   - serveur (Firebase Auth + Firestore users/{uid}) : compte, abonnement
//
// Livraison : téléchargement direct sur web (Blob, zéro réseau — le fichier est
// généré localement), partage de fichier sur natif (expo-sharing, pattern
// identique à useShare.ts).
//
// FAIL-OPEN : une panne Firestore ne bloque JAMAIS l'export — on livre les
// données locales avec une note d'erreur dans la section `abonnement`. Un
// droit RGPD ne doit pas dépendre du réseau.
//
// 🚨 RÈGLE DE MAINTENANCE : toute NOUVELLE clé AsyncStorage porteuse de
// données utilisateur doit être ajoutée ici (liste explicite curée — les clés
// purement techniques `sub_sync_uid` et `emailForSignIn` sont exclues
// volontairement).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { auth, db } from './firebase';
import { type Lang } from '../src/i18n/translations';

export type ExportResult = { ok: true } | { ok: false };

// ─── Helpers de lecture tolérants (une clé absente → null, jamais d'erreur) ──

function toNum(v: string | null): number | null {
  if (v == null) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

function toBool(v: string | null): boolean | null {
  if (v == null) return null;
  return v === 'true';
}

function toJson(v: string | null): unknown {
  if (v == null) return null;
  try {
    return JSON.parse(v);
  } catch {
    return v; // valeur corrompue → on exporte le brut plutôt que rien
  }
}

// ─── Collecte ────────────────────────────────────────────────────────────────

async function collecterDonnees(lang: Lang): Promise<Record<string, unknown>> {
  // 1. Données locales — liste explicite (cf. règle de maintenance en tête).
  const [
    [, userName], [, userLanguage],
    [, currentCycle], [, currentTheme], [, cycleCompleted], [, cyclePoints],
    [, bestCyclePoints], [, pointsTotal], [, nextCycleTime],
    [, cycleStepStatus], [, cycleEarnedPoints],
    [, visionBoardPhotos], [, profilePhoto],
    [, notifAffirmation], [, notifRappel], [, reminderTime],
    [, legalAccepted], [, legalAcceptedDate], [, onboardingCompleted],
    [, selectedPlan], [, subscriptionActiveLocal], [, hadSubscription],
    [, pwaArrivalDismissed], [, pwaCelebrationPromptShown],
  ] = await AsyncStorage.multiGet([
    'user_name', 'user_language',
    'current_cycle', 'current_theme', 'cycle_completed', 'cycle_points',
    'best_cycle_points', 'points_total', 'next_cycle_time',
    'cycle_step_status', 'cycle_earned_points',
    'vision_board_photos', 'profile_photo',
    'notif_affirmation', 'notif_rappel', 'reminder_time',
    'legal_accepted', 'legal_accepted_date', 'onboarding_completed',
    'selected_plan', 'subscription_active', 'had_subscription',
    'pwa_arrival_dismissed', 'pwa_celebration_prompt_shown',
  ]);

  // 2. Journal — clés dynamiques journal_cycle_N, découvertes par préfixe.
  let journal: Array<Record<string, unknown>> = [];
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const journalKeys = allKeys.filter((k) => /^journal_cycle_\d+$/.test(k));
    const entries = await AsyncStorage.multiGet(journalKeys);
    journal = entries
      .map(([key, value]) => ({
        cycle: toNum(key.replace('journal_cycle_', '')),
        contenu: toJson(value),
      }))
      .sort((a, b) => (a.cycle as number) - (b.cycle as number));
  } catch {
    // getAllKeys en échec → journal vide plutôt qu'export bloqué
  }

  // 3. Compte (Firebase Auth) — null si personne n'est connecté.
  const user = auth.currentUser;
  const compte = user
    ? {
        type: user.isAnonymous ? 'essai_anonyme' : 'permanent',
        email: user.email,
        uid: user.uid,
        methodesConnexion: user.providerData.map((p) => p.providerId),
        creeLe: user.metadata.creationTime ?? null,
      }
    : null;

  // 4. Abonnement (Firestore, source de vérité serveur) — FAIL-OPEN : en cas
  //    d'échec de lecture on exporte quand même tout le reste, avec une note.
  let abonnement: Record<string, unknown> = {
    marqueurLocalAbonnement: toBool(hadSubscription),
    actifLocalement: toBool(subscriptionActiveLocal),
    plan: selectedPlan,
  };
  if (user) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        abonnement = {
          ...abonnement,
          actif: d.subscription_active === true,
          paddleCustomerId: d.paddle_customer_id ?? null,
          paddleSubscriptionId: d.paddle_subscription_id ?? null,
          paddleStatus: d.paddle_status ?? null,
          misAJourLe: d.updated_at?.toDate?.()?.toISOString?.() ?? null,
        };
      }
    } catch {
      abonnement.noteServeur =
        'Lecture serveur indisponible au moment de l\'export (hors ligne ?) — données locales complètes ci-dessous.';
    }
  }

  return {
    export: {
      app: 'ManifestMind',
      date: new Date().toISOString(),
      formatVersion: 1,
      langue: lang,
    },
    compte,
    abonnement,
    progression: {
      cycleCourant: toNum(currentCycle),
      themeCourant: toNum(currentTheme),
      cycleTermine: toBool(cycleCompleted),
      pointsCycle: toNum(cyclePoints),
      meilleurCycle: toNum(bestCyclePoints),
      pointsTotal: toNum(pointsTotal),
      etapesDuCycle: toJson(cycleStepStatus),
      pointsParEtape: toJson(cycleEarnedPoints),
      prochainCycleA: toNum(nextCycleTime),
    },
    journal,
    visionBoard: { photos: toJson(visionBoardPhotos) },
    photoProfil: profilePhoto,
    preferences: {
      prenom: userName,
      langue: userLanguage,
      notifAffirmation: toBool(notifAffirmation),
      notifRappel: toBool(notifRappel),
      heureRappel: reminderTime,
      cguAcceptees: toBool(legalAccepted),
      cguAccepteesLe: legalAcceptedDate,
      onboardingTermine: toBool(onboardingCompleted),
      installArriveeRefusee: toBool(pwaArrivalDismissed),
      installCelebrationMontree: toBool(pwaCelebrationPromptShown),
    },
  };
}

// ─── Livraison ───────────────────────────────────────────────────────────────

export async function exporterDonnees(lang: Lang): Promise<ExportResult> {
  try {
    const donnees = await collecterDonnees(lang);
    const json = JSON.stringify(donnees, null, 2);
    const filename = `manifestmind-export-${new Date().toISOString().slice(0, 10)}.json`;

    if (Platform.OS === 'web') {
      // Blob généré et téléchargé LOCALEMENT — aucun réseau impliqué.
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Révocation différée : certains navigateurs lisent le blob après le click.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { ok: true };
    }

    // Natif (Phase 2) — même pattern que useShare.ts : fichier temp + partage.
    const disponible = await Sharing.isAvailableAsync();
    if (!disponible) return { ok: false };
    const fileUri = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, json);
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: filename,
      UTI: 'public.json',
    });
    return { ok: true };
  } catch (e) {
    console.error('[export] échec de l\'export de données', e);
    return { ok: false };
  }
}
