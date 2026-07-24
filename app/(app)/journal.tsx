import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, ClipPath, Defs, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCycleColors } from '../../hooks/useCycleContent';
import PointsToast from '../../components/ui/PointsToast';
import CongratulationsToast from '../../components/ui/CongratulationsToast';

function checkMilestones(
  oldTotal: number,
  newTotal: number,
  setToast: (msg: string) => void,
  niveaux: { eveil: string; ancrage: string; expansion: string; manifestation: string },
  toastMilestone: string,
  toastNewLevel: string,
) {
  const getLevel = (pts: number) => {
    const pct = (pts / 36500) * 100;
    if (pct < 25) return niveaux.eveil;
    if (pct < 50) return niveaux.ancrage;
    if (pct < 75) return niveaux.expansion;
    return niveaux.manifestation;
  };
  const oldK = Math.floor(oldTotal / 1000);
  const newK = Math.floor(newTotal / 1000);
  if (newK > oldK && newTotal > 0) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast(toastMilestone.replace('{n}', String(newK * 1000)));
    return;
  }
  const oldLevel = getLevel(oldTotal);
  const newLevel = getLevel(newTotal);
  if (oldLevel !== newLevel) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast(toastNewLevel.replace('{level}', newLevel));
  }
}

type PreviousEntry = {
  cycle: number;
  text: string;
  skipped: boolean;
};

export default function Journal() {
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { lang } = useLanguage();
  const eyeAnim = useRef(new Animated.Value(0)).current;
  const fadeUp1 = useRef(new Animated.Value(0)).current;
  const fadeUp2 = useRef(new Animated.Value(0)).current;
  const fadeUp3 = useRef(new Animated.Value(0)).current;

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
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const [cycleNumber, setCycleNumber] = useState(1);
  const [cycleColors, setCycleColors] = useState({ orb1: '#C4A8D4', orb2: '#B8D4B0' });
  const [journalText, setJournalText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [validated, setValidated] = useState(false);
  const [previousEntries, setPreviousEntries] = useState<PreviousEntry[]>([]);
  const [toast, setToast] = useState('');
  const [congratToast, setCongratToast] = useState('');
  const { fromCycle } = useLocalSearchParams();
  const [nextRoute, setNextRoute] = useState('');
  // Démontage du TextInput avant la transition vers la célébration (cf. rendu plus bas).
  const [leaving, setLeaving] = useState(false);

  // Navigation vers la célébration UNIQUEMENT après le commit du démontage du
  // TextInput. Sinon, pendant l'animation slide_from_bottom, Fabric (New Arch)
  // tente de déplacer le ReactEditText encore monté → crash « View already has a
  // parent ». setLeaving(true) démonte le champ (rendu conditionnel) ; ce useEffect,
  // exécuté APRÈS le rendu, lance alors la navigation en sécurité.
  useEffect(() => {
    if (leaving) router.replace('/(app)/celebration' as any);
  }, [leaving]);

  useEffect(() => {
    async function load() {
      try {
        const cycle = parseInt(await AsyncStorage.getItem('current_cycle') || '1');
        setCycleNumber(cycle);
        setCycleColors(getCycleColors(cycle, lang));

        const statusRaw = await AsyncStorage.getItem('cycle_step_status');
        if (statusRaw) {
          const status = JSON.parse(statusRaw);
          if (status.journal) setValidated(true);
        }

        // 🔴 Recharger l'entrée du CYCLE COURANT (bug d'affichage corrigé le
        // 2026-07-16) : sans ça, le champ repart vide à chaque montage et
        // l'entrée du jour SEMBLE perdue (elle est pourtant bien stockée).
        // Les entrées « passées » (skipped) n'ont pas de texte à restaurer.
        const todayRaw = await AsyncStorage.getItem('journal_cycle_' + cycle);
        if (todayRaw) {
          const today = JSON.parse(todayRaw);
          if (today.text && !today.skipped) {
            setJournalText(today.text);
            setWordCount(today.text.trim() === '' ? 0 : today.text.trim().split(/\s+/).length);
          }
        }

        const entries: PreviousEntry[] = [];
        if (cycle > 1) {
          const keys = Array.from({ length: cycle - 1 }, (_, i) => 'journal_cycle_' + (cycle - 1 - i));
          const results = await AsyncStorage.multiGet(keys);
          for (const [key, value] of results) {
            if (value) {
              const data = JSON.parse(value);
              const cycleNum = parseInt(key.replace('journal_cycle_', ''));
              entries.push({ cycle: cycleNum, text: data.text, skipped: data.skipped || false });
            }
          }
        }
        setPreviousEntries(entries);
      } catch {
        // Storage indisponible — continuer avec valeurs par défaut
      }
    }
    load();
  }, []);

  function getNextStepRoute(status: Record<string, boolean>): string {
    if (!status.affirmation) return '/(app)/affirmation';
    if (!status.action_easy || !status.action_hard) return '/(app)/action';
    if (!status.visualisation) return '/(app)/visualisation';
    if (!status.journal) return '/(app)/journal';
    if (!status.vision_board) return '/(app)/vision-board';
    return 'completed';
  }

  async function handleFinishCycle() {
    // n°5 conditionnée au natif : WEB = flux d'origine (replace direct). Le crash
    // Fabric visé par le démontage du TextInput est impossible sur web (pas de New Arch).
    Platform.OS === 'web'
      ? router.replace('/(app)/celebration' as any)
      : setLeaving(true);
  }

  function handleTextChange(val: string) {
    const words = val.trim() === '' ? [] : val.trim().split(/\s+/);
    if (words.length <= 150) {
      setJournalText(val);
      setWordCount(words.length);
    }
  }

  async function handleSave() {
    if (validated) return;
    if (journalText.trim() === '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await AsyncStorage.setItem(
        'journal_cycle_' + cycleNumber,
        JSON.stringify({ text: journalText.trim(), skipped: false, cycle: cycleNumber })
      );

      const statusRaw = await AsyncStorage.getItem('cycle_step_status');
      const status = statusRaw ? JSON.parse(statusRaw) : {};

      if (!status.journal) {
        const cyclePoints = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
        await AsyncStorage.setItem('cycle_points', String(cyclePoints + 15));
        const pointsTotal = parseInt(await AsyncStorage.getItem('points_total') || '0');
        await AsyncStorage.setItem('points_total', String(pointsTotal + 15));
        status.journal = true;
        await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));
        const earnedRaw = await AsyncStorage.getItem('cycle_earned_points');
        const earned = earnedRaw ? JSON.parse(earnedRaw) : {};
        earned.journal = 15;
        await AsyncStorage.setItem('cycle_earned_points', JSON.stringify(earned));
        checkMilestones(pointsTotal, pointsTotal + 15, setCongratToast, t.niveaux, t.home.toastMilestone, t.home.toastNewLevel);
      }

      setValidated(true);
      setToast(t.journal.toast);

      const route = getNextStepRoute(status);
      if (route === 'completed') {
        setTimeout(() => { Platform.OS === 'web' ? router.replace('/(app)/celebration' as any) : setLeaving(true); }, 1500);
      } else if (fromCycle !== 'true') {
        setTimeout(() => { router.back(); }, 1500);
      } else {
        setNextRoute(route);
      }
    } catch {
      setValidated(true);
      setToast(t.journal.toast);
    }
  }

  async function handleSkip() {
    if (validated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await AsyncStorage.setItem(
        'journal_cycle_' + cycleNumber,
        JSON.stringify({ text: '', skipped: true, cycle: cycleNumber })
      );

      const statusRaw = await AsyncStorage.getItem('cycle_step_status');
      const status = statusRaw ? JSON.parse(statusRaw) : {};
      status.journal = true;
      await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

      setValidated(true);
      const route = getNextStepRoute(status);
      if (route === 'completed') {
        Platform.OS === 'web'
          ? router.replace('/(app)/celebration' as any)
          : setLeaving(true);
      } else if (fromCycle !== 'true') {
        router.back();
      } else {
        setNextRoute(route);
      }
    } catch {
      setValidated(true);
    }
  }

  const canSave = !validated && journalText.trim() !== '';

  return (
    <View style={styles.container}>
      {toast ? <PointsToast message={toast} onHide={() => setToast('')} /> : null}
      {congratToast ? <CongratulationsToast message={congratToast} onHide={() => setCongratToast('')} /> : null}

      {/* Orbes */}
      <View style={[styles.orb, { width: 140, height: 140, backgroundColor: cycleColors.orb1, top: -35, right: -35 }]} />
      <View style={[styles.orb, { width: 80, height: 80, backgroundColor: cycleColors.orb2, bottom: 55, left: -20 }]} />

      {/* Contenu scrollable */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Œil + Titre + Badge */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scaleY: eyeAnim }], opacity: eyeAnim }}>
            <Svg width={144} height={111} viewBox="0 0 56 44" style={{ overflow: 'visible' }}>
              <Defs>
                <ClipPath id="jc1">
                  <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
                </ClipPath>
              </Defs>
              <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
              <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#jc1)" />
              <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#jc1)" />
              <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#jc1)" />
              <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#jc1)" />
              <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#jc1)" />
              <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#jc1)" />
              <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#jc1)" />
              <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
              <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
              <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
              <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            </Svg>
          </Animated.View>

          <Animated.View style={{ width: '100%', opacity: fadeUp1, transform: [{ translateY: fadeUp1.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{t.journal.titre}</Text>
              <View style={styles.ptsBadge}>
                <Text style={styles.ptsBadgeText}>+15 pts</Text>
              </View>
            </View>
            <View style={styles.separator} />
          </Animated.View>
        </View>

        {/* Bloc nouvelle entrée */}
        <Animated.View style={[styles.entryBlock, { opacity: fadeUp2, transform: [{ translateY: fadeUp2.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryLabel}>{t.journal.etape.replace('{n}', String(cycleNumber))}</Text>
            <Text style={styles.entryDate}>{t.journal.aujourdhui}</Text>
          </View>

          <View style={[styles.textAreaWrapper, validated && { opacity: 0.6 }]}>
            {/* Démonté pendant la transition vers la célébration : évite que Fabric
                tente de déplacer ce ReactEditText encore monté (crash « already has a
                parent »). Invisible pour l'utilisateur (l'écran part de toute façon) ;
                inerte sur web où la navigation est instantanée. */}
            {!leaving && (
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={journalText}
              onChangeText={handleTextChange}
              placeholder={t.journal.placeholder}
              placeholderTextColor="#A09088"
              textAlignVertical="top"
              editable={!validated}
              // Ceinture en CARACTÈRES par-dessus la garde des 150 mots : celle-ci
              // compte les mots séparés par des espaces, donc un COLLAGE massif
              // sans espace (1 seul « mot ») la traverserait et pourrait saturer
              // le quota localStorage (~5 Mo). 2000 caractères absorbent
              // confortablement 150 vrais mots — jamais atteint en usage légitime.
              maxLength={2000}
            />
            )}
          </View>

          {!validated && (
            <Text style={styles.wordCounter}>{wordCount} / 150 {t.journal.mots}</Text>
          )}

          <Pressable
            style={[styles.saveBtn, !canSave && { opacity: validated ? 0.5 : 0.4 }]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
              <Path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.saveBtnText}>{t.journal.valider}</Text>
          </Pressable>

          {!validated && (
            <Pressable onPress={handleSkip}>
              <Text style={styles.skipText}>{t.journal.passer}</Text>
            </Pressable>
          )}

          {validated && fromCycle === 'true' && nextRoute === '/(app)/vision-board' && (
            <Pressable style={styles.saveBtn} onPress={() => router.push('/(app)/vision-board?fromCycle=true' as any)}>
              <Text style={styles.saveBtnText}>{t.home.continuerCycle}</Text>
            </Pressable>
          )}
          {validated && fromCycle === 'true' && nextRoute === 'completed' && (
            <Pressable style={styles.saveBtn} onPress={handleFinishCycle}>
              <Text style={styles.saveBtnText}>{t.home.continuerCycle} ✦</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Entrées précédentes */}
        <Animated.View style={[styles.previousSection, { opacity: fadeUp3, transform: [{ translateY: fadeUp3.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <Text style={styles.previousLabel}>{t.journal.entreesPrecedentes}</Text>

          <View style={styles.previousList}>
            {previousEntries.map((entry) => (
              <View key={entry.cycle} style={styles.entryCard}>
                <View style={styles.entryCardHeader}>
                  <Text style={styles.entryCardCycle}>{t.commun.cycle} {entry.cycle}</Text>
                  {entry.skipped ? (
                    <View style={styles.badgeGrey}>
                      <Text style={styles.badgeGreyText}>{t.journal.passe}</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeGreen}>
                      <Text style={styles.badgeGreenText}>✓ +15 pts</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.entryCardText}>
                  {entry.skipped
                    ? t.journal.etapePassee
                    : '« ' + (entry.text.length > 100 ? entry.text.slice(0, 100) + '...' : entry.text) + ' »'}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

      </ScrollView>

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
        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/parametres' as any); }}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="11" r="3" stroke="#A09088" strokeWidth="1.2" fill="none" />
            <Path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" stroke="#A09088" strokeWidth="1.2" strokeLinecap="round" />
          </Svg>
          <Text style={styles.navLabel}>{t.commun.navbar.parametres}</Text>
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
    paddingTop: 16,
    paddingBottom: 16,
    gap: 8,
  },

  // Header
  header: {
    alignItems: 'center',
    gap: 3,
    marginTop: 64,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 22,
    fontStyle: 'italic',
    color: '#2A2520',
  },
  ptsBadge: {
    backgroundColor: '#FDE8B0',
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  ptsBadgeText: {
    fontFamily: 'Jost',
    fontSize: 10,
    fontWeight: '500',
    color: '#9A6A00',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0D8D0',
    marginTop: 2,
  },

  // Bloc nouvelle entrée
  entryBlock: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    borderRadius: 14,
    padding: 10,
    paddingHorizontal: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  entryLabel: {
    fontFamily: 'Jost',
    fontSize: 10,
    fontWeight: '500',
    color: '#2A2520',
  },
  entryDate: {
    fontFamily: 'Jost',
    fontSize: 9,
    color: '#A09088',
  },
  textAreaWrapper: {
    backgroundColor: '#F0EAE0',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    minHeight: 72,
  },
  textArea: {
    fontFamily: 'serif',
    fontSize: 13,
    fontStyle: 'italic',
    color: '#2A2520',
    padding: 10,
    minHeight: 72,
  },
  wordCounter: {
    fontFamily: 'Jost',
    fontSize: 9,
    color: '#A09088',
    textAlign: 'right',
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: '#3A3530',
    borderRadius: 999,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  saveBtnText: {
    fontFamily: 'Jost',
    color: '#F0EAE0',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  skipText: {
    fontFamily: 'Jost',
    fontSize: 10,
    color: '#A09088',
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 5,
  },

  // Entrées précédentes
  previousSection: {
    gap: 0,
  },
  previousLabel: {
    fontFamily: 'Jost',
    fontSize: 10,
    color: '#7A7068',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  previousList: {
    gap: 6,
  },
  entryCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    padding: 8,
    paddingHorizontal: 11,
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  entryCardCycle: {
    fontFamily: 'Jost',
    fontSize: 10,
    fontWeight: '500',
    color: '#2A2520',
  },
  badgeGreen: {
    backgroundColor: '#C8E8C0',
    borderRadius: 10,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  badgeGreenText: {
    fontFamily: 'Jost',
    fontSize: 8,
    color: '#2A6A20',
  },
  badgeGrey: {
    backgroundColor: '#F0EAE0',
    borderRadius: 10,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  badgeGreyText: {
    fontFamily: 'Jost',
    fontSize: 8,
    color: '#A09088',
  },
  entryCardText: {
    fontFamily: 'serif',
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6A6058',
    lineHeight: 17,
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
    fontSize: 8,
    fontWeight: '300',
    color: '#A09088',
  },
});
