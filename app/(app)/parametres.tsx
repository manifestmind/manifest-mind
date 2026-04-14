import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { getCycleContent } from '../../hooks/useCycleContent';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, ClipPath, Defs, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Chevron({ color = '#C4A8D4' }: { color?: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
      <Path d="M4 2l4 4-4 4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <View style={[styles.toggle, on ? styles.toggleOn : styles.toggleOff]}>
      <View style={[styles.toggleDot, on ? styles.toggleDotOn : styles.toggleDotOff]} />
    </View>
  );
}

export default function Parametres() {
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState<'fr' | 'en' | 'es'>('fr');
  const [notifAffirmation, setNotifAffirmation] = useState(true);
  const [notifRappel, setNotifRappel] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ── Load persisted settings ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [storedLang, storedNotifAff, storedNotifRappel, storedTime] =
        await AsyncStorage.multiGet([
          'user_language',
          'notif_affirmation',
          'notif_rappel',
          'reminder_time',
        ]);

      if (storedLang[1]) setLang(storedLang[1] as 'fr' | 'en' | 'es');
      if (storedNotifAff[1] !== null) setNotifAffirmation(storedNotifAff[1] === 'true');
      if (storedNotifRappel[1] !== null) setNotifRappel(storedNotifRappel[1] === 'true');
      if (storedTime[1]) {
        const [h, m] = storedTime[1].split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        setReminderTime(d);
      }
    })();
  }, []);

  // ── Notification helpers ─────────────────────────────────────────────────
  async function requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async function scheduleAffirmationNotif(time: Date) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (notifRappel) await scheduleRappelNotifRaw(time);
    const cycleNumber = parseInt(await AsyncStorage.getItem('current_cycle') || '1');
    const cycleContent = getCycleContent(cycleNumber);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ManifestMind \u2756',
        body: cycleContent?.affirmation || "Ton affirmation du cycle t\u2019attend.",
        data: { screen: 'affirmation' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.getHours(),
        minute: time.getMinutes(),
      },
    });
  }

  async function scheduleRappelNotifRaw(time: Date) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ManifestMind ✦',
        body: "Ton cycle d\u2019aujourd\u2019hui n\u2019est pas encore termin\u00e9. Tu peux encore le compl\u00e9ter !",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });
  }

  async function cancelAffirmationNotif() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (notifRappel) await scheduleRappelNotifRaw(reminderTime);
  }

  async function cancelRappelNotif() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (notifAffirmation) await scheduleAffirmationNotif(reminderTime);
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleLanguage(l: 'fr' | 'en' | 'es') {
    setLang(l);
    AsyncStorage.setItem('user_language', l);
    if (l !== 'fr') {
      Alert.alert('Langue', "Seul le fran\u00e7ais est disponible pour l\u2019instant.");
      setLang('fr');
      AsyncStorage.setItem('user_language', 'fr');
    }
  }

  async function handleNotifAffirmation() {
    const next = !notifAffirmation;
    if (next) {
      const ok = await requestPermissions();
      if (!ok) {
        Alert.alert('Notifications désactivées', 'Active les notifications dans les réglages de ton téléphone.');
        return;
      }
      await scheduleAffirmationNotif(reminderTime);
    } else {
      await cancelAffirmationNotif();
    }
    setNotifAffirmation(next);
    await AsyncStorage.setItem('notif_affirmation', String(next));
  }

  async function handleNotifRappel() {
    const next = !notifRappel;
    if (next) {
      const ok = await requestPermissions();
      if (!ok) {
        Alert.alert('Notifications désactivées', 'Active les notifications dans les réglages de ton téléphone.');
        return;
      }
      await scheduleRappelNotifRaw(reminderTime);
    } else {
      await cancelRappelNotif();
    }
    setNotifRappel(next);
    await AsyncStorage.setItem('notif_rappel', String(next));
  }

  async function handleTimeChange(_event: DateTimePickerEvent, date?: Date) {
    setShowTimePicker(Platform.OS === 'ios');
    if (!date) return;
    setReminderTime(date);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    await AsyncStorage.setItem('reminder_time', `${hh}:${mm}`);
    if (notifAffirmation) await scheduleAffirmationNotif(date);
  }

  function handleSignOut() {
    Alert.alert(
      'Se déconnecter',
      "Tu seras redirig\u00e9 vers l\u2019\u00e9cran d\u2019accueil.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('onboarding_completed');
            router.replace('/(onboarding)/welcome' as any);
          },
        },
      ]
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer mon compte',
      'Toutes tes données seront effacées définitivement. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/(onboarding)/welcome' as any);
          },
        },
      ]
    );
  }

  function handleRestorePurchases() {
    Alert.alert('Restaurer les achats', 'Aucun achat à restaurer pour le moment.');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function formatTime(date: Date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <View style={styles.container}>
      {/* Orbes */}
      <View style={[styles.orb, { width: 130, height: 130, backgroundColor: '#DDD0F8', top: -35, right: -35 }]} />
      <View style={[styles.orb, { width: 70, height: 70, backgroundColor: '#B8D4B0', bottom: 55, left: -18 }]} />

      {/* ScrollView */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* 1. ŒIL + TITRE */}
        <View style={styles.header}>
          <Svg width={120} height={92} viewBox="0 0 56 44" style={{ overflow: 'visible' }}>
            <Defs>
              <ClipPath id="prc1">
                <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
              </ClipPath>
            </Defs>
            <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
            <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#prc1)" />
            <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#prc1)" />
            <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#prc1)" />
            <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#prc1)" />
            <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#prc1)" />
            <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#prc1)" />
            <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#prc1)" />
            <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
            <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
            <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
          </Svg>
          <Text style={styles.title}>Paramètres</Text>
        </View>

        {/* 2. LANGUE */}
        <View>
          <Text style={styles.sectionLabel}>Langue</Text>
          <View style={[styles.rowBase, styles.rowSolo]}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Circle cx="10" cy="10" r="7" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
              <Path d="M10 3c-2 2-3 4.5-3 7s1 5 3 7" stroke="#6B3FA0" strokeWidth="1" fill="none" />
              <Path d="M10 3c2 2 3 4.5 3 7s-1 5-3 7" stroke="#6B3FA0" strokeWidth="1" fill="none" />
              <Path d="M3 10h14" stroke="#6B3FA0" strokeWidth="1" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Langue de l'application</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {(['fr', 'en', 'es'] as const).map((l) => (
                <Pressable
                  key={l}
                  style={[styles.langPill, lang === l ? styles.langPillActive : styles.langPillInactive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleLanguage(l); }}
                >
                  <Text style={lang === l ? styles.langPillTextActive : styles.langPillTextInactive}>
                    {l.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* 3. NOTIFICATIONS */}
        <View>
          <Text style={styles.sectionLabel}>Notifications</Text>

          {/* Ligne 1 — Affirmation du cycle */}
          <View style={[styles.rowBase, styles.rowFirst]}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M10 2a6 6 0 0 1 6 6c0 3 1 4 2 5H2c1-1 2-2 2-5a6 6 0 0 1 6-6z" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
              <Path d="M8 17a2 2 0 0 0 4 0" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" />
            </Svg>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Affirmation du cycle</Text>
              <Text style={styles.rowSub}>Reçois ton affirmation chaque matin</Text>
            </View>
            <Pressable onPress={handleNotifAffirmation}>
              <Toggle on={notifAffirmation} />
            </Pressable>
          </View>

          {/* Ligne 2 — Heure de rappel */}
          <View style={[styles.rowBase, styles.rowMiddle]}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Circle cx="10" cy="10" r="7" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
              <Path d="M10 6v4l3 2" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" />
            </Svg>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Heure de rappel matin</Text>
              <Text style={styles.rowSub}>Affirmation + ouverture du cycle</Text>
            </View>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowTimePicker(true); }}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{formatTime(reminderTime)}</Text>
              </View>
            </Pressable>
          </View>

          {/* Ligne 3 — Rappel cycle incomplet */}
          <View style={[styles.rowBase, styles.rowLast]}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M10 2a6 6 0 0 1 6 6c0 3 1 4 2 5H2c1-1 2-2 2-5a6 6 0 0 1 6-6z" stroke="#9B72C8" strokeWidth="1.2" fill="none" />
              <Path d="M8 17a2 2 0 0 0 4 0" stroke="#9B72C8" strokeWidth="1.2" strokeLinecap="round" />
            </Svg>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Rappel cycle incomplet</Text>
              <Text style={styles.rowSub}>Si cycle non terminé à 20h</Text>
            </View>
            <Pressable onPress={handleNotifRappel}>
              <Toggle on={notifRappel} />
            </Pressable>
          </View>
        </View>

        {/* 4. ABONNEMENT */}
        <View>
          <Text style={styles.sectionLabel}>Abonnement</Text>

          {/* Ligne 1 — Plan actuel */}
          <Pressable
            style={[styles.rowBase, styles.rowFirst]}
            onPress={() => router.push('/(app)/pricing-upgrade' as any)}
          >
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" fill="#EAC870" stroke="#C89A30" strokeWidth="0.8" />
            </Svg>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Plan actuel</Text>
              <Text style={styles.rowSub}>Annuel · Renouvellement auto</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Actif</Text>
            </View>
          </Pressable>

          {/* Ligne 2 — Restaurer les achats */}
          <Pressable style={[styles.rowBase, styles.rowLast]} onPress={handleRestorePurchases}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Rect x="3" y="5" width="14" height="10" rx="2" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
              <Path d="M3 9h14" stroke="#6B3FA0" strokeWidth="1.2" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Restaurer les achats</Text>
            <Chevron />
          </Pressable>
        </View>

        {/* 5. COMPTE */}
        <View>
          <Text style={styles.sectionLabel}>Compte</Text>

          {/* Ligne 1 — Se déconnecter */}
          <Pressable style={[styles.rowBase, styles.rowFirst]} onPress={handleSignOut}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M13 3h4v14h-4M9 14l4-4-4-4M3 10h10" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Se déconnecter</Text>
            <Chevron />
          </Pressable>

          {/* Ligne 2 — Supprimer mon compte */}
          <Pressable style={[styles.rowBase, styles.rowLast]} onPress={handleDeleteAccount}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M5 5l10 10M15 5L5 15" stroke="#C04040" strokeWidth="1.2" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1, color: '#C04040' }]}>Supprimer mon compte</Text>
            <Chevron color="#D08080" />
          </Pressable>
        </View>

        {/* 6. LÉGAL */}
        <View>
          <Text style={styles.sectionLabel}>Légal</Text>

          {/* Ligne 1 — Politique de confidentialité */}
          <Pressable
            style={[styles.rowBase, styles.rowFirst]}
            onPress={() => Linking.openURL('https://manifestmind.github.io/manifest-mind/politique_confidentialite_fr.html')}
          >
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Rect x="4" y="2" width="12" height="16" rx="2" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
              <Path d="M7 7h6M7 10h6M7 13h4" stroke="#6B3FA0" strokeWidth="1" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Politique de confidentialité</Text>
            <Chevron />
          </Pressable>

          {/* Ligne 2 — Conditions d'utilisation */}
          <Pressable
            style={[styles.rowBase, styles.rowLast]}
            onPress={() => Linking.openURL('https://manifestmind.github.io/manifest-mind/conditions_utilisation_fr.html')}
          >
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M10 2l7 4v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-4z" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Conditions d'utilisation</Text>
            <Chevron />
          </Pressable>
        </View>

        {/* 7. VERSION */}
        <View style={styles.versionBlock}>
          <Text style={styles.versionText}>ManifestMind v1.0.0</Text>
          <Text style={styles.versionTagline}>Fait avec ✦ pour ton épanouissement</Text>
        </View>

      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Navbar */}
      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/home' as any); }}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" fill="#A09088" />
          </Svg>
          <Text style={styles.navLabel}>Accueil</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/profil' as any); }}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="8" r="4" stroke="#A09088" strokeWidth="1.2" fill="none" />
            <Path d="M3 19c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#A09088" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.navLabel}>Profil</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="11" r="3" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
            <Path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" />
          </Svg>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Paramètres</Text>
          <View style={styles.navDot} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EAE0',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
  },

  // Header
  header: {
    alignItems: 'center',
    gap: 3,
    marginTop: 22,
    flexShrink: 0,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 25,
    fontStyle: 'italic',
    color: '#2A2520',
  },

  // Section label
  sectionLabel: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#7A7068',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    paddingLeft: 2,
  },

  // Row base + variants
  rowBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  rowSolo: {
    borderRadius: 12,
  },
  rowFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  rowMiddle: {
    borderTopWidth: 0,
  },
  rowLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 0,
  },
  rowTitle: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#2A2520',
  },
  rowSub: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#9A8878',
    marginTop: 1,
  },

  // Toggle
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    flexShrink: 0,
  },
  toggleOn: { backgroundColor: '#6B3FA0' },
  toggleOff: { backgroundColor: '#D4C4B8' },
  toggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    position: 'absolute',
    top: 2,
  },
  toggleDotOn: { right: 2 },
  toggleDotOff: { left: 2 },

  // Lang pills
  langPill: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  langPillActive: {
    backgroundColor: '#DDD0F8',
  },
  langPillInactive: {
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
  },
  langPillTextActive: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B3FA0',
  },
  langPillTextInactive: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#A09088',
  },

  // Time badge
  timeBadge: {
    backgroundColor: '#DDD0F8',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  timeBadgeText: {
    fontFamily: 'Jost',
    fontSize: 14,
    fontWeight: '500',
    color: '#6B3FA0',
  },

  // Active badge
  activeBadge: {
    backgroundColor: '#FDE8B0',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 20,
  },
  activeBadgeText: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#9A6A00',
  },

  // Version
  versionBlock: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  versionText: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#B0A898',
  },
  versionTagline: {
    fontFamily: 'serif',
    fontSize: 11,
    fontStyle: 'italic',
    color: '#C4A8D4',
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#F0EAE0',
    borderTopWidth: 0.5,
    borderTopColor: '#D4C4B8',
    paddingTop: 8,
    paddingHorizontal: 6,
    zIndex: 2,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  navLabel: {
    fontFamily: 'Jost',
    fontSize: 11,
    fontWeight: '300',
    color: '#A09088',
  },
  navLabelActive: {
    color: '#6B3FA0',
    fontWeight: '500',
  },
  navDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#6B3FA0',
  },
});
