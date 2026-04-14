import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, ClipPath, Defs, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StepStatus = {
  opening: boolean;
  affirmation: boolean;
  action_easy: boolean;
  action_hard: boolean;
  visualisation: boolean;
  journal: boolean;
  vision_board: boolean;
};

const THEMES = [
  'Confiance & Identité',
  'Abondance & Prospérité',
  'Amour & Relations',
  'Santé & Vitalité',
  'Carrière & Mission',
  'Créativité & Expression',
  'Gratitude & Paix',
];

export default function Profil() {
  const insets = useSafeAreaInsets();

  const [userName, setUserName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [themeName, setThemeName] = useState('');
  const [level, setLevel] = useState('Éveillé');
  const [progressPercent, setProgressPercent] = useState(0);
  const [cyclePoints, setCyclePoints] = useState(0);
  const [pointsTotal, setPointsTotal] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [bestCycle, setBestCycle] = useState(0);
  const [avgPoints, setAvgPoints] = useState(0);
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    opening: false, affirmation: false, action_easy: false, action_hard: false,
    visualisation: false, journal: false, vision_board: false,
  });

  const breathe = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const name = await AsyncStorage.getItem('user_name') || '';
        setUserName(name);

        const photo = await AsyncStorage.getItem('profile_photo');
        if (photo) setProfilePhoto(photo);

        const cycle = parseInt(await AsyncStorage.getItem('current_cycle') || '1');
        setCycleNumber(cycle);

        const theme = parseInt(await AsyncStorage.getItem('current_theme') || '1');
        setThemeName(THEMES[theme - 1]);

        const total = parseInt(await AsyncStorage.getItem('points_total') || '0');
        setPointsTotal(total);
        const pct = (total / 36500) * 100;
        setProgressPercent(pct);

        if (pct < 25) setLevel('Éveillé');
        else if (pct < 50) setLevel('Floraison');
        else if (pct < 75) setLevel('Rayonnant');
        else setLevel('Manifestant');

        const cpts = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
        setCyclePoints(cpts);

        const statusRaw = await AsyncStorage.getItem('cycle_step_status');
        if (statusRaw) setStepStatus(JSON.parse(statusRaw));

        const completed = Math.max(cycle - 1, 0);
        setCyclesCompleted(completed);

        const best = parseInt(await AsyncStorage.getItem('best_cycle_points') || '0');
        setBestCycle(best);

        const avg = completed > 0 ? Math.round(total / completed) : 0;
        setAvgPoints(avg);
      }
      load();
    }, [])
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 0.93, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,    duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const levelPct   = progressPercent / 100;
  const annualBarW = `${Math.max(0.5, (cycleNumber / 365) * 100)}%`;
  const cycleBarW  = `${Math.min(100, cyclePoints)}%`;
  const dotCol     = (on: boolean) => on ? '#C8E8C0' : '#E4DCD4';
  const textCol    = (on: boolean) => on ? '#3A6A20' : '#B0A898';
  const actionsOn  = stepStatus.action_easy && stepStatus.action_hard;

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePhoto(uri);
      await AsyncStorage.setItem('profile_photo', uri);
    }
  }

  function handleEditName() {
    router.push('/(app)/name?edit=true' as any);
  }

  async function handleReset() {
    Alert.alert(
      'Recommencer depuis le début ?',
      'Cette action est irréversible.\n\nTous tes points, cycles, entrées de journal et photos seront définitivement effacés.\nTu recommenceras au Cycle 1.\n\nTon abonnement reste actif.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            const keys = [
              'points_total', 'current_cycle', 'current_theme',
              'cycle_step_status', 'cycle_points', 'cycle_earned_points',
              'cycle_completed', 'next_cycle_time', 'best_cycle_points',
              'profile_photo', 'vision_board_photos', 'user_name',
            ];
            const allKeys = await AsyncStorage.getAllKeys();
            const journalKeys = allKeys.filter(k => k.startsWith('journal_cycle_'));
            await AsyncStorage.multiRemove([...keys, ...journalKeys]);
            router.replace('/(app)/name' as any);
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Orbes */}
      <View style={[styles.orb, { width: 140, height: 140, backgroundColor: '#DDD0F8', top: -35, right: -35 }]} />
      <View style={[styles.orb, { width: 75,  height: 75,  backgroundColor: '#C4E8F0', bottom: 55, left: -18 }]} />

      {/* Contenu */}
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>

        {/* 1. Œil + titre */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scaleY: breathe }] }}>
            <Svg width={130} height={100} viewBox="0 0 56 44" style={{ overflow: 'visible' }}>
              <Defs>
                <ClipPath id="pc1">
                  <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
                </ClipPath>
              </Defs>
              <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
              <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8"  clipPath="url(#pc1)" />
              <Circle cx="28" cy="22" r="8"    fill="#9B72C8"  opacity="0.75" clipPath="url(#pc1)" />
              <Circle cx="28" cy="22" r="5.8"  fill="#6B3FA0"  opacity="0.9"  clipPath="url(#pc1)" />
              <Circle cx="28" cy="22" r="3"    fill="#1A0E30"  clipPath="url(#pc1)" />
              <Circle cx="30.5" cy="19.5" r="1.3" fill="white"   opacity="0.9" clipPath="url(#pc1)" />
              <Circle cx="28"   cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#pc1)" />
              <Circle cx="28"   cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#pc1)" />
              <Path d="M8 22 Q28 6 48 22"  fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
              <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
              <Circle cx="8"  cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
              <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            </Svg>
          </Animated.View>
          <Text style={[styles.title, { marginTop: -18 }]}>Mon Profil</Text>
        </View>

        {/* 2. Carte identité */}
        <View style={[styles.card, { paddingVertical: 16, paddingHorizontal: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <Pressable onPress={handlePickPhoto} style={{ position: 'relative' }}>
              <View style={{
                width: 76, height: 76,
                borderRadius: 38,
                backgroundColor: '#DDD0F8',
                borderWidth: 2,
                borderColor: '#C4A8D4',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={{ width: 76, height: 76 }} />
                ) : (
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="8" r="4" stroke="#6B3FA0" strokeWidth="1.2" />
                    <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" />
                  </Svg>
                )}
              </View>
              <View style={{
                position: 'absolute',
                bottom: -3, right: -3,
                width: 26, height: 26,
                borderRadius: 13,
                backgroundColor: '#3A3530',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#F0EAE0',
              }}>
                <Svg width={13} height={13} viewBox="0 0 12 12" fill="none">
                  <Path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </Svg>
              </View>
            </Pressable>
            <View style={{ gap: 3 }}>
              <Text style={[styles.userName, { fontSize: 22, color: '#C89A30' }]}>{userName || 'Toi'}</Text>
              <Text style={[styles.cycleTheme, { fontSize: 13 }]}>Cycle {cycleNumber} · Th&#232;me {themeName.split(' &')[0]}</Text>
              <View style={styles.levelBadge}>
                <View style={styles.levelDot} />
                <Text style={[styles.levelText, { fontSize: 13 }]}>&#10086; {level}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Progression annuelle */}
        <View style={styles.card}>
          <View style={styles.barHeader}>
            <Text style={[styles.barLabel, { color: '#C89A30' }]}>Progression</Text>
            <Text style={styles.barValue}>Cycle {cycleNumber} / 365</Text>
          </View>
          <View style={styles.barTrackLarge}>
            <View style={[styles.barFillLarge, { width: annualBarW as any }]}>
              <View style={styles.barShineLarge} />
            </View>
          </View>
          <View style={styles.levelsRow}>
            {(['Éveillé', 'Floraison', 'Rayonnant', 'Manifestant'] as const).map((lbl, i) => {
              const thresholds = [0, 0.25, 0.5, 0.75];
              const active = levelPct >= thresholds[i];
              return (
                <View key={lbl} style={styles.levelItem}>
                  <View style={[styles.levelDotSmall, { backgroundColor: active ? '#6B3FA0' : '#C8BEB0' }]} />
                  <Text style={[styles.levelLbl, { color: active ? '#6B3FA0' : '#B0A898' }]}>{lbl}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 4. Cycle en cours */}
        <View style={styles.card}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Cycle en cours</Text>
            <Text style={styles.barValue}>{cyclePoints} / 100 pts</Text>
          </View>
          <View style={styles.barTrackSmall}>
            <View style={[styles.barFillSmall, { width: cycleBarW as any }]}>
              <View style={styles.barShineSmall} />
            </View>
          </View>
          <View style={styles.stepsRow}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: dotCol(stepStatus.opening) }]} />
              <Text style={[styles.stepText, { color: textCol(stepStatus.opening) }]}>
                Ouverture{stepStatus.opening ? ' ✓' : ''}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: dotCol(stepStatus.affirmation) }]} />
              <Text style={[styles.stepText, { color: textCol(stepStatus.affirmation) }]}>
                Affirmation{stepStatus.affirmation ? ' ✓' : ''}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: dotCol(actionsOn) }]} />
              <Text style={[styles.stepText, { color: textCol(actionsOn) }]}>
                Actions{actionsOn ? ' ✓' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Grille 4 stats */}
        <View style={{ gap: 5, flexShrink: 0 }}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <View style={[styles.statCell, { flex: 1 }]}>
              <Text style={styles.statLabel}>Total points</Text>
              <Text style={[styles.statValue, { color: '#C89A30' }]}>{pointsTotal.toLocaleString('fr-FR')}</Text>
              <Text style={styles.statSub}>/ 36 500 pts possibles</Text>
            </View>
            <View style={[styles.statCell, { flex: 1 }]}>
              <Text style={styles.statLabel}>Cycles compl&#233;t&#233;s</Text>
              <Text style={[styles.statValue, { color: '#C89A30' }]}>{cyclesCompleted}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <View style={[styles.statCell, { flex: 1 }]}>
              <Text style={styles.statLabel}>Meilleur cycle</Text>
              <Text style={styles.statValue}>{bestCycle > 0 ? bestCycle + ' pts' : '—'}</Text>
            </View>
            <View style={[styles.statCell, { flex: 1 }]}>
              <Text style={styles.statLabel}>Moy. par cycle</Text>
              <Text style={styles.statValue}>{cyclesCompleted > 0 ? avgPoints + ' pts' : '—'}</Text>
            </View>
          </View>
        </View>

        {/* 6. Modifier prénom */}
        <Pressable style={styles.actionRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleEditName(); }}>
          <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
            <Path d="M14 2l4 4-10 10H4v-4L14 2z" stroke="#6B3FA0" strokeWidth="1.2" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.actionText}>Modifier mon pr&#233;nom</Text>
          <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
            <Path d="M4 2l4 4-4 4" stroke="#C4A8D4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

        {/* 7. Recommencer */}
        <Pressable style={styles.resetRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleReset(); }}>
          <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
            <Path d="M4 10a6 6 0 1 0 1-3.5" stroke="#2A6A20" strokeWidth="1.3" strokeLinecap="round" />
            <Path d="M4 4v3h3" stroke="#2A6A20" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <View style={{ flex: 1 }}>
            <Text style={styles.resetText}>Recommencer depuis le d&#233;but</Text>
            <Text style={styles.resetSub}>Efface tout · Irr&#233;versible</Text>
          </View>
          <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
            <Path d="M4 2l4 4-4 4" stroke="#A0C890" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

      </View>

      {/* Navbar */}
      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/home' as any); }}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" fill="#A09088" />
          </Svg>
          <Text style={styles.navLabel}>Accueil</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="8" r="4" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
            <Path d="M3 19c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Profil</Text>
          <View style={styles.navDot} />
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/parametres' as any); }}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="11" r="3" stroke="#A09088" strokeWidth="1.2" fill="none" />
            <Path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" stroke="#A09088" strokeWidth="1.2" strokeLinecap="round" />
          </Svg>
          <Text style={styles.navLabel}>Param&#232;tres</Text>
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
    paddingBottom: 6,
    gap: 5,
    zIndex: 1,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 24,
    fontStyle: 'italic',
    color: '#2A2520',
  },

  // Cards
  card: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    borderRadius: 14,
    padding: 8,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DDD0F8',
    borderWidth: 1.5,
    borderColor: '#C4A8D4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  userName: {
    fontFamily: 'serif',
    fontSize: 18,
    fontStyle: 'italic',
    color: '#2A2520',
  },
  cycleTheme: {
    fontFamily: 'Jost',
    fontSize: 10,
    color: '#9A8878',
    marginTop: 1,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DDD0F8',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 20,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  levelDot: {
    width: 3,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#9B72C8',
  },
  levelText: {
    fontFamily: 'Jost',
    fontSize: 10,
    fontWeight: '500',
    color: '#6B3FA0',
  },

  // Progress bars
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  barLabel: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#7A7068',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  barValue: {
    fontFamily: 'Jost',
    fontSize: 11,
    fontWeight: '500',
    color: '#6B3FA0',
  },
  barTrackLarge: {
    width: '100%',
    height: 12,
    backgroundColor: '#E4DCD4',
    borderRadius: 6,
    overflow: 'hidden',
    padding: 2,
    marginBottom: 4,
  },
  barFillLarge: {
    height: '100%',
    backgroundColor: '#6B3FA0',
    borderRadius: 4,
    minWidth: 4,
    overflow: 'hidden',
  },
  barShineLarge: {
    position: 'absolute',
    top: 1,
    left: 3,
    width: '30%',
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  barTrackSmall: {
    width: '100%',
    height: 8,
    backgroundColor: '#E4DCD4',
    borderRadius: 4,
    overflow: 'hidden',
    padding: 1,
  },
  barFillSmall: {
    height: '100%',
    backgroundColor: '#6B3FA0',
    borderRadius: 3,
    minWidth: 2,
    overflow: 'hidden',
  },
  barShineSmall: {
    position: 'absolute',
    top: 1,
    left: 4,
    width: '20%',
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  levelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelItem: {
    alignItems: 'center',
    gap: 1,
  },
  levelDotSmall: {
    width: 4,
    height: 4,
    borderRadius: 99,
  },
  levelLbl: {
    fontFamily: 'Jost',
    fontSize: 9,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stepDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  stepText: {
    fontFamily: 'Jost',
    fontSize: 9,
  },

  // Stats grid
  statCell: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    borderRadius: 12,
    padding: 6,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontFamily: 'Jost',
    fontSize: 9,
    color: '#9A8878',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  statValue: {
    fontFamily: 'serif',
    fontSize: 20,
    fontStyle: 'italic',
    color: '#6B3FA0',
  },
  statSub: {
    fontFamily: 'Jost',
    fontSize: 9,
    color: '#B0A898',
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    borderRadius: 10,
    padding: 7,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  actionText: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B3FA0',
    flex: 1,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(235,255,235,0.5)',
    borderWidth: 0.5,
    borderColor: '#A0C890',
    borderRadius: 10,
    padding: 7,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  resetText: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#2A6A20',
  },
  resetSub: {
    fontFamily: 'Jost',
    fontSize: 9,
    color: '#4A8A40',
    marginTop: 1,
  },

  // Navbar
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
