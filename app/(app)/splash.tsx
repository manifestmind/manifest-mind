import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Splash() {
  const router = useRouter();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState('');
  const eyeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(eyeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function initSplash() {
      try {
        const statusRaw = await AsyncStorage.getItem('cycle_step_status');
        const opening: boolean = statusRaw ? JSON.parse(statusRaw).opening : false;

        const cycleCompleted = await AsyncStorage.getItem('cycle_completed');
        const nextCycleTime = parseInt(await AsyncStorage.getItem('next_cycle_time') || '0');
        const newCycleStarting = cycleCompleted === 'true' && nextCycleTime > 0 && Date.now() >= nextCycleTime;

        if (!opening || newCycleStarting) {
          setToast(t.splash.toast);
          setTimeout(() => setToast(''), 2500);
        }
      } catch {
        // Storage indisponible — continuer sans toast
      }
    }
    initSplash();
  }, []);

  async function handleStart() {
    try {
      const userName = await AsyncStorage.getItem('user_name');
      if (!userName) {
        router.replace('/(app)/name' as any);
      } else {
        router.replace('/(app)/home' as any);
      }
    } catch {
      router.replace('/(app)/home' as any);
    }
  }

  return (
    <View style={styles.wrapper}>
      {/* Toast points */}
      {toast ? (
        <View style={[styles.toast, { top: Math.max(insets.top + 8, 40) }]}>
          <Text style={styles.toastIcon}>✦</Text>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 40, 80) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Orbes */}
        <View style={[styles.orb, { width: 150, height: 150, backgroundColor: '#B8D4B0', top: -40, right: -40 }]} />
        <View style={[styles.orb, { width: 90, height: 90, backgroundColor: '#C4A8D4', bottom: 50, left: -25 }]} />
        <View style={[styles.orb, { width: 65, height: 65, backgroundColor: '#E8C890', bottom: 120, right: -15 }]} />

        {/* Œil SVG */}
        <View style={styles.eyeBlock}>
          <Animated.View style={{ transform: [{ scaleY: eyeAnim }], opacity: eyeAnim }}>
            <Svg width={180} height={138} viewBox="0 0 56 44" style={{ overflow: 'visible' }}>
              <Defs>
                <ClipPath id="sc1">
                  <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
                </ClipPath>
              </Defs>
              <Ellipse cx="28" cy="22" rx="20" ry="13" fill="none" stroke="#C4A8D4" strokeWidth="0.4" opacity="0.5" />
              <Ellipse cx="28" cy="22" rx="17" ry="11" fill="none" stroke="#9B72C8" strokeWidth="0.3" opacity="0.3" />
              <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
              <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#sc1)" />
              <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#sc1)" />
              <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#sc1)" />
              <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#sc1)" />
              <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#sc1)" />
              <Circle cx="25.5" cy="23.5" r="0.6" fill="white" opacity="0.5" clipPath="url(#sc1)" />
              <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#sc1)" />
              <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#sc1)" />
              <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
              <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
              <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
              <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            </Svg>
          </Animated.View>

          <Text style={styles.appName}>ManifestMind</Text>
          <Text style={styles.tagline}>{t.splash.tagline}</Text>
        </View>

        {/* Badge points */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t.splash.badge}</Text>
        </View>

        {/* Citation */}
        <View style={styles.quoteBlock}>
          <View style={styles.divider} />
          <View style={{ flexShrink: 1, width: '100%', alignItems: 'center' }}>
            <Text style={styles.quote} numberOfLines={0} adjustsFontSizeToFit={false}>
              {t.splash.quote}
            </Text>
          </View>
          <View style={styles.dots3}>
            <View style={[styles.dot3, { backgroundColor: '#B8D4B0' }]} />
            <View style={[styles.dot3, { backgroundColor: '#C4A8D4' }]} />
            <View style={[styles.dot3, { backgroundColor: '#E8C890' }]} />
          </View>
        </View>

        {/* Bouton */}
        <View style={styles.btnBlock}>
          <Pressable style={styles.btn} onPress={handleStart}>
            <Text style={styles.btnText}>{t.splash.commencer}</Text>
          </Pressable>
          <Text style={styles.hint}>{t.splash.hint}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F0EAE0',
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#3A2850',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 100,
  },
  toastIcon: {
    fontSize: 12,
    color: '#FDE8B0',
  },
  toastText: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: 'white',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  eyeBlock: {
    alignItems: 'center',
    gap: 4,
  },
  appName: {
    fontFamily: 'serif',
    fontSize: 26,
    fontStyle: 'italic',
    color: '#2A2520',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '300',
    color: '#7A7068',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: '#FDE8B0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: 'Jost',
    fontSize: 11,
    fontWeight: '500',
    color: '#9A6A00',
  },
  quoteBlock: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  divider: {
    width: 20,
    height: 1,
    backgroundColor: '#B8B0A8',
  },
  quote: {
    fontFamily: 'serif',
    fontSize: 20,
    fontStyle: 'italic',
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 32,
  },
  dots3: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 6,
  },
  dot3: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  btnBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#3A3530',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#F0EAE0',
    fontFamily: 'Jost',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hint: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#A09088',
    textAlign: 'center',
  },
});
