import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PointsToast from '../../components/ui/PointsToast';
import CongratulationsToast from '../../components/ui/CongratulationsToast';
import { getCycleContent } from '../../hooks/useCycleContent';

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

export default function Visualisation() {
  const insets = useSafeAreaInsets();

  const [cycleNumber, setCycleNumber] = useState(1);
  const [content, setContent] = useState<ReturnType<typeof getCycleContent>>(null);
  const [validated, setValidated] = useState(false);
  const [toast, setToast] = useState('');
  const [congratToast, setCongratToast] = useState('');
  const [breathePhase, setBreathePhase] = useState<'inspire' | 'retiens' | 'expire'>('inspire');

  // Animation cercle respiration
  const breatheAnim = useRef(new Animated.Value(1)).current;

  // Animations fadeWord pour les 4 phrases
  const fade1 = useRef(new Animated.Value(0)).current;
  const fade2 = useRef(new Animated.Value(0)).current;
  const fade3 = useRef(new Animated.Value(0)).current;
  const fade4 = useRef(new Animated.Value(0)).current;

  // Animation shimmer phrase finale
  const shimmer = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function load() {
      const cycle = parseInt(await AsyncStorage.getItem('current_cycle') || '1');
      setCycleNumber(cycle);
      setContent(getCycleContent(cycle));

      const statusRaw = await AsyncStorage.getItem('cycle_step_status');
      if (statusRaw) {
        const status = JSON.parse(statusRaw);
        if (status.visualisation) setValidated(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    // Breathe animation synced with phases: inspire 4s, retiens 2s, expire 4s
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.12, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1.12, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 0.95, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // FadeWord séquentiel
    Animated.sequence([Animated.delay(500), Animated.timing(fade1, { toValue: 1, duration: 800, useNativeDriver: true })]).start();
    Animated.sequence([Animated.delay(1200), Animated.timing(fade2, { toValue: 1, duration: 800, useNativeDriver: true })]).start();
    Animated.sequence([Animated.delay(1900), Animated.timing(fade3, { toValue: 1, duration: 800, useNativeDriver: true })]).start();
    Animated.sequence([Animated.delay(2600), Animated.timing(fade4, { toValue: 1, duration: 800, useNativeDriver: true })]).start();

    // Shimmer phrase finale après 3s
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }, 3000);

    return () => clearTimeout(t);
  }, []);

  // Cycle de respiration — texte selon phase
  useEffect(() => {
    if (validated) return;

    let running = true;

    const loop = async () => {
      while (running) {
        setBreathePhase('inspire');
        await new Promise(r => setTimeout(r, 4000));
        if (!running) break;
        setBreathePhase('retiens');
        await new Promise(r => setTimeout(r, 2000));
        if (!running) break;
        setBreathePhase('expire');
        await new Promise(r => setTimeout(r, 4000));
      }
    };

    loop();
    return () => { running = false; };
  }, [validated]);

  const breatheText =
    breathePhase === 'inspire' ? 'Inspire\ndoucement' :
    breathePhase === 'retiens' ? 'Retiens' :
    'Expire\nlentement';

  async function handleValidate() {
    if (validated) return;

    const statusRaw = await AsyncStorage.getItem('cycle_step_status');
    const status = statusRaw ? JSON.parse(statusRaw) : {};
    status.visualisation = true;
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

    const cyclePoints = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
    await AsyncStorage.setItem('cycle_points', String(cyclePoints + 15));

    const pointsTotal = parseInt(await AsyncStorage.getItem('points_total') || '0');
    await AsyncStorage.setItem('points_total', String(pointsTotal + 15));

    const earnedRaw = await AsyncStorage.getItem('cycle_earned_points');
    const earned = earnedRaw ? JSON.parse(earnedRaw) : {};
    earned.visualisation = 15;
    await AsyncStorage.setItem('cycle_earned_points', JSON.stringify(earned));

    checkMilestones(pointsTotal, pointsTotal + 15, setCongratToast);
    setValidated(true);
    setToast('✦ +15 pts · Visualisation validée');

    setTimeout(() => {
      goNext(getNextStepRoute(status));
    }, 1500);
  }

  async function handleSkip() {
    if (validated) return;

    const statusRaw = await AsyncStorage.getItem('cycle_step_status');
    const status = statusRaw ? JSON.parse(statusRaw) : {};
    status.visualisation = true;
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

    setValidated(true);
    goNext(getNextStepRoute(status));
  }

  return (
    <View style={styles.container}>
      {toast ? <PointsToast message={toast} onHide={() => setToast('')} /> : null}
      {congratToast ? <CongratulationsToast message={congratToast} onHide={() => setCongratToast('')} /> : null}
      <View style={[styles.orb, { width: 130, height: 130, backgroundColor: '#C4E8F0', top: -32, right: -32 }]} />
      <View style={[styles.orb, { width: 80, height: 80, backgroundColor: '#DDD0F8', bottom: 55, left: -20 }]} />

      <View style={styles.content}>

        {/* Œil + Titre */}
        <View style={styles.header}>
          <Svg width={110} height={85} viewBox="0 0 56 44">
            <Defs>
              <ClipPath id="vc1">
                <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
              </ClipPath>
            </Defs>
            <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
            <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#vc1)" />
            <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#vc1)" />
            <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#vc1)" />
            <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#vc1)" />
            <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#vc1)" />
            <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#vc1)" />
            <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#vc1)" />
            <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
            <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
            <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
          </Svg>
          <Text style={styles.title}>Visualisation</Text>
        </View>

        {/* Barre progression */}
        <View style={styles.progressBlock}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Étape 5 · Cycle {cycleNumber}</Text>
            <View style={styles.ptsBadge}>
              <Text style={styles.ptsBadgeText}>+15 pts</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Badge thème */}
        {content?.theme ? (
          <View style={styles.themeBadge}>
            <View style={styles.themeDot} />
            <Text style={styles.themeBadgeText}>✦ Thème · {content.theme}</Text>
          </View>
        ) : null}

        {/* Cercle respiration */}
        <View style={styles.breatheBlock}>
          <Animated.View style={[styles.breatheCircle, { transform: [{ scale: breatheAnim }] }]}>
            <View style={styles.breatheRing} />
            <View style={styles.breatheInner}>
              <Text style={styles.breatheText}>{breatheText}</Text>
            </View>
          </Animated.View>
          <Text style={styles.breatheHint}>inspire 4s · retiens 2s · expire 4s</Text>
        </View>

        {/* Bloc texte guidé */}
        <View style={styles.textBlock}>
          <View style={styles.textPhrases}>
            <Animated.Text style={[styles.phrase, { opacity: fade1 }]} adjustsFontSizeToFit numberOfLines={2}>
              {content?.visualisation.p1}
            </Animated.Text>
            <Animated.Text style={[styles.phrase, { opacity: fade2 }]} adjustsFontSizeToFit numberOfLines={2}>
              {content?.visualisation.p2}
            </Animated.Text>
            <Animated.Text style={[styles.phrase, { opacity: fade3 }]} adjustsFontSizeToFit numberOfLines={2}>
              {content?.visualisation.p3}
            </Animated.Text>
            <Animated.Text style={[styles.phrase, { opacity: fade4 }]} adjustsFontSizeToFit numberOfLines={2}>
              {content?.visualisation.p4}
            </Animated.Text>
          </View>
          <View style={styles.textFooter}>
            <Animated.Text style={[styles.phraseFinale, { opacity: shimmer }]} adjustsFontSizeToFit numberOfLines={2}>
              {content?.visualisation.finale}
            </Animated.Text>
          </View>
        </View>

        {/* Bouton + passer */}
        <View style={styles.bottomBlock}>
          <Pressable
            style={[styles.validateBtn, validated && { opacity: 0.5 }]}
            onPress={handleValidate}
            disabled={validated}
          >
            <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
              <Path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.validateBtnText}>J'ai visualisé · +15 pts ✦</Text>
          </Pressable>
          {!validated && (
            <Pressable onPress={handleSkip}>
              <Text style={styles.skipText}>Passer cette étape sans points</Text>
            </Pressable>
          )}
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
    gap: 0,
    flexShrink: 0,
    marginTop: 24,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 26,
    fontStyle: 'italic',
    color: '#2A2520',
    marginTop: -6,
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
    fontSize: 12,
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
    fontSize: 12,
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
    width: '75%',
    height: '100%',
    backgroundColor: '#6B3FA0',
    borderRadius: 10,
  },
  themeBadge: {
    alignSelf: 'flex-start',
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
    fontSize: 10,
    fontWeight: '500',
    color: '#6B3FA0',
  },
  breatheBlock: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    marginTop: 16,
  },
  breatheCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: 'rgba(155,114,200,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  breatheRing: {
    position: 'absolute',
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 0.5,
    borderColor: 'rgba(155,114,200,0.2)',
    top: -13,
    left: -13,
  },
  breatheInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(155,114,200,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(155,114,200,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  breatheText: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#6B3FA0',
    lineHeight: 18,
    textAlign: 'center',
  },
  breatheHint: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#9A8878',
    letterSpacing: 0.4,
    marginTop: 16,
  },
  textBlock: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 0.5,
    borderColor: '#C4D8E8',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  textPhrases: {
    gap: 5,
  },
  phrase: {
    fontFamily: 'serif',
    fontSize: 14,
    fontStyle: 'italic',
    color: '#4A3060',
    lineHeight: 22,
    textAlign: 'center',
  },
  textFooter: {
    borderTopWidth: 0.5,
    borderTopColor: '#D4C4D8',
    paddingTop: 7,
    marginTop: 5,
  },
  phraseFinale: {
    fontFamily: 'serif',
    fontSize: 16,
    fontStyle: 'italic',
    color: '#6B3FA0',
    textAlign: 'center',
  },
  bottomBlock: {
    flexShrink: 0,
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
    fontSize: 12,
    color: '#A09088',
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 14,
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
    fontSize: 10,
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
