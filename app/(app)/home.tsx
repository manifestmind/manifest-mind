import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, Line, Path, Rect } from 'react-native-svg';

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

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState('');
  const [cycleNumber, setCycleNumber] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [level, setLevel] = useState('Éveillé');
  const [cycleCompleted, setCycleCompleted] = useState(false);
  const [stepStatus, setStepStatus] = useState<StepStatus>(INITIAL_STEP_STATUS);

  useEffect(() => {
    async function loadHome() {
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
        ]);
        cycle = newCycle;
      }

      setCycleNumber(cycle);

      // Statut étapes
      const statusRaw = await AsyncStorage.getItem('cycle_step_status');
      const status: StepStatus = statusRaw ? JSON.parse(statusRaw) : INITIAL_STEP_STATUS;
      setStepStatus(status);

      // Cycle complété ?
      const freshCompleted = await AsyncStorage.getItem('cycle_completed');
      setCycleCompleted(freshCompleted === 'true');

      // Jauge : points_total / 36500
      const pointsTotal = parseInt(await AsyncStorage.getItem('points_total') || '0');
      const percent = (pointsTotal / 36500) * 100;
      setProgressPercent(percent);

      if (percent < 25) setLevel('Éveillé');
      else if (percent < 50) setLevel('Floraison');
      else if (percent < 75) setLevel('Rayonnant');
      else setLevel('Manifestant');
    }
    loadHome();
  }, []);

  async function handleMainBtn() {
    if (cycleCompleted) return;
    if (!stepStatus.opening) {
      // ÉTAT 1 : créditer +10 pts, marquer opening, → affirmation
      const pointsTotal = parseInt(await AsyncStorage.getItem('points_total') || '0');
      const cyclePoints = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
      await AsyncStorage.setItem('points_total', String(pointsTotal + 10));
      await AsyncStorage.setItem('cycle_points', String(cyclePoints + 10));
      const newStatus = { ...stepStatus, opening: true };
      await AsyncStorage.setItem('cycle_step_status', JSON.stringify(newStatus));
      setStepStatus(newStatus);
      router.push('/(app)/affirmation' as any);
    } else {
      // ÉTAT 2 : naviguer vers la prochaine étape non complétée
      if (!stepStatus.affirmation) {
        router.push('/(app)/affirmation' as any);
      } else if (!stepStatus.action_easy || !stepStatus.action_hard) {
        router.push('/(app)/action' as any);
      } else if (!stepStatus.visualisation) {
        router.push('/(app)/visualisation' as any);
      } else if (!stepStatus.journal) {
        router.push('/(app)/journal' as any);
      } else if (!stepStatus.vision_board) {
        router.push('/(app)/vision-board' as any);
      }
    }
  }

  async function skipStep(step: 'journal' | 'vision_board') {
    const newStatus = { ...stepStatus, [step]: true };
    await AsyncStorage.setItem('cycle_step_status', JSON.stringify(newStatus));
    setStepStatus(newStatus);
  }

  const LEVELS = ['Éveillé', 'Floraison', 'Rayonnant', 'Manifestant'];
  const currentLevelIndex = LEVELS.indexOf(level);

  return (
    <View style={styles.container}>
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

      {/* Orbes */}
      <View style={[styles.orb, { width: 150, height: 150, backgroundColor: '#B8D4B0', top: -40, right: -40 }]} />
      <View style={[styles.orb, { width: 90, height: 90, backgroundColor: '#C4A8D4', top: 160, left: -28 }]} />
      <View style={[styles.orb, { width: 60, height: 60, backgroundColor: '#E8C890', top: 310, right: -15 }]} />

      {/* Contenu principal */}
      <View style={styles.content}>

        {/* Œil + Bonjour */}
        <View style={styles.headerBlock}>
          {/* 1. ŒIL +30% : 64×1.3=83, 49×1.3=64 */}
          <Svg width={120} height={92} viewBox="0 0 56 44" style={{ overflow: 'visible' }}>
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
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.bonjour}>Bonjour</Text>
            <Text style={styles.prenom}>{userName || 'toi'}</Text>
          </View>
        </View>

        {/* Phrase violette */}
        <View style={styles.quoteBlock}>
          <Text style={styles.quoteText}>
            Visualise le succès, crois en toi{'\n'}et manifeste tes rêves
          </Text>
        </View>

        {/* 3. JAUGE PROGRESSION */}
        <View style={styles.gaugeBlock}>
          {/* Ligne 1 : PROGRESSION + badge niveau */}
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeLabel}>Progression · Cycle {cycleNumber}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>✦ {level}</Text>
            </View>
          </View>
          {/* Ligne 2 : 365 jours aligné à droite */}
          <View style={styles.gaugeDaysRow}>
            <Text style={styles.gaugeDays}>365 cycles</Text>
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
        </View>

        {/* BOUTON PRINCIPAL — 3 états */}
        <View style={styles.mainBtnWrap}>
          {cycleCompleted ? (
            <View style={[styles.mainBtn, { opacity: 0.5 }]}>
              <Text style={styles.mainBtnText}>✦ Prochain cycle à minuit</Text>
            </View>
          ) : (
            <Pressable style={styles.mainBtn} onPress={handleMainBtn}>
              <Svg width={11} height={11} viewBox="0 0 16 16" fill="none">
                <Path d="M3 8h10M9 4l4 4-4 4" stroke="#F0EAE0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.mainBtnText}>
                {!stepStatus.opening ? 'Commencer mon cycle →' : 'Continuer mon cycle →'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Journal + Vision Board */}
        <View style={styles.cardsRow}>
          <Pressable style={styles.card} onPress={() => router.push('/(app)/journal' as any)}>
            <View style={[styles.cardIcon, { backgroundColor: '#DDD0F8' }]}>
              <Svg width={12} height={12} viewBox="0 0 20 20" fill="none">
                <Rect x="3" y="2" width="14" height="16" rx="2" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
                <Path d="M6 6h8M6 9.5h8M6 13h5" stroke="#6B3FA0" strokeWidth="1.1" strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={[styles.cardTitle, { color: '#6B3FA0' }]}>Journal</Text>
            <View style={[styles.cardBadge, { backgroundColor: '#DDD0F8' }]}>
              <Text style={[styles.cardBadgeText, { color: '#6B3FA0' }]}>+15 pts/cycle</Text>
            </View>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push('/(app)/vision-board' as any)}>
            <View style={[styles.cardIcon, { backgroundColor: '#FDE8B0' }]}>
              <Svg width={12} height={12} viewBox="0 0 20 20" fill="none">
                <Rect x="2" y="2" width="7" height="7" rx="1.5" fill="#E8C860" opacity="0.8" />
                <Rect x="11" y="2" width="7" height="7" rx="1.5" fill="#C4A8D4" opacity="0.8" />
                <Rect x="2" y="11" width="7" height="7" rx="1.5" fill="#B8D4B0" opacity="0.8" />
                <Rect x="11" y="11" width="7" height="7" rx="1.5" fill="#9B72C8" opacity="0.8" />
              </Svg>
            </View>
            <Text style={[styles.cardTitle, { color: '#9A6A00' }]}>Vision Board</Text>
            <View style={[styles.cardBadge, { backgroundColor: '#FDE8B0' }]}>
              <Text style={[styles.cardBadgeText, { color: '#9A6A00' }]}>+5 pts/cycle</Text>
            </View>
          </Pressable>
        </View>

        {/* Liens Passer — alignés sous les cartes */}
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <Pressable style={{ flex: 1 }} onPress={() => skipStep('journal')}>
            <Text style={styles.skipLink}>Passer cette étape sans points</Text>
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => skipStep('vision_board')}>
            <Text style={styles.skipLink}>Passer cette étape sans points</Text>
          </Pressable>
        </View>

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
            <Text style={[styles.featName, { color: '#9A7A10' }]}>Affirmations</Text>
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
            <Text style={[styles.featName, { color: '#6B3FA0' }]}>Actions</Text>
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
            <Text style={[styles.featName, { color: '#1A6A80' }]}>Visualisations</Text>
            <View style={[styles.featBadge, { backgroundColor: '#C4E8F0' }]}>
              <Text style={[styles.featBadgeText, { color: '#1A6A80' }]}>+15 pts</Text>
            </View>
          </View>
        </View>

      </View>

      {/* 5. NAVBAR avec safe area */}
      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.navItem} onPress={() => router.replace('/(app)/home' as any)}>
          <Svg width={24} height={24} viewBox="0 0 22 22" fill="none">
            <Path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" fill="#6B3FA0" />
          </Svg>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Accueil</Text>
          <View style={styles.navDot} />
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push('/(app)/profil' as any)}>
          <Svg width={24} height={24} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="8" r="4" stroke="#A09088" strokeWidth="1.2" fill="none" />
            <Path d="M3 19c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#A09088" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.navLabel}>Profil</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push('/(app)/parametres' as any)}>
          <Svg width={24} height={24} viewBox="0 0 22 22" fill="none">
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
    paddingTop: 12,
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
  skipLink: {
    fontSize: 11,
    color: '#A09088',
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontFamily: 'Jost',
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
