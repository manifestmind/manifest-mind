import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { deleteUser, sendSignInLinkToEmail, signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { getCycleContent } from '../../hooks/useCycleContent';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
  const t = useTranslation();
  const { lang, setLang: setLangContext } = useLanguage();
  const eyeAnim = useRef(new Animated.Value(0)).current;
  const fadeUp1 = useRef(new Animated.Value(0)).current;
  const fadeUp2 = useRef(new Animated.Value(0)).current;
  const fadeUp3 = useRef(new Animated.Value(0)).current;
  const fadeUp4 = useRef(new Animated.Value(0)).current;

  const [notifAffirmation, setNotifAffirmation] = useState(true);
  const [notifRappel, setNotifRappel] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => {
      Animated.timing(eyeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
    }, 100);
    const t1 = setTimeout(() => {
      Animated.timing(fadeUp1, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 400);
    const t2 = setTimeout(() => {
      Animated.timing(fadeUp2, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 600);
    const t3 = setTimeout(() => {
      Animated.timing(fadeUp3, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 800);
    const t4 = setTimeout(() => {
      Animated.timing(fadeUp4, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1000);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // ── Load persisted settings ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [storedNotifAff, storedNotifRappel, storedTime] =
          await AsyncStorage.multiGet([
            'notif_affirmation',
            'notif_rappel',
            'reminder_time',
          ]);

        if (storedNotifAff[1] !== null) setNotifAffirmation(storedNotifAff[1] === 'true');
        if (storedNotifRappel[1] !== null) setNotifRappel(storedNotifRappel[1] === 'true');
        if (storedTime[1]) {
          const [h, m] = storedTime[1].split(':').map(Number);
          const d = new Date();
          d.setHours(h, m, 0, 0);
          setReminderTime(d);
        }
      } catch {
        // Storage indisponible — conserver les valeurs par défaut
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
    const cycleContent = getCycleContent(cycleNumber, lang);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ManifestMind ✦',
        body: cycleContent?.affirmation || t.notifications.affirmationBody,
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
        body: t.notifications.rappelBody,
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
    setLangContext(l);
  }

  async function handleNotifAffirmation() {
    const next = !notifAffirmation;
    if (next) {
      const ok = await requestPermissions();
      if (!ok) {
        Alert.alert(t.parametres.alertNotifsDesactivees.titre, t.parametres.alertNotifsDesactivees.corps);
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
        Alert.alert(t.parametres.alertNotifsDesactivees.titre, t.parametres.alertNotifsDesactivees.corps);
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
    if (notifAffirmation) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') await scheduleAffirmationNotif(date);
    }
  }

  function handleSignOut() {
    Alert.alert(
      t.parametres.alertDeconnecter.titre,
      t.parametres.alertDeconnecter.corps,
      [
        { text: t.parametres.alertDeconnecter.annuler, style: 'cancel' },
        {
          text: t.parametres.alertDeconnecter.confirmer,
          style: 'destructive',
          onPress: async () => {
            // 1. Firebase sign out (silencieux si pas de compte connecté)
            try {
              if (auth.currentUser) await signOut(auth);
            } catch {}

            // 2. Supprimer toutes les clés nommées (user_language conservée)
            await AsyncStorage.multiRemove([
              'onboarding_completed',
              'user_name',
              'current_cycle',
              'current_theme',
              'cycle_completed',
              'cycle_points',
              'points_total',
              'next_cycle_time',
              'cycle_step_status',
              'cycle_earned_points',
              'vision_board_photos',
              'notif_affirmation',
              'notif_rappel',
              'reminder_time',
              'selected_plan',
              'emailForSignIn',
            ]);

            // 3. Supprimer les entrées journal (journal_cycle_N)
            try {
              const allKeys = await AsyncStorage.getAllKeys();
              const journalKeys = allKeys.filter(k => k.startsWith('journal_cycle_'));
              if (journalKeys.length > 0) await AsyncStorage.multiRemove(journalKeys);
            } catch {}

            router.replace('/(onboarding)/welcome' as any);
          },
        },
      ]
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      t.parametres.alertSupprimer.titre,
      t.parametres.alertSupprimer.corps,
      [
        { text: t.parametres.alertSupprimer.annuler, style: 'cancel' },
        {
          text: t.parametres.alertSupprimer.confirmer,
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (user) {
              try {
                await deleteUser(user);
              } catch (error: any) {
                if (error?.code === 'auth/requires-recent-login') {
                  // Ré-authentification nécessaire → proposer un nouveau magic link
                  const email = user.email ?? '';
                  Alert.alert(
                    t.parametres.alertSupprimerReauth.titre,
                    t.parametres.alertSupprimerReauth.corps,
                    [
                      { text: t.parametres.alertSupprimerReauth.annuler, style: 'cancel' },
                      {
                        text: t.parametres.alertSupprimerReauth.envoyer,
                        onPress: async () => {
                          try {
                            await sendSignInLinkToEmail(auth, email, {
                              url: 'https://manifest-mind.app',
                              handleCodeInApp: true,
                            });
                            await AsyncStorage.setItem('emailForSignIn', email);
                            Alert.alert(t.auth.alertEmailSent.titre, t.auth.alertEmailSent.corps);
                          } catch {
                            Alert.alert(t.auth.alertEmailError.titre, t.auth.alertEmailError.corps);
                          }
                        },
                      },
                    ]
                  );
                  return; // Attendre la ré-auth — ne pas effacer les données
                }
                // Autre erreur Firebase → continuer quand même le nettoyage local
              }
            }

            // Effacer toutes les données locales et rediriger
            await AsyncStorage.clear();
            router.replace('/(onboarding)/welcome' as any);
          },
        },
      ]
    );
  }

  function handleRestorePurchases() {
    Alert.alert(t.parametres.alertRestaurer.titre, t.parametres.alertRestaurer.corps);
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 12, 24) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* 1. ŒIL + TITRE */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scaleY: eyeAnim }], opacity: eyeAnim }}>
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
          </Animated.View>
          <Text style={styles.title}>{t.parametres.titre}</Text>
        </View>

        {/* 2. LANGUE */}
        <Animated.View style={{ opacity: fadeUp1, transform: [{ translateY: fadeUp1.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          <Text style={styles.sectionLabel}>{t.parametres.sections.langue}</Text>
          <View style={[styles.rowBase, styles.rowSolo]}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Circle cx="10" cy="10" r="7" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
              <Path d="M10 3c-2 2-3 4.5-3 7s1 5 3 7" stroke="#6B3FA0" strokeWidth="1" fill="none" />
              <Path d="M10 3c2 2 3 4.5 3 7s-1 5-3 7" stroke="#6B3FA0" strokeWidth="1" fill="none" />
              <Path d="M3 10h14" stroke="#6B3FA0" strokeWidth="1" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>{t.parametres.langueApp}</Text>
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
        </Animated.View>

        {/* 3. NOTIFICATIONS */}
        <Animated.View style={{ opacity: fadeUp2, transform: [{ translateY: fadeUp2.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          <Text style={styles.sectionLabel}>{t.parametres.sections.notifications}</Text>

          {/* Ligne 1 — Affirmation du cycle */}
          <View style={[styles.rowBase, styles.rowFirst]}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M10 2a6 6 0 0 1 6 6c0 3 1 4 2 5H2c1-1 2-2 2-5a6 6 0 0 1 6-6z" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
              <Path d="M8 17a2 2 0 0 0 4 0" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" />
            </Svg>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t.parametres.notifs.affirmationTitre}</Text>
              <Text style={styles.rowSub}>{t.parametres.notifs.affirmationSub}</Text>
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
              <Text style={styles.rowTitle}>{t.parametres.notifs.heureTitre}</Text>
              <Text style={styles.rowSub}>{t.parametres.notifs.heureSub}</Text>
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
              <Text style={styles.rowTitle}>{t.parametres.notifs.rappelTitre}</Text>
              <Text style={styles.rowSub}>{t.parametres.notifs.rappelSub}</Text>
            </View>
            <Pressable onPress={handleNotifRappel}>
              <Toggle on={notifRappel} />
            </Pressable>
          </View>
        </Animated.View>

        {/* 4. ABONNEMENT */}
        <Animated.View style={{ opacity: fadeUp3, transform: [{ translateY: fadeUp3.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          <Text style={styles.sectionLabel}>{t.parametres.sections.abonnement}</Text>

          {/* Ligne 1 — Plan actuel */}
          <Pressable
            style={[styles.rowBase, styles.rowFirst]}
            onPress={() => router.push('/(app)/pricing-upgrade' as any)}
          >
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" fill="#EAC870" stroke="#C89A30" strokeWidth="0.8" />
            </Svg>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t.parametres.abonnement.planActuel}</Text>
              <Text style={styles.rowSub}>{t.parametres.abonnement.planSub}</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{t.parametres.abonnement.actif}</Text>
            </View>
          </Pressable>

          {/* Ligne 2 — Restaurer les achats */}
          <Pressable style={[styles.rowBase, styles.rowLast]} onPress={handleRestorePurchases}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Rect x="3" y="5" width="14" height="10" rx="2" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
              <Path d="M3 9h14" stroke="#6B3FA0" strokeWidth="1.2" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>{t.parametres.abonnement.restaurer}</Text>
            <Chevron />
          </Pressable>
        </Animated.View>

        {/* 5. COMPTE + LÉGAL + VERSION */}
        <Animated.View style={{ gap: 8, opacity: fadeUp4, transform: [{ translateY: fadeUp4.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
        <View>
          <Text style={styles.sectionLabel}>{t.parametres.sections.compte}</Text>

          {/* Ligne 1 — Se déconnecter */}
          <Pressable style={[styles.rowBase, styles.rowFirst]} onPress={handleSignOut}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M13 3h4v14h-4M9 14l4-4-4-4M3 10h10" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>{t.parametres.compte.deconnecter}</Text>
            <Chevron />
          </Pressable>

          {/* Ligne 2 — Supprimer mon compte */}
          <Pressable style={[styles.rowBase, styles.rowLast]} onPress={handleDeleteAccount}>
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M5 5l10 10M15 5L5 15" stroke="#C04040" strokeWidth="1.2" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1, color: '#C04040' }]}>{t.parametres.compte.supprimer}</Text>
            <Chevron color="#D08080" />
          </Pressable>
        </View>

        {/* 6. LÉGAL */}
        <View>
          <Text style={styles.sectionLabel}>{t.parametres.sections.legal}</Text>

          {/* Ligne 1 — Politique de confidentialité */}
          <Pressable
            style={[styles.rowBase, styles.rowFirst]}
            onPress={async () => { try { await Linking.openURL(t.legal.privacyUrl); } catch {} }}
          >
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Rect x="4" y="2" width="12" height="16" rx="2" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
              <Path d="M7 7h6M7 10h6M7 13h4" stroke="#6B3FA0" strokeWidth="1" strokeLinecap="round" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>{t.parametres.legalLinks.confidentialite}</Text>
            <Chevron />
          </Pressable>

          {/* Ligne 2 — Conditions d'utilisation */}
          <Pressable
            style={[styles.rowBase, styles.rowLast]}
            onPress={async () => { try { await Linking.openURL(t.legal.termsUrl); } catch {} }}
          >
            <Svg width={14} height={14} viewBox="0 0 20 20" fill="none">
              <Path d="M10 2l7 4v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-4z" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
            </Svg>
            <Text style={[styles.rowTitle, { flex: 1 }]}>{t.parametres.legalLinks.conditions}</Text>
            <Chevron />
          </Pressable>
        </View>

        {/* 7. VERSION */}
        <View style={styles.versionBlock}>
          <Text style={styles.versionText}>ManifestMind v1.0.0</Text>
          <Text style={styles.versionTagline}>{t.parametres.tagline}</Text>
        </View>
        </Animated.View>

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
          <Text style={styles.navLabel}>{t.commun.navbar.accueil}</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/profil' as any); }}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="8" r="4" stroke="#A09088" strokeWidth="1.2" fill="none" />
            <Path d="M3 19c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#A09088" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.navLabel}>{t.commun.navbar.profil}</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="11" r="3" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
            <Path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" />
          </Svg>
          <Text style={[styles.navLabel, styles.navLabelActive]}>{t.commun.navbar.parametres}</Text>
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
    fontSize: 13,
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
