import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PointsToast from '../../components/ui/PointsToast';
import CongratulationsToast from '../../components/ui/CongratulationsToast';

const THEMES = [
  'Confiance & Identité',
  'Abondance & Prospérité',
  'Amour & Relations',
  'Santé & Vitalité',
  'Carrière & Mission',
  'Créativité & Expression',
  'Gratitude & Paix',
];

function getNextStepRoute(status: Record<string, boolean>): string {
  if (!status.affirmation) return '/(app)/affirmation';
  if (!status.action_easy || !status.action_hard) return '/(app)/action';
  if (!status.visualisation) return '/(app)/visualisation';
  if (!status.journal) return '/(app)/journal';
  if (!status.vision_board) return '/(app)/vision-board';
  return 'completed';
}

function goNext(route: string) {
  if (route === 'completed') {
    router.replace('/(app)/celebration' as any);
  } else if (route === '/(app)/journal' || route === '/(app)/vision-board') {
    router.push((route + '?fromCycle=true') as any);
  } else {
    router.push(route as any);
  }
}

function checkMilestones(oldTotal: number, newTotal: number, setToast: (msg: string) => void) {
  const getLevel = (pts: number) => {
    const pct = (pts / 36500) * 100;
    if (pct < 25) return 'Éveillé';
    if (pct < 50) return 'Floraison';
    if (pct < 75) return 'Rayonnant';
    return 'Manifestant';
  };
  const oldK = Math.floor(oldTotal / 1000);
  const newK = Math.floor(newTotal / 1000);
  if (newK > oldK && newTotal > 0) {
    setToast(`✦ ${newK * 1000} pts sur 36 500 — Félicitations !`);
    return;
  }
  const oldLevel = getLevel(oldTotal);
  const newLevel = getLevel(newTotal);
  if (oldLevel !== newLevel) {
    setToast(`✦ Nouveau niveau — ${newLevel} !`);
  }
}

export default function Action() {
  const insets = useSafeAreaInsets();
  const [cycleNumber, setCycleNumber] = useState(1);
  const [themeNumber, setThemeNumber] = useState(1);
  const [themeName, setThemeName] = useState('Confiance & Identité');
  const [easyValidated, setEasyValidated] = useState(false);
  const [hardValidated, setHardValidated] = useState(false);
  const [toast, setToast] = useState('');
  const [congratToast, setCongratToast] = useState('');

  useEffect(() => {
    async function load() {
      const cycle = parseInt(await AsyncStorage.getItem('current_cycle') || '1');
      setCycleNumber(cycle);

      const theme = parseInt(await AsyncStorage.getItem('current_theme') || '1');
      setThemeNumber(theme);
      setThemeName(THEMES[theme - 1]);

      const statusRaw = await AsyncStorage.getItem('cycle_step_status');
      if (statusRaw) {
        const status = JSON.parse(statusRaw);
        if (status.action_easy) setEasyValidated(true);
        if (status.action_hard) setHardValidated(true);
      }
    }
    load();
  }, []);

  async function handleValidateEasy() {
    if (easyValidated) return;

    const statusRaw = await AsyncStorage.getItem('cycle_step_status');
    const status = statusRaw ? JSON.parse(statusRaw) : {};
    status.action_easy = true;
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

    const cyclePoints = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
    await AsyncStorage.setItem('cycle_points', String(cyclePoints + 15));

    const pointsTotal = parseInt(await AsyncStorage.getItem('points_total') || '0');
    await AsyncStorage.setItem('points_total', String(pointsTotal + 15));

    const earnedRaw1 = await AsyncStorage.getItem('cycle_earned_points');
    const earned1 = earnedRaw1 ? JSON.parse(earnedRaw1) : {};
    earned1.action_easy = 15;
    await AsyncStorage.setItem('cycle_earned_points', JSON.stringify(earned1));

    checkMilestones(pointsTotal, pointsTotal + 15, setCongratToast);
    setEasyValidated(true);
    setToast('✦ +15 pts · Action facile validée');

    if (hardValidated) {
      setTimeout(() => {
        goNext(getNextStepRoute(status));
      }, 1500);
    }
  }

  async function handleSkipEasy() {
    if (easyValidated) return;

    const statusRaw = await AsyncStorage.getItem('cycle_step_status');
    const status = statusRaw ? JSON.parse(statusRaw) : {};
    status.action_easy = true;
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

    setEasyValidated(true);

    if (hardValidated) {
      goNext(getNextStepRoute(status));
    }
  }

  async function handleValidateHard() {
    if (hardValidated) return;

    const statusRaw = await AsyncStorage.getItem('cycle_step_status');
    const status = statusRaw ? JSON.parse(statusRaw) : {};
    status.action_hard = true;
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

    const cyclePoints = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
    await AsyncStorage.setItem('cycle_points', String(cyclePoints + 25));

    const pointsTotal = parseInt(await AsyncStorage.getItem('points_total') || '0');
    await AsyncStorage.setItem('points_total', String(pointsTotal + 25));

    const earnedRaw2 = await AsyncStorage.getItem('cycle_earned_points');
    const earned2 = earnedRaw2 ? JSON.parse(earnedRaw2) : {};
    earned2.action_hard = 25;
    await AsyncStorage.setItem('cycle_earned_points', JSON.stringify(earned2));

    checkMilestones(pointsTotal, pointsTotal + 25, setCongratToast);
    setHardValidated(true);
    setToast('✦ +25 pts · Action difficile validée');

    if (easyValidated) {
      setTimeout(() => {
        goNext(getNextStepRoute(status));
      }, 1500);
    }
  }

  async function handleSkipHard() {
    if (hardValidated) return;

    const statusRaw = await AsyncStorage.getItem('cycle_step_status');
    const status = statusRaw ? JSON.parse(statusRaw) : {};
    status.action_hard = true;
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

    setHardValidated(true);

    if (easyValidated) {
      goNext(getNextStepRoute(status));
    }
  }

  return (
    <View style={styles.container}>
      {toast ? <PointsToast message={toast} onHide={() => setToast('')} /> : null}
      {congratToast ? <CongratulationsToast message={congratToast} onHide={() => setCongratToast('')} /> : null}
      <View style={[styles.orb, { width: 130, height: 130, backgroundColor: '#B8D4B0', top: -32, left: -32 }]} />
      <View style={[styles.orb, { width: 75, height: 75, backgroundColor: '#FDE8B0', bottom: 55, right: -18 }]} />

      <View style={styles.content}>

        {/* Bloc haut : œil + barre + badge */}
        <View style={styles.topBlock}>
          <View style={styles.header}>
            <Svg width={130} height={100} viewBox="0 0 56 44">
              <Defs>
                <ClipPath id="axc1">
                  <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
                </ClipPath>
              </Defs>
              <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
              <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#axc1)" />
              <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#axc1)" />
              <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#axc1)" />
              <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#axc1)" />
              <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#axc1)" />
              <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#axc1)" />
              <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#axc1)" />
              <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
              <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
              <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
              <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            </Svg>
            <Text style={styles.title}>Actions du cycle</Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Étape 3 & 4 · Cycle {cycleNumber}</Text>
              <View style={styles.validatedBadge}>
                <Text style={styles.validatedBadgeText}>✓ Affirmation validée</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>

          <View style={styles.themeBadge}>
            <View style={styles.themeDot} />
            <Text style={styles.themeBadgeText}>✦ Thème {themeNumber} · {themeName}</Text>
          </View>
        </View>

        {/* Carte action facile */}
        <View style={styles.cardEasy}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardDot, { backgroundColor: '#6AAA60' }]} />
              <Text style={styles.cardTitleEasy}>Action facile</Text>
            </View>
            <View style={styles.badgeGreen}>
              <Text style={styles.badgeGreenText}>+15 pts</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.actionText}>
              Souris sincèrement à chaque membre de ta famille aujourd'hui.
            </Text>
          </View>
          <View>
            <Pressable
              style={[styles.btnEasy, easyValidated && { opacity: 0.5 }]}
              onPress={handleValidateEasy}
              disabled={easyValidated}
            >
              <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                <Path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.btnEasyText}>Valider · +15 pts</Text>
            </Pressable>
            {!easyValidated && (
              <Pressable onPress={handleSkipEasy}>
                <Text style={styles.skipText}>Passer cette étape sans points</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Carte action difficile */}
        <View style={styles.cardHard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardDot, { backgroundColor: '#C89A10' }]} />
              <Text style={styles.cardTitleHard}>Action difficile</Text>
            </View>
            <View style={styles.badgeGold}>
              <Text style={styles.badgeGoldText}>+25 pts</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.actionText}>
              Souris à trois inconnus et observe ce que cela t'apporte.
            </Text>
          </View>
          <View>
            <Pressable
              style={[styles.btnHard, hardValidated && { opacity: 0.5 }]}
              onPress={handleValidateHard}
              disabled={hardValidated}
            >
              <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                <Path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.btnHardText}>Valider · +25 pts</Text>
            </Pressable>
            {!hardValidated && (
              <Pressable onPress={handleSkipHard}>
                <Text style={styles.skipText}>Passer cette étape sans points</Text>
              </Pressable>
            )}
          </View>
        </View>

      </View>

      {/* Navbar */}
      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.navItem} onPress={() => router.replace('/(app)/home' as any)}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" fill="#6B3FA0" />
          </Svg>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Accueil</Text>
          <View style={styles.navDot} />
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace('/(app)/profil' as any)}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="8" r="4" stroke="#A09088" strokeWidth="1.2" fill="none" />
            <Path d="M3 19c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#A09088" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.navLabel}>Profil</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace('/(app)/parametres' as any)}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="11" r="3" stroke="#A09088" strokeWidth="1.2" fill="none" />
            <Path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" stroke="#A09088" strokeWidth="1.2" strokeLinecap="round" />
          </Svg>
          <Text style={styles.navLabel}>Paramètres</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F0EAE0',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
    zIndex: 1,
  },
  topBlock: {
    flexShrink: 0,
    gap: 6,
  },
  header: {
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    marginTop: 24,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 24,
    fontStyle: 'italic',
    color: '#2A2520',
    marginTop: -14,
  },
  progressBlock: {
    flexShrink: 0,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  progressLabel: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: '#9B80B8',
  },
  validatedBadge: {
    backgroundColor: '#C8E8C0',
    borderRadius: 20,
    paddingVertical: 1,
    paddingHorizontal: 7,
  },
  validatedBadgeText: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#2A6A20',
  },
  progressBar: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(196,168,212,0.25)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#6B3FA0',
    borderRadius: 10,
  },
  themeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(221,208,248,0.4)',
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  themeDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#9B72C8',
  },
  themeBadgeText: {
    fontFamily: 'Jost',
    fontSize: 11,
    fontWeight: '500',
    color: '#6B3FA0',
  },
  cardEasy: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5,
    borderColor: '#C0D8A0',
    borderRadius: 13,
    padding: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardHard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5,
    borderColor: '#E8C860',
    borderRadius: 13,
    padding: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  cardTitleEasy: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#3A6A20',
  },
  cardTitleHard: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#7A5000',
  },
  badgeGreen: {
    backgroundColor: '#C8E8C0',
    borderRadius: 20,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  badgeGreenText: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#2A6A20',
  },
  badgeGold: {
    backgroundColor: '#FDE8B0',
    borderRadius: 20,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  badgeGoldText: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#9A6A00',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: 'serif',
    fontSize: 16,
    fontStyle: 'italic',
    color: '#3A3030',
    lineHeight: 22,
    textAlign: 'center',
  },
  btnEasy: {
    backgroundColor: '#3A6A20',
    borderRadius: 999,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnEasyText: {
    fontFamily: 'Jost',
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  btnHard: {
    backgroundColor: '#8A6A10',
    borderRadius: 999,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnHardText: {
    fontFamily: 'Jost',
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  skipText: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: '#A09088',
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 4,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#F0EAE0',
    borderTopWidth: 0.5,
    borderTopColor: '#D4C4B8',
    paddingTop: 8,
    paddingHorizontal: 6,
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
