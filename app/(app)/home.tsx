import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, Line, Path, Rect } from 'react-native-svg';
import CongratulationsToast from '../../components/ui/CongratulationsToast';
import { getCycleColors, getCycleContent } from '../../hooks/useCycleContent';
import { DEBUG_SKIP_PAYWALL, FREE_CYCLES } from '../../services/config';

type StepStatus = {
  opening: boolean;
  affirmation: boolean;
  action_easy: boolean;
  action_hard: boolean;
  visualisation: boolean;
  journal: boolean;
  vision_board: boolean;
};

const INITIAL_STEP_STATUS: StepStatus = {
  opening: false,
  affirmation: false,
  action_easy: false,
  action_hard: false,
  visualisation: false,
  journal: false,
  vision_board: false,
};

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
    setToast(toastMilestone.replace('{n}', String(newK * 1000)));
    return;
  }
  const oldLevel = getLevel(oldTotal);
  const newLevel = getLevel(newTotal);
  if (oldLevel !== newLevel) {
    setToast(toastNewLevel.replace('{level}', newLevel));
  }
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { lang } = useLanguage();
  const [userName, setUserName] = useState('');
  const [cycleNumber, setCycleNumber] = useState(1);
  const [cycleColors, setCycleColors] = useState({ orb1: '#C4A8D4', orb2: '#B8D4B0' });
  const eyeAnim = useRef(new Animated.Value(0)).current;
  const fadeUp1 = useRef(new Animated.Value(0)).current;
  const fadeUp2 = useRef(new Animated.Value(0)).current;
  const fadeUp3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (DEBUG_SKIP_PAYWALL) {
      console.warn('[DEBUG] paywall bypass actif — DEBUG_SKIP_PAYWALL=true dans services/config.ts');
    }
  }, []);

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
  const [content, setContent] = useState<ReturnType<typeof getCycleContent>>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [cycleCompleted, setCycleCompleted] = useState(false);
  const [stepStatus, setStepStatus] = useState<StepStatus>(INITIAL_STEP_STATUS);
  const [congratToast, setCongratToast] = useState('');

  const loadHome = useCallback(async () => {
    try {
    // Prénom
    const name = await AsyncStorage.getItem('user_name') || '';
    setUserName(name);

    // Initialisation si les clés cycle sont absentes
    let cycle = parseInt(await AsyncStorage.getItem('current_cycle') || '0');
    if (cycle === 0) {
      cycle = 1;
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      await AsyncStorage.multiSet([
        ['current_cycle', '1'],
        ['current_theme', '1'],
        ['cycle_completed', 'false'],
        ['cycle_points', '0'],
        ['points_total', '0'],
        ['next_cycle_time', String(midnight.getTime())],
        ['cycle_step_status', JSON.stringify(INITIAL_STEP_STATUS)],
      ]);
    }

    // Vérifier si minuit est passé et le cycle était terminé → avancer
    const completedRaw = await AsyncStorage.getItem('cycle_completed');
    const nextCycleTime = parseInt(await AsyncStorage.getItem('next_cycle_time') || '0');
    if (completedRaw === 'true' && Date.now() >= nextCycleTime) {
      const newCycle = Math.min(cycle + 1, 365);
      const newTheme = ((newCycle - 1) % 7) + 1;
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      await AsyncStorage.multiSet([
        ['current_cycle', String(newCycle)],
        ['current_theme', String(newTheme)],
        ['cycle_completed', 'false'],
        ['cycle_points', '0'],
        ['next_cycle_time', String(midnight.getTime())],
        ['cycle_step_status', JSON.stringify(INITIAL_STEP_STATUS)],
        ['cycle_earned_points', JSON.stringify({ opening: 0, affirmation: 0, action_easy: 0, action_hard: 0, visualisation: 0, journal: 0, vision_board: 0 })],
      ]);
      cycle = newCycle;
    }

    // Gate freemium (modèle définitif) : au-delà de l'essai gratuit (7 cycles),
    // TOUT utilisateur sans abonnement payant actif est bloqué vers le paywall.
    // subscription_active='true' est posé par le webhook Paddle → Firestore →
    // useSubscriptionSync → AsyncStorage. On ne dépend PLUS de selected_plan :
    // un anonyme d'essai (ou tout compte sans abonnement) est paywallé au cycle 8.
    // DEBUG_SKIP_PAYWALL court-circuite tout pour les tests Expo Go.
    if (!DEBUG_SKIP_PAYWALL) {
      const subActive = (await AsyncStorage.getItem('subscription_active')) === 'true';
      if (cycle > FREE_CYCLES && !subActive) {
        router.replace('/(app)/pricing-upgrade' as any);
        return;
      }
    }

    setCycleNumber(cycle);
    setContent(getCycleContent(cycle, lang));
    setCycleColors(getCycleColors(cycle, lang));

    // 1. Lire le statut des étapes
    const statusRaw = await AsyncStorage.getItem('cycle_step_status');
    const status: StepStatus = statusRaw ? JSON.parse(statusRaw) : { ...INITIAL_STEP_STATUS };

    // 2. Créditer +10 pts d'ouverture immédiatement (avant affichage)
    if (!status.opening) {
      status.opening = true;
      await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

      const oldTotal = parseInt(await AsyncStorage.getItem('points_total') || '0');
      const newTotal = oldTotal + 10;
      await AsyncStorage.setItem('points_total', String(newTotal));

      const cyclePoints = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
      await AsyncStorage.setItem('cycle_points', String(cyclePoints + 10));

      const earnedRaw = await AsyncStorage.getItem('cycle_earned_points');
      const earned = earnedRaw ? JSON.parse(earnedRaw) : {};
      earned.opening = 10;
      await AsyncStorage.setItem('cycle_earned_points', JSON.stringify(earned));

      checkMilestones(oldTotal, newTotal, setCongratToast, t.niveaux, t.home.toastMilestone, t.home.toastNewLevel);
    }

    setStepStatus(status);

    // Cycle complété ?
    const freshCompleted = await AsyncStorage.getItem('cycle_completed');

    // Auto-détecter si toutes les étapes sont faites sans que cycle_completed soit marqué
    const allStepsDone =
      status.opening && status.affirmation &&
      status.action_easy && status.action_hard &&
      status.visualisation && status.journal && status.vision_board;

    if (allStepsDone && freshCompleted !== 'true') {
      await AsyncStorage.setItem('cycle_completed', 'true');
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      await AsyncStorage.setItem('next_cycle_time', String(midnight.getTime()));
      setCycleCompleted(true);
    } else {
      setCycleCompleted(freshCompleted === 'true');
    }

    // 3. Lire points_total APRÈS créditation
    const total = parseInt(await AsyncStorage.getItem('points_total') || '0');
    const percent = (total / 36500) * 100;
    setProgressPercent(percent);

    if (percent < 25) setLevelIndex(0);
    else if (percent < 50) setLevelIndex(1);
    else if (percent < 75) setLevelIndex(2);
    else setLevelIndex(3);
    } catch {
      // Storage indisponible — afficher les valeurs par défaut
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome])
  );

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  function handleMainBtn() {
    if (cycleCompleted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Opening est déjà crédité dans loadHome — naviguer vers la prochaine étape
    if (!stepStatus.affirmation) {
      router.push('/(app)/affirmation' as any);
    } else if (!stepStatus.action_easy || !stepStatus.action_hard) {
      router.push('/(app)/action' as any);
    } else if (!stepStatus.visualisation) {
      router.push('/(app)/visualisation' as any);
    } else if (!stepStatus.journal) {
      router.push('/(app)/journal?fromCycle=true' as any);
    } else if (!stepStatus.vision_board) {
      router.push('/(app)/vision-board?fromCycle=true' as any);
    }
  }

  async function handleNextCycleDebug() {
    const currentCycle = parseInt(await AsyncStorage.getItem('current_cycle') || '1');
    const newCycle = Math.min(currentCycle + 1, 365);
    const newTheme = ((newCycle - 1) % 7) + 1;
    await AsyncStorage.setItem('current_cycle', String(newCycle));
    await AsyncStorage.setItem('current_theme', String(newTheme));
    await AsyncStorage.setItem('cycle_completed', 'false');
    await AsyncStorage.setItem('cycle_points', '0');
    await AsyncStorage.setItem('cycle_earned_points', JSON.stringify({
      opening: 0, affirmation: 0, action_easy: 0, action_hard: 0,
      visualisation: 0, journal: 0, vision_board: 0,
    }));
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify({
      opening: false, affirmation: false, action_easy: false, action_hard: false,
      visualisation: false, journal: false, vision_board: false,
    }));
    await AsyncStorage.removeItem('next_cycle_time');
    await loadHome();
  }

  const LEVELS = [t.niveaux.eveil, t.niveaux.ancrage, t.niveaux.expansion, t.niveaux.manifestation];
  const currentLevelIndex = levelIndex;

  return (
    <View style={styles.container}>
      {congratToast ? <CongratulationsToast message={congratToast} onHide={() => setCongratToast('')} /> : null}
      {/* Bouton reset temporaire */}
      <Pressable
        onPress={async () => {
          await AsyncStorage.clear();
          router.replace('/' as any);
        }}
        style={{ position: 'absolute', top: 48, right: 16, zIndex: 10 }}
      >
        <Text style={{ fontSize: 10, color: '#C4A8D4' }}>reset</Text>
      </Pressable>
      {/* Bouton debug cycle suivant — à supprimer avant publication */}
      <Pressable
        onPress={handleNextCycleDebug}
        style={{ position: 'absolute', top: 48, right: 60, zIndex: 10 }}
      >
        <Text style={{ fontSize: 10, color: '#C4A8D4' }}>⏭ cycle suivant</Text>
      </Pressable>

      {/* Orbes */}
      <View style={[styles.orb, { width: 150, height: 150, backgroundColor: cycleColors.orb1, top: -40, right: -40 }]} />
      <View style={[styles.orb, { width: 90, height: 90, backgroundColor: cycleColors.orb2, top: 160, left: -28 }]} />
      <View style={[styles.orb, { width: 60, height: 60, backgroundColor: '#E8C890', top: 310, right: -15 }]} />

      {/* Contenu principal */}
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>

        {/* Œil + Bonjour */}
        <View style={styles.headerBlock}>
          {/* 1. ŒIL +30% : 64×1.3=83, 49×1.3=64 */}
          <Animated.View style={{ transform: [{ scaleY: eyeAnim }], opacity: eyeAnim }}>
            <Svg width={160} height={123} viewBox="0 0 56 44" style={{ overflow: 'visible' }}>
              <Defs>
                <ClipPath id="hc1">
                  <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
                </ClipPath>
              </Defs>
              <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
              <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#hc1)" />
              <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#hc1)" />
              <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#hc1)" />
              <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#hc1)" />
              <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#hc1)" />
              <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#hc1)" />
              <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#hc1)" />
              <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
              <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
              <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
              <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            </Svg>
          </Animated.View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.bonjour}>{t.home.bienvenue}</Text>
            <Text style={styles.prenom} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{userName || t.home.defautPrenom}</Text>
          </View>
        </View>

        {/* Phrase violette */}
        <View style={styles.quoteBlock}>
          <Text style={styles.quoteText}>{t.home.citation}</Text>
        </View>

        {/* 3. JAUGE PROGRESSION */}
        <Animated.View style={[styles.gaugeBlock, { opacity: fadeUp1, transform: [{ translateY: fadeUp1.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          {/* Ligne 1 : PROGRESSION + badge niveau */}
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeLabel}>{t.home.gaugeLabel} {cycleNumber}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>✦ {LEVELS[levelIndex]}</Text>
            </View>
          </View>
          {/* Thème du cycle */}
          {content?.theme ? (
            <View style={{ alignSelf: 'flex-start', backgroundColor: cycleColors.orb1 + '59', borderRadius: 20, paddingVertical: 2, paddingHorizontal: 10, marginTop: 3 }}>
              <Text style={{ fontFamily: 'Jost', fontSize: 12, fontWeight: '500', color: content.couleurPrincipale || '#6B3FA0' }}>
                {content.theme}
              </Text>
            </View>
          ) : null}

          {/* Ligne 2 : 365 jours aligné à droite */}
          <View style={styles.gaugeDaysRow}>
            <Text style={styles.gaugeDays}>{t.home.gaugeCycles}</Text>
          </View>
          {/* Barre */}
          <View style={styles.gaugeBar}>
            <View style={[styles.gaugeFill, { width: `${Math.max(progressPercent, 1.5)}%` }]}>
              <View style={styles.gaugeShine} />
            </View>
          </View>
          {/* 4 niveaux */}
          <View style={styles.levelsRow}>
            {LEVELS.map((lv, i) => {
              const isActive = i === currentLevelIndex;
              const isPast = i < currentLevelIndex;
              const isOff = !isActive && !isPast;
              return (
                <View key={lv} style={styles.levelItem}>
                  <View style={[
                    styles.levelDot,
                    isOff ? styles.levelDotOff : styles.levelDotOn,
                    isActive && i === 1 ? styles.levelDotFloraison : null,
                  ]} />
                  <Text style={[
                    styles.levelName,
                    isActive ? styles.levelNameActive : isPast ? styles.levelNamePast : styles.levelNameOff,
                  ]}>
                    {lv}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* BOUTON PRINCIPAL — 3 états */}
        <Animated.View style={[styles.mainBtnWrap, { opacity: fadeUp2, transform: [{ translateY: fadeUp2.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          {cycleCompleted && cycleNumber >= 365 ? (
            <View style={[styles.mainBtn, { opacity: 0.5 }]}>
              <Text style={styles.mainBtnText}>{t.home.programmeTermine}</Text>
            </View>
          ) : cycleCompleted ? (
            <View style={[styles.mainBtn, { opacity: 0.5 }]}>
              <Text style={styles.mainBtnText}>{t.home.nextCycle}</Text>
            </View>
          ) : (
            <Pressable style={styles.mainBtn} onPress={handleMainBtn}>
              <Svg width={11} height={11} viewBox="0 0 16 16" fill="none">
                <Path d="M3 8h10M9 4l4 4-4 4" stroke="#F0EAE0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.mainBtnText}>
                {!stepStatus.opening ? t.home.commencerCycle : t.home.continuerCycle}
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Journal + Vision Board */}
        <Animated.View style={[styles.cardsRow, { opacity: fadeUp3, transform: [{ translateY: fadeUp3.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <Pressable style={styles.card} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/journal' as any); }}>
            <View style={[styles.cardIcon, { backgroundColor: '#DDD0F8' }]}>
              <Svg width={12} height={12} viewBox="0 0 20 20" fill="none">
                <Rect x="3" y="2" width="14" height="16" rx="2" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
                <Path d="M6 6h8M6 9.5h8M6 13h5" stroke="#6B3FA0" strokeWidth="1.1" strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={[styles.cardTitle, { color: '#6B3FA0' }]}>{t.home.cards.journal}</Text>
            <View style={[styles.cardBadge, { backgroundColor: '#DDD0F8' }]}>
              <Text style={[styles.cardBadgeText, { color: '#6B3FA0' }]}>+15 pts/cycle</Text>
            </View>
          </Pressable>

          <Pressable style={styles.card} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/vision-board' as any); }}>
            <View style={[styles.cardIcon, { backgroundColor: '#FDE8B0' }]}>
              <Svg width={12} height={12} viewBox="0 0 20 20" fill="none">
                <Rect x="2" y="2" width="7" height="7" rx="1.5" fill="#E8C860" opacity="0.8" />
                <Rect x="11" y="2" width="7" height="7" rx="1.5" fill="#C4A8D4" opacity="0.8" />
                <Rect x="2" y="11" width="7" height="7" rx="1.5" fill="#B8D4B0" opacity="0.8" />
                <Rect x="11" y="11" width="7" height="7" rx="1.5" fill="#9B72C8" opacity="0.8" />
              </Svg>
            </View>
            <Text style={[styles.cardTitle, { color: '#9A6A00' }]}>{t.home.cards.visionBoard}</Text>
            <View style={[styles.cardBadge, { backgroundColor: '#FDE8B0' }]}>
              <Text style={[styles.cardBadgeText, { color: '#9A6A00' }]}>+5 pts/cycle</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Puces fonctionnalités — informatif uniquement */}
        <View style={styles.featBlock} pointerEvents="none">
          <View style={styles.featRow}>
            <View style={[styles.featIcon, { backgroundColor: '#FDE8B0' }]}>
              <Svg width={7} height={7} viewBox="0 0 14 14" fill="none">
                <Circle cx="7" cy="7" r="3" stroke="#C89A10" strokeWidth="1" fill="none" />
                <Line x1="7" y1="1" x2="7" y2="3" stroke="#C89A10" strokeWidth="1" strokeLinecap="round" />
                <Line x1="7" y1="11" x2="7" y2="13" stroke="#C89A10" strokeWidth="1" strokeLinecap="round" />
                <Line x1="1" y1="7" x2="3" y2="7" stroke="#C89A10" strokeWidth="1" strokeLinecap="round" />
                <Line x1="11" y1="7" x2="13" y2="7" stroke="#C89A10" strokeWidth="1" strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={[styles.featName, { color: '#9A7A10' }]}>{t.home.feats.affirmations}</Text>
            <View style={[styles.featBadge, { backgroundColor: '#FDE8B0' }]}>
              <Text style={[styles.featBadgeText, { color: '#9A6A00' }]}>+15 pts</Text>
            </View>
          </View>

          <View style={styles.featSep} />

          <View style={styles.featRow}>
            <View style={[styles.featIcon, { backgroundColor: '#DDD0F8' }]}>
              <Svg width={7} height={7} viewBox="0 0 14 14" fill="none">
                <Path d="M8 2L4 8h4l-2 4 6-7H8l2-3z" fill="#9B72C8" stroke="#6B3FA0" strokeWidth="0.6" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={[styles.featName, { color: '#6B3FA0' }]}>{t.home.feats.actions}</Text>
            <View style={[styles.featBadge, { backgroundColor: '#DDD0F8' }]}>
              <Text style={[styles.featBadgeText, { color: '#6B3FA0' }]}>+15/25 pts</Text>
            </View>
          </View>

          <View style={styles.featSep} />

          <View style={styles.featRow}>
            <View style={[styles.featIcon, { backgroundColor: '#C4E8F0' }]}>
              <Svg width={7} height={7} viewBox="0 0 14 14" fill="none">
                <Path d="M1 7C2.5 4 4.5 3 7 3s4.5 1 6 4c-1.5 3-3.5 4-6 4S2.5 10 1 7z" fill="#C4E8F0" stroke="#1A6A80" strokeWidth="0.8" />
                <Circle cx="7" cy="7" r="1.8" fill="#1A6A80" opacity="0.8" />
              </Svg>
            </View>
            <Text style={[styles.featName, { color: '#1A6A80' }]}>{t.home.feats.visualisations}</Text>
            <View style={[styles.featBadge, { backgroundColor: '#C4E8F0' }]}>
              <Text style={[styles.featBadgeText, { color: '#1A6A80' }]}>+15 pts</Text>
            </View>
          </View>
        </View>

      </View>

      {/* 5. NAVBAR avec safe area */}
      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace('/(app)/home' as any); }}>
          <Svg width={24} height={24} viewBox="0 0 22 22" fill="none">
            <Path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" fill="#6B3FA0" />
          </Svg>
          <Text style={[styles.navLabel, styles.navLabelActive]}>{t.commun.navbar.accueil}</Text>
          <View style={styles.navDot} />
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/profil' as any); }}>
          <Svg width={24} height={24} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="8" r="4" stroke="#A09088" strokeWidth="1.2" fill="none" />
            <Path d="M3 19c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#A09088" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.navLabel}>{t.commun.navbar.profil}</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/parametres' as any); }}>
          <Svg width={24} height={24} viewBox="0 0 22 22" fill="none">
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
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  // 4. SPACE-BETWEEN pour remplir toute la hauteur
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    zIndex: 1,
  },
  headerBlock: {
    alignItems: 'center',
    gap: 2,
    marginTop: 32,
  },
  bonjour: {
    fontFamily: 'Jost',
    fontSize: 14,
    fontWeight: '300',
    color: '#7A7068',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  prenom: {
    fontFamily: 'serif',
    fontSize: 36,
    fontStyle: 'italic',
    color: '#2A2520',
    lineHeight: 40,
  },
  quoteBlock: {
    alignItems: 'center',
  },
  quoteText: {
    fontFamily: 'serif',
    fontSize: 18,
    fontStyle: 'italic',
    color: '#6B3FA0',
    textAlign: 'center',
    lineHeight: 26,
  },
  // 3. JAUGE
  gaugeBlock: {},
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  gaugeLabel: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: '#7A7068',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  levelBadge: {
    backgroundColor: '#DDD0F8',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelBadgeText: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B3FA0',
  },
  gaugeDaysRow: {
    alignItems: 'flex-end',
    marginBottom: 3,
  },
  gaugeDays: {
    fontFamily: 'serif',
    fontSize: 13,
    fontStyle: 'italic',
    color: '#9A8878',
  },
  gaugeBar: {
    width: '100%',
    height: 16,
    backgroundColor: '#E4DCD4',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#C8BEB0',
    overflow: 'hidden',
    padding: 2,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#6B3FA0',
    position: 'relative',
    overflow: 'hidden',
  },
  gaugeShine: {
    position: 'absolute',
    top: 2,
    left: 5,
    width: '28%',
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  levelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  levelItem: {
    alignItems: 'center',
    gap: 2,
  },
  levelDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  levelDotOn: { backgroundColor: '#6B3FA0' },
  levelDotOff: { backgroundColor: '#C8BEB0' },
  levelDotFloraison: {
    borderWidth: 2,
    borderColor: 'rgba(107,63,160,0.2)',
    width: 7,
    height: 7,
  },
  levelName: {
    fontFamily: 'Jost',
    fontSize: 11,
  },
  levelNameActive: { color: '#2A2520', fontWeight: '500' },
  levelNamePast: { color: '#6B3FA0' },
  levelNameOff: { color: '#B0A898' },
  // 2. BOUTON
  mainBtnWrap: {},
  mainBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#3A3530',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  mainBtnText: {
    color: '#F0EAE0',
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 7,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 3,
  },
  cardIcon: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Jost',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardBadge: {
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  cardBadgeText: {
    fontFamily: 'Jost',
    fontSize: 8,
    fontWeight: '500',
  },
  featBlock: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 0.5,
    borderColor: '#E0D8D0',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 3,
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featIcon: {
    width: 14,
    height: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featName: {
    fontFamily: 'Jost',
    fontSize: 10,
    flex: 1,
  },
  featBadge: {
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  featBadgeText: {
    fontFamily: 'Jost',
    fontSize: 8,
    fontWeight: '500',
  },
  featSep: {
    height: 0.5,
    backgroundColor: '#E0D8D0',
  },
  // 5. NAVBAR
  navbar: {
    backgroundColor: '#F0EAE0',
    borderTopWidth: 0.5,
    borderTopColor: '#D4C4B8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingTop: 8,
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
