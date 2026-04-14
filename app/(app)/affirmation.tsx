import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PointsToast from '../../components/ui/PointsToast';
import CongratulationsToast from '../../components/ui/CongratulationsToast';
import { getCycleColors, getCycleContent } from '../../hooks/useCycleContent';

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast(`✦ ${newK * 1000} pts sur 36 500 — Félicitations !`);
    return;
  }
  const oldLevel = getLevel(oldTotal);
  const newLevel = getLevel(newTotal);
  if (oldLevel !== newLevel) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast(`✦ Nouveau niveau — ${newLevel} !`);
  }
}

export default function Affirmation() {
  const insets = useSafeAreaInsets();
  const [cycleNumber, setCycleNumber] = useState(1);
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
  const [cycleColors, setCycleColors] = useState({ orb1: '#C4A8D4', orb2: '#B8D4B0' });
  const [content, setContent] = useState<ReturnType<typeof getCycleContent>>(null);
  const [validated, setValidated] = useState(false);
  const [toast, setToast] = useState('');
  const [congratToast, setCongratToast] = useState('');
  const [boxWidth, setBoxWidth] = useState(0);

  function getFontSize(text: string): number {
    if (!boxWidth || !text) return 15;
    const len = text.length;
    if (len < 70)  return 20;
    if (len < 100) return 17;
    if (len < 130) return 15;
    if (len < 155) return 13;
    return 12;
  }

  useEffect(() => {
    async function load() {
      const cycle = parseInt(await AsyncStorage.getItem('current_cycle') || '1');
      setCycleNumber(cycle);
      setContent(getCycleContent(cycle));
      setCycleColors(getCycleColors(cycle));

      const statusRaw = await AsyncStorage.getItem('cycle_step_status');
      if (statusRaw) {
        const status = JSON.parse(statusRaw);
        if (status.affirmation) setValidated(true);
      }
    }
    load();
  }, []);

  async function handleValidate() {
    if (validated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const statusRaw = await AsyncStorage.getItem('cycle_step_status');
    const status = statusRaw ? JSON.parse(statusRaw) : {};
    status.affirmation = true;
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

    const cyclePoints = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
    await AsyncStorage.setItem('cycle_points', String(cyclePoints + 15));

    const pointsTotal = parseInt(await AsyncStorage.getItem('points_total') || '0');
    await AsyncStorage.setItem('points_total', String(pointsTotal + 15));

    const earnedRaw = await AsyncStorage.getItem('cycle_earned_points');
    const earned = earnedRaw ? JSON.parse(earnedRaw) : {};
    earned.affirmation = 15;
    await AsyncStorage.setItem('cycle_earned_points', JSON.stringify(earned));

    checkMilestones(pointsTotal, pointsTotal + 15, setCongratToast);
    setValidated(true);
    setToast('✦ +15 pts · Affirmation validée');

    setTimeout(() => {
      goNext(getNextStepRoute(status));
    }, 1500);
  }

  async function handleSkip() {
    if (validated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const statusRaw = await AsyncStorage.getItem('cycle_step_status');
    const status = statusRaw ? JSON.parse(statusRaw) : {};
    status.affirmation = true;
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

    setValidated(true);
    goNext(getNextStepRoute(status));
  }

  return (
    <View style={styles.container}>
      {toast ? <PointsToast message={toast} onHide={() => setToast('')} /> : null}
      {congratToast ? <CongratulationsToast message={congratToast} onHide={() => setCongratToast('')} /> : null}
      <View style={[styles.orb, { width: 140, height: 140, backgroundColor: cycleColors.orb1, top: -35, right: -35 }]} />
      <View style={[styles.orb, { width: 80, height: 80, backgroundColor: cycleColors.orb2, bottom: 55, left: -20 }]} />

      <View style={styles.content}>

        {/* Œil + Titre */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scaleY: eyeAnim }], opacity: eyeAnim }}>
            <Svg width={116} height={89} viewBox="0 0 56 44">
              <Defs>
                <ClipPath id="ac1">
                  <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
                </ClipPath>
              </Defs>
              <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
              <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#ac1)" />
              <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#ac1)" />
              <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#ac1)" />
              <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#ac1)" />
              <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#ac1)" />
              <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#ac1)" />
              <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#ac1)" />
              <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
              <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
              <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
              <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            </Svg>
          </Animated.View>
          <Text style={styles.title}>Affirmation</Text>
        </View>

        {/* Barre progression */}
        <View style={styles.progressBlock}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Étape 2 · Cycle {cycleNumber}</Text>
            <View style={styles.ptsBadge}>
              <Text style={styles.ptsBadgeText}>+15 pts</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Badge thème */}
        <Animated.View style={[styles.themeBadge, { backgroundColor: cycleColors.orb1 + '59', opacity: fadeUp1, transform: [{ translateY: fadeUp1.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <View style={styles.themeDot} />
          <Text style={[styles.themeBadgeText, { color: content?.couleurPrincipale || '#6B3FA0' }]}>✦ Thème · {content?.theme}</Text>
        </Animated.View>

        {/* Carte affirmation */}
        <Animated.View style={[styles.card, { opacity: fadeUp2, transform: [{ translateY: fadeUp2.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <View
            style={styles.cardBody}
            onLayout={e => setBoxWidth(e.nativeEvent.layout.width)}
          >
            <Text style={{
              fontFamily: 'serif',
              fontStyle: 'italic',
              color: '#3A2850',
              textAlign: 'center',
              fontSize: getFontSize(content?.affirmation || ''),
              lineHeight: getFontSize(content?.affirmation || '') * 1.55,
            }}>
              {content?.affirmation}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.instructionText}>
              {'Répète cette phrase à voix haute,\nplusieurs fois, avec sincérité.'}
            </Text>
          </View>
        </Animated.View>

        {/* Bouton + passer */}
        <Animated.View style={[styles.bottomBlock, { opacity: fadeUp3, transform: [{ translateY: fadeUp3.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <Pressable
            style={[styles.validateBtn, validated && { opacity: 0.5 }]}
            onPress={handleValidate}
            disabled={validated}
          >
            <Svg width={11} height={11} viewBox="0 0 12 12" fill="none">
              <Path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.validateBtnText}>J'ai répété mon affirmation · +15 pts</Text>
          </Pressable>
          {!validated && (
            <Pressable onPress={handleSkip}>
              <Text style={styles.skipText}>Passer cette étape sans points</Text>
            </Pressable>
          )}
        </Animated.View>

      </View>

      {/* Navbar */}
      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace('/(app)/home' as any); }}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" fill="#6B3FA0" />
          </Svg>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Accueil</Text>
          <View style={styles.navDot} />
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace('/(app)/profil' as any); }}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="8" r="4" stroke="#A09088" strokeWidth="1.2" fill="none" />
            <Path d="M3 19c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#A09088" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.navLabel}>Profil</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace('/(app)/parametres' as any); }}>
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
    backgroundColor: '#F0EAE0',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    marginTop: 22,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 25,
    fontStyle: 'italic',
    color: '#2A2520',
  },
  progressBlock: {
    flexShrink: 0,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#9B80B8',
  },
  ptsBadge: {
    backgroundColor: '#FDE8B0',
    borderRadius: 20,
    paddingVertical: 1,
    paddingHorizontal: 8,
  },
  ptsBadgeText: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#9A6A00',
  },
  progressBar: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(196,168,212,0.25)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    width: '20%',
    height: '100%',
    backgroundColor: '#6B3FA0',
    borderRadius: 10,
  },
  themeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(221,208,248,0.4)',
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  themeDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#9B72C8',
  },
  themeBadgeText: {
    fontFamily: 'Jost',
    fontSize: 13,
    fontWeight: '500',
    color: '#6B3FA0',
  },
  card: {
    flex: 0.85,
    marginTop: 56,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 13,
    justifyContent: 'space-between',
  },
  cardBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  cardFooter: {
    borderTopWidth: 0.5,
    borderTopColor: '#E0D4CC',
    paddingTop: 8,
  },
  instructionText: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#9A8878',
    textAlign: 'center',
    lineHeight: 19,
  },
  bottomBlock: {
    flexShrink: 0,
    marginTop: 28,
  },
  validateBtn: {
    backgroundColor: '#3A3530',
    borderRadius: 999,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  validateBtnText: {
    fontFamily: 'Jost',
    color: '#F0EAE0',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  skipText: {
    fontFamily: 'Jost',
    fontSize: 13,
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
