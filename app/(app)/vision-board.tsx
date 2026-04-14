import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PointsToast from '../../components/ui/PointsToast';
import CongratulationsToast from '../../components/ui/CongratulationsToast';
import { getCycleColors } from '../../hooks/useCycleContent';

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

export default function VisionBoard() {
  const insets = useSafeAreaInsets();
  const { fromCycle } = useLocalSearchParams();
  const fadeUp1 = useRef(new Animated.Value(0)).current;
  const fadeUp2 = useRef(new Animated.Value(0)).current;
  const fadeUp3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t1 = setTimeout(() => {
      Animated.timing(fadeUp1, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 200);
    const t2 = setTimeout(() => {
      Animated.timing(fadeUp2, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 400);
    const t3 = setTimeout(() => {
      Animated.timing(fadeUp3, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const [photos, setPhotos] = useState<{ [key: string]: string }>({});
  const [cycleColors, setCycleColors] = useState({ orb1: '#C4A8D4', orb2: '#B8D4B0' });
  const [toast, setToast] = useState('');
  const [congratToast, setCongratToast] = useState('');
  const [showFinishBtn, setShowFinishBtn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const cycle = parseInt(await AsyncStorage.getItem('current_cycle') || '1');
        setCycleColors(getCycleColors(cycle));

        const savedPhotos = await AsyncStorage.getItem('vision_board_photos');
        if (savedPhotos) setPhotos(JSON.parse(savedPhotos));

        const statusRaw = await AsyncStorage.getItem('cycle_step_status');
        let status: Record<string, boolean> = {};
        if (statusRaw) {
          status = JSON.parse(statusRaw);
          if (!status.vision_board) {
            setToast('✦ +5 pts · Vision Board ouvert');

            status.vision_board = true;
            await AsyncStorage.setItem('cycle_step_status', JSON.stringify(status));

            const cyclePoints = parseInt(await AsyncStorage.getItem('cycle_points') || '0');
            await AsyncStorage.setItem('cycle_points', String(cyclePoints + 5));

            const pointsTotal = parseInt(await AsyncStorage.getItem('points_total') || '0');
            await AsyncStorage.setItem('points_total', String(pointsTotal + 5));
            checkMilestones(pointsTotal, pointsTotal + 5, setCongratToast);

            const earnedRaw = await AsyncStorage.getItem('cycle_earned_points');
            const earned = earnedRaw ? JSON.parse(earnedRaw) : {};
            earned.vision_board = 5;
            await AsyncStorage.setItem('cycle_earned_points', JSON.stringify(earned));
          }
        }

        const route = getNextStepRoute(status);
        if (route === 'completed') {
          setShowFinishBtn(true);
        } else if (fromCycle === 'true') {
          router.push(route as any);
        }
      }
      load();
    }, [])
  );

  function getNextStepRoute(status: Record<string, boolean>): string {
    if (!status.affirmation) return '/(app)/affirmation';
    if (!status.action_easy || !status.action_hard) return '/(app)/action';
    if (!status.visualisation) return '/(app)/visualisation';
    if (!status.journal) return '/(app)/journal';
    if (!status.vision_board) return '/(app)/vision-board';
    return 'completed';
  }

  async function handlePickPhoto(category: string) {
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
      const updatedPhotos = { ...photos, [category]: uri };
      setPhotos(updatedPhotos);
      await AsyncStorage.setItem('vision_board_photos', JSON.stringify(updatedPhotos));
    }
  }

  async function handleFinishCycle() {
    router.replace('/(app)/celebration' as any);
  }

  return (
    <View style={styles.container}>
      {toast ? <PointsToast message={toast} onHide={() => setToast('')} /> : null}
      {congratToast ? <CongratulationsToast message={congratToast} onHide={() => setCongratToast('')} /> : null}
      {/* Orbes */}
      <View style={[styles.orb, { width: 140, height: 140, backgroundColor: cycleColors.orb1, top: -35, right: -35 }]} />
      <View style={[styles.orb, { width: 85, height: 85, backgroundColor: cycleColors.orb2, bottom: 55, left: -22 }]} />

      {/* Contenu */}
      <View style={styles.content}>

        {/* Titre + Badge */}
        <Animated.View style={[styles.header, { opacity: fadeUp1, transform: [{ translateY: fadeUp1.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Vision Board</Text>
            <View style={styles.ptsBadge}>
              <Text style={styles.ptsBadgeText}>+5 pts/cycle</Text>
            </View>
          </View>

          <View style={styles.separator} />
        </Animated.View>

        {/* Grille */}
        <Animated.View style={[styles.grid, { opacity: fadeUp2, transform: [{ translateY: fadeUp2.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>

          {/* Rangée 1 */}
          <View style={styles.gridRow}>
            {/* Carrière */}
            <Pressable style={[styles.cell, { backgroundColor: '#DDD0F8', borderColor: '#C4A8D4' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePickPhoto('carriere'); }}>
              {photos['carriere'] && <Image source={{ uri: photos['carriere'] }} style={styles.cellPhoto} />}
              <View style={styles.cellTop}>
                <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
                  <Rect x="2" y="6" width="16" height="11" rx="2" stroke="#6B3FA0" strokeWidth="1.2" fill="none" />
                  <Path d="M7 6V5a3 3 0 016 0v1" stroke="#6B3FA0" strokeWidth="1.2" strokeLinecap="round" />
                </Svg>
                <View style={[styles.addBtn, { borderColor: '#9B72C8' }]}>
                  <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                    <Path d="M6 2v8M2 6h8" stroke="#6B3FA0" strokeWidth="1.4" strokeLinecap="round" />
                  </Svg>
                </View>
              </View>
              <View>
                <Text style={[styles.cellLabel, { color: '#4A2080' }]}>Carrière</Text>
                {!photos['carriere'] && <Text style={[styles.cellSub, { color: '#8B70B8' }]}>+ photo</Text>}
              </View>
            </Pressable>

            {/* Amour */}
            <Pressable style={[styles.cell, { backgroundColor: '#F8D0D8', borderColor: '#E8A8B8' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePickPhoto('amour'); }}>
              {photos['amour'] && <Image source={{ uri: photos['amour'] }} style={styles.cellPhoto} />}
              <View style={styles.cellTop}>
                <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
                  <Path d="M10 16S2 11 2 6a4 4 0 018-1.5A4 4 0 0118 6c0 5-8 10-8 10z" fill="#C84860" opacity="0.7" />
                </Svg>
                <View style={[styles.addBtn, { borderColor: '#C84860' }]}>
                  <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                    <Path d="M6 2v8M2 6h8" stroke="#C84860" strokeWidth="1.4" strokeLinecap="round" />
                  </Svg>
                </View>
              </View>
              <View>
                <Text style={[styles.cellLabel, { color: '#8A2840' }]}>Amour</Text>
                {!photos['amour'] && <Text style={[styles.cellSub, { color: '#C08090' }]}>+ photo</Text>}
              </View>
            </Pressable>
          </View>

          {/* Rangée 2 */}
          <View style={styles.gridRow}>
            {/* Abondance */}
            <Pressable style={[styles.cell, { backgroundColor: '#FDE8B0', borderColor: '#E8C860' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePickPhoto('abondance'); }}>
              {photos['abondance'] && <Image source={{ uri: photos['abondance'] }} style={styles.cellPhoto} />}
              <View style={styles.cellTop}>
                <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
                  <Circle cx="10" cy="10" r="7" stroke="#9A6A00" strokeWidth="1.2" fill="none" />
                  <Path d="M10 5v1.5M10 13V14M8 8C8 7.2 8.9 6.5 10 6.5S12 7.2 12 8s-1.1 1.5-2 1.5-2 .8-2 1.5.9 1.5 2 1.5 2-.7 2-1.5" stroke="#9A6A00" strokeWidth="0.9" strokeLinecap="round" />
                </Svg>
                <View style={[styles.addBtn, { borderColor: '#C89A10' }]}>
                  <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                    <Path d="M6 2v8M2 6h8" stroke="#9A6A00" strokeWidth="1.4" strokeLinecap="round" />
                  </Svg>
                </View>
              </View>
              <View>
                <Text style={[styles.cellLabel, { color: '#7A5000' }]}>Abondance</Text>
                {!photos['abondance'] && <Text style={[styles.cellSub, { color: '#B09050' }]}>+ photo</Text>}
              </View>
            </Pressable>

            {/* Rêves */}
            <Pressable style={[styles.cell, { backgroundColor: '#C4E8F0', borderColor: '#90C8D8' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePickPhoto('reves'); }}>
              {photos['reves'] && <Image source={{ uri: photos['reves'] }} style={styles.cellPhoto} />}
              <View style={styles.cellTop}>
                <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
                  <Path d="M4 10a6 6 0 0112 0" stroke="#1A6A80" strokeWidth="1.2" fill="none" />
                  <Circle cx="10" cy="13" r="1.5" fill="#1A6A80" opacity="0.6" />
                </Svg>
                <View style={[styles.addBtn, { borderColor: '#1A6A80' }]}>
                  <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                    <Path d="M6 2v8M2 6h8" stroke="#1A6A80" strokeWidth="1.4" strokeLinecap="round" />
                  </Svg>
                </View>
              </View>
              <View>
                <Text style={[styles.cellLabel, { color: '#0A4858' }]}>Rêves</Text>
                {!photos['reves'] && <Text style={[styles.cellSub, { color: '#508090' }]}>+ photo</Text>}
              </View>
            </Pressable>
          </View>

          {/* Rangée 3 */}
          <View style={styles.gridRow}>
            {/* Voyages */}
            <Pressable style={[styles.cell, { backgroundColor: '#C8E8C0', borderColor: '#A0C890' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePickPhoto('voyages'); }}>
              {photos['voyages'] && <Image source={{ uri: photos['voyages'] }} style={styles.cellPhoto} />}
              <View style={styles.cellTop}>
                <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
                  <Path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="#2A6A20" strokeWidth="1.2" fill="none" />
                  <Path d="M2 10h16M10 2c-2 3-3 5-3 8s1 5 3 8" stroke="#2A6A20" strokeWidth="1" fill="none" />
                </Svg>
                <View style={[styles.addBtn, { borderColor: '#2A6A20' }]}>
                  <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                    <Path d="M6 2v8M2 6h8" stroke="#2A6A20" strokeWidth="1.4" strokeLinecap="round" />
                  </Svg>
                </View>
              </View>
              <View>
                <Text style={[styles.cellLabel, { color: '#1A4A18' }]}>Voyages</Text>
                {!photos['voyages'] && <Text style={[styles.cellSub, { color: '#4A8A40' }]}>+ photo</Text>}
              </View>
            </Pressable>

            {/* Santé */}
            <Pressable style={[styles.cell, { backgroundColor: '#FFE4C8', borderColor: '#F0C090' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePickPhoto('sante'); }}>
              {photos['sante'] && <Image source={{ uri: photos['sante'] }} style={styles.cellPhoto} />}
              <View style={styles.cellTop}>
                <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
                  <Path d="M10 3v14M3 10h14" stroke="#C06820" strokeWidth="1.5" strokeLinecap="round" />
                  <Circle cx="10" cy="10" r="7" stroke="#C06820" strokeWidth="1" fill="none" opacity="0.4" />
                </Svg>
                <View style={[styles.addBtn, { borderColor: '#C06820' }]}>
                  <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                    <Path d="M6 2v8M2 6h8" stroke="#C06820" strokeWidth="1.4" strokeLinecap="round" />
                  </Svg>
                </View>
              </View>
              <View>
                <Text style={[styles.cellLabel, { color: '#904810' }]}>Santé</Text>
                {!photos['sante'] && <Text style={[styles.cellSub, { color: '#C08858' }]}>+ photo</Text>}
              </View>
            </Pressable>
          </View>

          {/* Rangée 4 — Famille pleine largeur */}
          <View style={[styles.gridRowFamille]}>
            <Pressable style={[styles.cellFamille, { backgroundColor: '#E8F0D8', borderColor: '#C0D8A0' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePickPhoto('famille'); }}>
              {photos['famille'] && <Image source={{ uri: photos['famille'] }} style={styles.cellPhoto} />}
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="9" cy="7" r="3" stroke="#3A6A10" strokeWidth="1.2" fill="none" />
                <Circle cx="17" cy="8" r="2.5" stroke="#3A6A10" strokeWidth="1.2" fill="none" />
                <Path d="M2 19c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#3A6A10" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                <Path d="M16 14c2 0 4 1.3 4 3.5" stroke="#3A6A10" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              </Svg>
              <View style={styles.cellFamilleText}>
                <Text style={[styles.cellLabel, { color: '#2A5008' }]}>Famille & Proches</Text>
                <Text style={[styles.cellSub, { color: '#6A9040' }]}>Appuie pour ajouter ta photo</Text>
              </View>
              <View style={styles.cellFamilleAddBtn}>
                <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                  <Path d="M6 2v8M2 6h8" stroke="#4A8A20" strokeWidth="1.4" strokeLinecap="round" />
                </Svg>
              </View>
            </Pressable>
          </View>

        </Animated.View>

        {/* Texte bas + bouton contextuel */}
        <Animated.View style={[styles.bottomBlock, { opacity: fadeUp3, transform: [{ translateY: fadeUp3.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <Text style={styles.hintText}>Appuie sur une case pour ajouter ta photo</Text>
          {showFinishBtn && (
            <Pressable style={styles.finishBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleFinishCycle(); }}>
              <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                <Path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.finishBtnText}>Terminer mon cycle ✦</Text>
            </Pressable>
          )}
        </Animated.View>

      </View>

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
        <Pressable style={styles.navItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(app)/parametres' as any); }}>
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

  // Header
  header: {
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    marginTop: 64,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: -4,
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

  // Grille
  grid: {
    flex: 1,
    gap: 5,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  gridRowFamille: {
    flex: 1.2,
    flexDirection: 'row',
  },

  // Cellule standard
  cell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 8,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cellPhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    opacity: 0.85,
  },
  cellTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    fontFamily: 'Jost',
    fontSize: 9,
    fontWeight: '500',
  },
  cellSub: {
    fontFamily: 'Jost',
    fontSize: 7,
  },

  // Famille
  cellFamille: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  cellFamilleText: {
    flex: 1,
  },
  cellFamilleAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#C0D8A0',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#8AAA60',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bas
  bottomBlock: {
    flexShrink: 0,
  },
  hintText: {
    fontFamily: 'Jost',
    fontSize: 9,
    color: '#A09088',
    textAlign: 'center',
    marginBottom: 6,
  },
  finishBtn: {
    backgroundColor: '#3A3530',
    borderRadius: 999,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  finishBtnText: {
    fontFamily: 'Jost',
    color: '#F0EAE0',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
