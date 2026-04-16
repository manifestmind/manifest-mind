import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getCycleColors } from '../../hooks/useCycleContent';
import { shareProgress } from '../../hooks/useShare';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, ClipPath, Defs, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function Celebration() {
  const insets = useSafeAreaInsets();
  const t = useTranslation();

  const STEPS_CONFIG = [
    { key: 'opening',       label: t.celebration.etapes.ouverture,      pts: 10 },
    { key: 'affirmation',   label: t.celebration.etapes.affirmation,    pts: 15 },
    { key: 'action_easy',   label: t.celebration.etapes.actionFacile,   pts: 15 },
    { key: 'action_hard',   label: t.celebration.etapes.actionDifficile, pts: 25 },
    { key: 'visualisation', label: t.celebration.etapes.visualisation,  pts: 15 },
    { key: 'journal',       label: t.celebration.etapes.journal,        pts: 15 },
    { key: 'vision_board',  label: t.celebration.etapes.visionBoard,    pts: 5  },
  ];

  const [cyclePoints, setCyclePoints] = useState(0);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [cycleColors, setCycleColors] = useState({ orb1: '#C4A8D4', orb2: '#B8D4B0' });
  const [earnedPoints, setEarnedPoints] = useState<Record<string, number>>({});

  // Eye open + count
  const eyeAnim  = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  // Badges étapes
  const b0 = useRef(new Animated.Value(0)).current;
  const b1 = useRef(new Animated.Value(0)).current;
  const b2 = useRef(new Animated.Value(0)).current;
  const b3 = useRef(new Animated.Value(0)).current;
  const b4 = useRef(new Animated.Value(0)).current;
  const b5 = useRef(new Animated.Value(0)).current;
  const b6 = useRef(new Animated.Value(0)).current;

  // Orbes
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;
  const orb4 = useRef(new Animated.Value(0)).current;

  // Etoiles
  const s1 = useRef(new Animated.Value(0)).current;
  const s2 = useRef(new Animated.Value(0)).current;
  const s3 = useRef(new Animated.Value(0)).current;
  const s4 = useRef(new Animated.Value(0)).current;
  const s5 = useRef(new Animated.Value(0)).current;
  const s6 = useRef(new Animated.Value(0)).current;

  // Autres
  const breathe = useRef(new Animated.Value(0)).current;
  const ring1   = useRef(new Animated.Value(0)).current;
  const ring2   = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const fade1   = useRef(new Animated.Value(0)).current;
  const fade2   = useRef(new Animated.Value(0)).current;
  const fade3   = useRef(new Animated.Value(0)).current;

  // Chargement donnees
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    async function load() {
      await AsyncStorage.setItem('cycle_completed', 'true');
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      await AsyncStorage.setItem('next_cycle_time', String(tomorrow.getTime()));

      const pts = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
      setCyclePoints(pts);
      countAnim.addListener(({ value }) => setDisplayPoints(Math.round(value)));
      setTimeout(() => {
        Animated.timing(countAnim, {
          toValue: pts,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      }, 600);

      const bestSoFar = parseInt(await AsyncStorage.getItem('best_cycle_points') || '0');
      if (pts > bestSoFar) {
        await AsyncStorage.setItem('best_cycle_points', String(pts));
      }

      const earnedRaw = await AsyncStorage.getItem('cycle_earned_points');
      if (earnedRaw) setEarnedPoints(JSON.parse(earnedRaw));

      const cycle = parseInt(await AsyncStorage.getItem('current_cycle') || '1');
      setCycleNumber(cycle);
      setCycleColors(getCycleColors(cycle));
    }
    load();
  }, []);

  // Animations
  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];

    const startLoop = (anim: Animated.Value, delay: number, duration: number) => {
      const t = setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ).start();
      }, delay);
      ids.push(t);
    };

    startLoop(orb1, 0,    2500);
    startLoop(orb2, 1500, 2500);
    startLoop(orb3, 3000, 2500);
    startLoop(orb4, 2000, 2500);
    startLoop(ring1, 0,   1500);
    startLoop(ring2, 500, 1500);

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    const popStar = (anim: Animated.Value, delay: number) => {
      const t = setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      }, delay);
      ids.push(t);
    };

    popStar(s1, 800);
    popStar(s2, 1000);
    popStar(s3, 1200);
    popStar(s4, 900);
    popStar(s5, 1100);
    popStar(s6, 1300);

    const fadeUp = (anim: Animated.Value, delay: number) => {
      const t = setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      }, delay);
      ids.push(t);
    };

    // eyeAnim ouverture
    const te = setTimeout(() => {
      Animated.timing(eyeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
    }, 100);
    ids.push(te);

    fadeUp(fade1, 400);
    fadeUp(fade2, 600);
    fadeUp(fade3, 900);

    return () => { ids.forEach(clearTimeout); };
  }, []);

  // Badges étapes 1 par 1 — dépend de cyclePoints (déclenché après chargement)
  useEffect(() => {
    if (cyclePoints === 0) return;
    const badgeAnims = [b0, b1, b2, b3, b4, b5, b6];
    const ids: ReturnType<typeof setTimeout>[] = [];
    badgeAnims.forEach((bAnim, i) => {
      bAnim.setValue(0);
      const t = setTimeout(() => {
        Animated.timing(bAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      }, 1800 + i * 200);
      ids.push(t);
    });
    return () => { ids.forEach(clearTimeout); };
  }, [cyclePoints]);

  // Styles animes
  const orbStyle = (anim: Animated.Value) => ({
    opacity:   anim.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.45] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
  });

  const breatheScaleY = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 0.93] });

  const ringStyle = (anim: Animated.Value) => ({
    opacity:   anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.5] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
  });

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

  const starStyle = (anim: Animated.Value) => ({
    opacity:   anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 1] }),
    transform: [
      { scale:  anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1.2, 1] }) },
      { rotate: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: ['-20deg', '5deg', '0deg'] }) },
    ],
  });

  const fadeStyle = (anim: Animated.Value) => ({
    opacity:   anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  });

  return (
    <View style={styles.container}>
      {/* Orbes */}
      <Animated.View style={[styles.orb, { width: 180, height: 180, backgroundColor: cycleColors.orb1, top: -50,  right: -50  }, orbStyle(orb1)]} />
      <Animated.View style={[styles.orb, { width: 120, height: 120, backgroundColor: cycleColors.orb2, bottom: -30, left: -30  }, orbStyle(orb2)]} />
      <Animated.View style={[styles.orb, { width: 80,  height: 80,  backgroundColor: '#E8C890', top: 200,  left: -25   }, orbStyle(orb3)]} />
      <Animated.View style={[styles.orb, { width: 60,  height: 60,  backgroundColor: '#DDD0F8', bottom: 120, right: -15 }, orbStyle(orb4)]} />

      {/* Icône partage */}
      <View style={{ position: 'absolute', top: Math.max(insets.top + 16, 76), right: 28, zIndex: 10, alignItems: 'center', gap: 3 }}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); shareProgress(); }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 0.5, borderColor: '#D4C4B8', alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M18 8a3 3 0 100-6 3 3 0 000 6z" stroke="#6B3FA0" strokeWidth={1.4} fill="none" />
            <Path d="M6 15a3 3 0 100-6 3 3 0 000 6z" stroke="#6B3FA0" strokeWidth={1.4} fill="none" />
            <Path d="M18 20a3 3 0 100-6 3 3 0 000 6z" stroke="#6B3FA0" strokeWidth={1.4} fill="none" />
            <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#6B3FA0" strokeWidth={1.4} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Text style={{ fontFamily: 'Jost', fontSize: 9, color: '#9A8878' }}>{t.commun.partager}</Text>
      </View>

      {/* Contenu */}
      <View style={[styles.content, {
        paddingTop:    Math.max(insets.top, 24),
        paddingBottom: Math.max(insets.bottom, 20),
      }]}>

        {/* Section 1 : Oeil + etoiles + titre */}
        <Animated.View style={[styles.eyeSection, fadeStyle(fade1)]}>
          <View style={styles.eyeContainer}>
            {/* Etoiles */}
            <Animated.Text style={[styles.star, { top: 0,   left: 10,  fontSize: 14, color: '#EAC870' }, starStyle(s1)]}>&#10086;</Animated.Text>
            <Animated.Text style={[styles.star, { top: 0,   right: 10, fontSize: 10, color: '#C4A8D4' }, starStyle(s2)]}>&#10086;</Animated.Text>
            <Animated.Text style={[styles.star, { top: 46,  left: 0,   fontSize: 8,  color: '#B8D4B0' }, starStyle(s3)]}>&#10086;</Animated.Text>
            <Animated.Text style={[styles.star, { top: 40,  right: 0,  fontSize: 12, color: '#EAC870' }, starStyle(s4)]}>&#10086;</Animated.Text>
            <Animated.Text style={[styles.star, { bottom: 0,  left: 16,  fontSize: 9,  color: '#9B72C8' }, starStyle(s5)]}>&#10086;</Animated.Text>
            <Animated.Text style={[styles.star, { bottom: 2,  right: 12, fontSize: 11, color: '#B8D4B0' }, starStyle(s6)]}>&#10086;</Animated.Text>

            {/* Anneaux */}
            <Animated.View style={[styles.ring, { width: 140, height: 140, borderRadius: 70, top: -10, left: 10, borderColor: 'rgba(155,114,200,0.3)' }, ringStyle(ring1)]} />
            <Animated.View style={[styles.ring, { width: 112, height: 112, borderRadius: 56, top: 4,   left: 24, borderColor: 'rgba(155,114,200,0.2)' }, ringStyle(ring2)]} />

            {/* Oeil SVG */}
            <Animated.View style={{ transform: [{ scaleY: eyeAnim }], opacity: eyeAnim }}>
            <Animated.View style={[styles.eyeWrapper, { transform: [{ scaleY: breatheScaleY }] }]}>
              <Svg width={110} height={85} viewBox="0 0 56 44" style={{ overflow: 'visible' }}>
                <Defs>
                  <ClipPath id="cc1">
                    <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
                  </ClipPath>
                </Defs>
                <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
                <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#cc1)" />
                <Circle cx="28" cy="22" r="8"    fill="#9B72C8" opacity="0.75" clipPath="url(#cc1)" />
                <Circle cx="28" cy="22" r="5.8"  fill="#6B3FA0" opacity="0.9"  clipPath="url(#cc1)" />
                <Circle cx="28" cy="22" r="3"    fill="#1A0E30" clipPath="url(#cc1)" />
                <Circle cx="30.5" cy="19.5" r="1.3" fill="white"   opacity="0.9" clipPath="url(#cc1)" />
                <Circle cx="28"   cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#cc1)" />
                <Circle cx="28"   cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#cc1)" />
                <Path d="M8 22 Q28 6 48 22"  fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
                <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
                <Circle cx="8"  cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
                <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
              </Svg>
            </Animated.View>
            </Animated.View>
          </View>

          <Text style={styles.cycleTitle}>{t.celebration.cycleComplete.replace('{n}', String(cycleNumber))}</Text>
          <Text style={styles.congrats}>{t.celebration.felicitations}</Text>
        </Animated.View>

        {/* Section 2 : Carte points */}
        <Animated.View style={fadeStyle(fade2)}>
          <View style={styles.card}>
            {/* Total */}
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.cardLabel}>{t.celebration.pointsGagnes}</Text>
              <Animated.View style={{ opacity: shimmerOpacity }}>
                <Text style={styles.totalPts}>{displayPoints}</Text>
              </Animated.View>
              <Text style={styles.totalSub}>{t.celebration.surCentPossibles}</Text>
            </View>

            <View style={styles.cardSep} />

            {/* Detail etapes */}
            <View style={{ gap: 3 }}>
              {STEPS_CONFIG.map((step, index) => {
                const badgeAnims = [b0, b1, b2, b3, b4, b5, b6];
                const bAnim = badgeAnims[index];
                return (
                  <Animated.View key={step.key} style={[styles.stepRow, {
                    opacity: bAnim,
                    transform: [{ translateY: bAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                  }]}>
                    <Text style={styles.stepLabel}>{step.label}</Text>
                    {(earnedPoints[step.key] ?? 0) > 0 ? (
                      <View style={styles.badgePurple}>
                        <Text style={styles.badgePurpleText}>+{step.pts} pts</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeGrey}>
                        <Text style={styles.badgeGreyText}>{t.celebration.passee}</Text>
                      </View>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Section 3 : Bas de page */}
        <Animated.View style={[styles.bottom, fadeStyle(fade3)]}>
          <View style={styles.nextCycleBadge}>
            <Text style={styles.nextCycleText}>{t.celebration.prochainCycle}</Text>
          </View>
          <Pressable style={styles.homeBtn} onPress={() => router.replace('/(app)/home' as any)}>
            <Svg width={11} height={11} viewBox="0 0 16 16">
              <Path d="M3 8h10M9 4l4 4-4 4" stroke="#F0EAE0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.homeBtnText}>{t.celebration.retourAccueil}</Text>
          </Pressable>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EAE0',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    zIndex: 1,
  },

  // Oeil
  eyeSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  eyeContainer: {
    width: 160,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderWidth: 0.5,
  },
  eyeWrapper: {
    zIndex: 1,
  },
  cycleTitle: {
    fontFamily: 'serif',
    fontSize: 26,
    fontStyle: 'italic',
    color: '#2A2520',
    textAlign: 'center',
    lineHeight: 32,
  },
  congrats: {
    fontFamily: 'Jost',
    fontSize: 13,
    fontWeight: '300',
    color: '#7A7068',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  // Carte
  card: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 14,
    gap: 7,
  },
  cardLabel: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: '#7A7068',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  totalPts: {
    fontFamily: 'serif',
    fontSize: 44,
    fontStyle: 'italic',
    color: '#6B3FA0',
    lineHeight: 48,
    textAlign: 'center',
  },
  totalSub: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: '#9B72C8',
  },
  cardSep: {
    width: '100%',
    height: 0.5,
    backgroundColor: '#E0D4CC',
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: '#7A7068',
  },
  badgePurple: {
    backgroundColor: '#DDD0F8',
    borderRadius: 20,
    paddingVertical: 1,
    paddingHorizontal: 8,
  },
  badgePurpleText: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B3FA0',
  },
  badgeGrey: {
    backgroundColor: '#F0EAE0',
    borderRadius: 20,
    paddingVertical: 1,
    paddingHorizontal: 8,
  },
  badgeGreyText: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#A09088',
  },

  // Bas
  bottom: {
    gap: 8,
    marginBottom: 80,
  },
  nextCycleBadge: {
    backgroundColor: 'rgba(221,208,248,0.3)',
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  nextCycleText: {
    fontFamily: 'serif',
    fontSize: 16,
    fontStyle: 'italic',
    color: '#6B3FA0',
    textAlign: 'center',
  },
  homeBtn: {
    backgroundColor: '#3A3530',
    borderRadius: 999,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  homeBtnText: {
    fontFamily: 'Jost',
    color: '#F0EAE0',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
