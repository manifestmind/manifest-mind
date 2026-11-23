// ManifestMind — programmation des notifications locales (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// UN SEUL point qui programme TOUTES les notifications. Il relit les réglages
// dans AsyncStorage au moment de programmer, jamais dans l'état d'un écran :
// c'est ce qui corrige le défaut du rappel de 20 h (parametres.tsx relisait une
// ancienne valeur « activé » gardée en mémoire et le reprogrammait après sa
// désactivation).
//
// NATIF UNIQUEMENT. Sur web, toutes les fonctions sortent immédiatement : le site
// n'a pas de notifications locales.
//
// Ce qui est programmé (tout est annulé puis reprogrammé à chaque appel) :
//   - Affirmation : chaque jour à l'heure choisie (9 h par défaut). Texte = celui
//     du cycle en cours, OU texte générique pour un non-abonné (anti-fuite de
//     contenu payant, inchangé depuis 2026-07-15).
//   - Rappel de 20 h : jour par jour sur 7 jours (déclencheurs DATE), SEULEMENT si
//     le cycle du jour n'est pas terminé : celui du jour disparaît dès la fin du
//     cycle (rescheduleAll() appelé par celebration.tsx). Jamais pour un non-abonné.
//   - 3 messages bienveillants : 8 h, 14 h, 19 h, tous les jours (DAILY), que
//     l'app soit ouverte ou non.
//
// Heures exactes sur Android : expo-notifications programme en alarme EXACTE dès
// que la personne a accordé « Alarmes et rappels » (SCHEDULE_EXACT_ALARM,
// déclarée dans app.json) ; sinon en alarme inexacte (retards possibles). On
// reprogramme à chaque retour dans l'app → l'autorisation, une fois donnée,
// s'applique dès le retour depuis les réglages.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { translations, type Lang } from '../src/i18n/translations';
import { getCycleContent } from '../hooks/useCycleContent';
import { isPaywalled } from './access';

export const CHANNEL_ID = 'rappels';
export const DEFAULT_REMINDER_TIME = '09:00';
const RAPPEL_HOUR = 20;
const RAPPEL_DAYS = 7;
const KIND_HOURS = [8, 14, 19] as const;

// Clés AsyncStorage (toutes listées aussi dans services/dataExport.ts).
export const NOTIF_KEYS = {
  affirmation: 'notif_affirmation',      // défaut : activée
  rappel: 'notif_rappel',                // défaut : désactivé
  bienveillants: 'notif_bienveillants',  // défaut : activés
  time: 'reminder_time',                 // 'HH:MM', défaut 09:00
  permissionAsked: 'notif_permission_asked',
  repromptCount: 'notif_reprompt_count',
  repromptNext: 'notif_reprompt_next',
  repromptOff: 'notif_reprompt_off',
} as const;

const isNative = Platform.OS !== 'web';

function langOf(raw: string | null | undefined): Lang {
  return raw === 'en' || raw === 'es' ? raw : 'fr';
}

// Affichage d'une notification reçue pendant que l'app est ouverte (sinon elle
// était silencieusement ignorée). À appeler une fois au démarrage.
export function installForegroundHandler() {
  if (!isNative) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Canal Android unique, nommé dans la langue de la personne. Doit exister AVANT
// la demande d'autorisation sur Android 13+.
export async function ensureChannel(lang?: Lang) {
  if (Platform.OS !== 'android') return;
  try {
    const l = lang ?? langOf(await AsyncStorage.getItem('user_language'));
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: translations[l].notifications.canalNom,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch {
    // canal indisponible : les notifications partiront sur le canal par défaut
  }
}

export async function notificationsGranted(): Promise<boolean> {
  if (!isNative) return false;
  try {
    return (await Notifications.getPermissionsAsync()).status === 'granted';
  } catch {
    return false;
  }
}

// Demande système. Renvoie true si accordée. Planifie la reproposition à J+3 en
// cas de refus (cf. shouldReprompt), sauf si elle est déjà planifiée.
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative) return false;
  let granted = false;
  try {
    await ensureChannel();
    granted = (await Notifications.requestPermissionsAsync()).status === 'granted';
  } catch {
    granted = false;
  }
  try {
    await AsyncStorage.setItem(NOTIF_KEYS.permissionAsked, 'true');
    if (!granted && !(await AsyncStorage.getItem(NOTIF_KEYS.repromptNext))) {
      await AsyncStorage.setItem(NOTIF_KEYS.repromptNext, String(Date.now() + 3 * DAY_MS));
    }
  } catch {}
  if (granted) await rescheduleAll();
  return granted;
}

// Bouton « Ouvrir les réglages » : si le système accepte encore de poser la
// question (Android), on la repose ; sinon (iOS après un refus, Android après
// deux refus) on ouvre la page de réglages de l'app.
export async function openNotificationSettings() {
  if (!isNative) return;
  try {
    const p = await Notifications.getPermissionsAsync();
    if (p.status !== 'granted' && p.canAskAgain) {
      if (await requestNotificationPermission()) return;
    }
  } catch {}
  Linking.openSettings().catch(() => {});
}

// Android : page « Alarmes et rappels » (heures exactes), puis repli sur la page
// de l'app si l'intention n'existe pas sur le téléphone.
export function openExactAlarmSettings() {
  if (Platform.OS !== 'android') return;
  Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM').catch(() => {
    Linking.openSettings().catch(() => {});
  });
}

// Android : liste d'optimisation de batterie (aucune permission requise).
export function openBatterySettings() {
  if (Platform.OS !== 'android') return;
  Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS').catch(() => {
    Linking.openSettings().catch(() => {});
  });
}

// ── Reproposition après un refus (carte de l'écran de félicitations) ─────────
// 3 fois au maximum : J+3 après le refus, puis +14 j, puis +30 j, puis plus
// jamais. « Ne plus me demander » arrête tout. Jamais si les notifications sont
// accordées.
const DAY_MS = 24 * 60 * 60 * 1000;
const REPROMPT_GAPS_DAYS = [14, 30];
const REPROMPT_MAX = 3;

export async function shouldReprompt(): Promise<boolean> {
  if (!isNative) return false;
  if (await notificationsGranted()) return false;
  try {
    const [[, off], [, countRaw], [, nextRaw]] = await AsyncStorage.multiGet([
      NOTIF_KEYS.repromptOff, NOTIF_KEYS.repromptCount, NOTIF_KEYS.repromptNext,
    ]);
    if (off === 'true') return false;
    const count = parseInt(countRaw || '0', 10) || 0;
    if (count >= REPROMPT_MAX) return false;
    if (!nextRaw) {
      // Refus constaté sans date planifiée (ex. coupées dans les réglages du
      // téléphone) → première proposition dans 3 jours.
      await AsyncStorage.setItem(NOTIF_KEYS.repromptNext, String(Date.now() + 3 * DAY_MS));
      return false;
    }
    return Date.now() >= Number(nextRaw);
  } catch {
    return false;
  }
}

// À appeler quand la carte a été MONTRÉE (une seule fois par échéance).
export async function markRepromptShown() {
  try {
    const count = (parseInt((await AsyncStorage.getItem(NOTIF_KEYS.repromptCount)) || '0', 10) || 0) + 1;
    const gap = REPROMPT_GAPS_DAYS[count - 1];
    await AsyncStorage.multiSet([
      [NOTIF_KEYS.repromptCount, String(count)],
      [NOTIF_KEYS.repromptNext, gap ? String(Date.now() + gap * DAY_MS) : String(Number.MAX_SAFE_INTEGER)],
    ]);
  } catch {}
}

export async function stopReprompts() {
  try { await AsyncStorage.setItem(NOTIF_KEYS.repromptOff, 'true'); } catch {}
}

// ── Programmation ────────────────────────────────────────────────────────────
// Appels sérialisés : un appel qui arrive pendant un autre attend la fin du
// premier (sinon deux « tout annuler / tout reprogrammer » s'entremêleraient).
let chain: Promise<void> = Promise.resolve();

export function rescheduleAll(opts: { lang?: Lang } = {}): Promise<void> {
  if (!isNative) return Promise.resolve();
  chain = chain.then(() => doReschedule(opts)).catch(() => {});
  return chain;
}

async function doReschedule(opts: { lang?: Lang }) {
  await ensureChannel(opts.lang);
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!(await notificationsGranted())) return;

  const [[, aff], [, rap], [, bien], [, time], [, langRaw], [, cycleRaw], [, completed], [, nextRaw]] =
    await AsyncStorage.multiGet([
      NOTIF_KEYS.affirmation, NOTIF_KEYS.rappel, NOTIF_KEYS.bienveillants, NOTIF_KEYS.time,
      'user_language', 'current_cycle', 'cycle_completed', 'next_cycle_time',
    ]);
  const lang = opts.lang ?? langOf(langRaw);
  const t = translations[lang].notifications;
  const paywalled = await isPaywalled();

  // 1. Affirmation (défaut : activée)
  if (aff !== 'false') {
    const [h, m] = (time || DEFAULT_REMINDER_TIME).split(':').map(Number);
    const cycle = parseInt(cycleRaw || '1', 10) || 1;
    // 🚨 Anti-fuite : jamais l'affirmation réelle pour un non-abonné bloqué.
    const content = paywalled ? null : getCycleContent(cycle, lang);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.titreAffirmation,
        body: content?.affirmation || t.affirmationBody,
        data: { screen: 'affirmation' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: Number.isFinite(h) ? h : 9,
        minute: Number.isFinite(m) ? m : 0,
        channelId: CHANNEL_ID,
      },
    });
  }

  // 2. Rappel de 20 h (défaut : désactivé), seulement si le cycle du jour n'est
  //    pas terminé. Cycle terminé = cycle_completed 'true' et minuit pas passé.
  if (rap === 'true' && !paywalled) {
    const now = Date.now();
    const doneToday = completed === 'true' && now < Number(nextRaw || 0);
    for (let i = 0; i < RAPPEL_DAYS; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(RAPPEL_HOUR, 0, 0, 0);
      if (d.getTime() <= now) continue;
      if (i === 0 && doneToday) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: t.titreRappel, body: t.rappelBody },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d, channelId: CHANNEL_ID },
      });
    }
  }

  // 3. Messages bienveillants (défaut : activés) — 8 h, 14 h, 19 h.
  if (bien !== 'false') {
    const bodies = [t.bienveillant8, t.bienveillant14, t.bienveillant19];
    for (let i = 0; i < KIND_HOURS.length; i++) {
      await Notifications.scheduleNotificationAsync({
        content: { title: t.titreBienveillant, body: bodies[i] },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: KIND_HOURS[i],
          minute: 0,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}
