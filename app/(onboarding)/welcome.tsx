import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useLanguage } from '../../src/i18n/LanguageContext';


export default function OnboardingWelcome() {
  const router = useRouter();
  const t = useTranslation();
  const { lang, setLang } = useLanguage();
  const insets = useSafeAreaInsets();
  const openEye = useSharedValue(0);

  useEffect(() => {
    openEye.value = withDelay(1000,
      withTiming(1, {
        duration: 4000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, []);

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: openEye.value }],
    opacity: withTiming(openEye.value > 0.1 ? 1 : 0, { duration: 300 }),
  }));

  function handleStart() {
    router.push('/(onboarding)/attraction');
  }

  function handleLang(l: 'fr' | 'en' | 'es') {
    setLang(l);
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 24, 80), paddingBottom: Math.max(insets.bottom, 40) }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Orbes décoratives */}
      <View style={[styles.orb, {
        width: 160, height: 160,
        backgroundColor: '#B8D4B0',
        top: -45, right: -45
      }]} />
      <View style={[styles.orb, {
        width: 100, height: 100,
        backgroundColor: '#C4A8D4',
        bottom: 80, left: -28
      }]} />
      <View style={[styles.orb, {
        width: 70, height: 70,
        backgroundColor: '#E8C890',
        bottom: 160, right: -18
      }]} />

      {/* Bloc œil + titre */}
      <View style={styles.eyeBlock}>
        <Animated.View style={eyeStyle}>
          <Svg
            width={180}
            height={138}
            viewBox="0 0 56 44"
            style={{ overflow: 'visible' }}
          >
            <Defs>
              <ClipPath id="ec1">
                <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
              </ClipPath>
            </Defs>
            <Ellipse cx="28" cy="22" rx="20" ry="13"
              fill="none" stroke="#C4A8D4"
              strokeWidth="0.4" opacity="0.5" />
            <Ellipse cx="28" cy="22" rx="17" ry="11"
              fill="none" stroke="#9B72C8"
              strokeWidth="0.3" opacity="0.3" />
            <Path
              d="M8 22 Q28 6 48 22 Q28 38 8 22Z"
              fill="#FAF6F0" />
            <Circle cx="28" cy="22" r="10.5"
              fill="#DDD0F8"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="22" r="8"
              fill="#9B72C8" opacity="0.75"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="22" r="5.8"
              fill="#6B3FA0" opacity="0.9"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="22" r="3"
              fill="#1A0E30"
              clipPath="url(#ec1)" />
            <Circle cx="30.5" cy="19.5" r="1.3"
              fill="white" opacity="0.9"
              clipPath="url(#ec1)" />
            <Circle cx="25.5" cy="23.5" r="0.6"
              fill="white" opacity="0.5"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="15.5" r="1.8"
              fill="#EAC870"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="15.5" r="0.8"
              fill="#C89A30"
              clipPath="url(#ec1)" />
            <Path
              d="M8 22 Q28 6 48 22"
              fill="none" stroke="#3A2850"
              strokeWidth="1.4"
              strokeLinecap="round" />
            <Path
              d="M8 22 Q28 38 48 22"
              fill="none" stroke="#3A2850"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.5" />
            <Circle cx="8" cy="22" r="1"
              fill="#C4A8D4" opacity="0.6" />
            <Circle cx="48" cy="22" r="1"
              fill="#C4A8D4" opacity="0.6" />
          </Svg>
        </Animated.View>

        {/* Titre juste sous l'œil */}
        <Text style={styles.appName}>ManifestMind</Text>
        <Text style={styles.tagline}>{t.welcome.tagline}</Text>
      </View>

      {/* Citation */}
      <View style={styles.quoteBlock}>
        <View style={styles.divider} />
        <View style={{ flexShrink: 1, width: '100%', alignItems: 'center' }}>
          <Text style={styles.quote} numberOfLines={0} adjustsFontSizeToFit={false}>
            {t.welcome.quote}
          </Text>
        </View>
        <View style={styles.dots3}>
          <View style={[styles.dot3, { backgroundColor: '#B8D4B0' }]} />
          <View style={[styles.dot3, { backgroundColor: '#C4A8D4' }]} />
          <View style={[styles.dot3, { backgroundColor: '#E8C890' }]} />
        </View>
      </View>

      {/* Langue + bouton */}
      <View style={styles.bottomBlock}>
        <View style={styles.langRow}>
          <Pressable style={[styles.langChip, lang === 'fr' && styles.langChipOn]} onPress={() => handleLang('fr')}>
            <Text style={lang === 'fr' ? styles.langChipTextOn : styles.langChipText}>🇫🇷 Français</Text>
          </Pressable>
          <Pressable style={[styles.langChip, lang === 'en' && styles.langChipOn]} onPress={() => handleLang('en')}>
            <Text style={lang === 'en' ? styles.langChipTextOn : styles.langChipText}>🇬🇧 English</Text>
          </Pressable>
          <Pressable style={[styles.langChip, lang === 'es' && styles.langChipOn]} onPress={() => handleLang('es')}>
            <Text style={lang === 'es' ? styles.langChipTextOn : styles.langChipText}>🇪🇸 Español</Text>
          </Pressable>
        </View>

        <Pressable style={styles.btnPrimary} onPress={handleStart}>
          <Text style={styles.btnPrimaryText}>{t.welcome.commencer}</Text>
        </Pressable>

        <Text style={styles.hint}>
          {t.welcome.hint}
        </Text>

        {/* Dots navigation */}
        <View style={styles.dotsNav}>
          <View style={[styles.dotNav, styles.dotNavOn]} />
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0EAE0',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 24,
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
    fontFamily: 'sans-serif',
    fontSize: 11,
    fontWeight: '300',
    color: '#7A7068',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  quoteBlock: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  divider: {
    width: 18,
    height: 1,
    backgroundColor: '#C4A8D4',
  },
  quote: {
    fontFamily: 'serif',
    fontSize: 23,
    fontStyle: 'italic',
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 35,
  },
  dots3: {
    flexDirection: 'row',
    gap: 5,
  },
  dot3: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  bottomBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    backgroundColor: 'transparent',
  },
  langChipOn: {
    backgroundColor: '#6B3FA0',
    borderColor: '#6B3FA0',
  },
  langChipText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A7068',
  },
  langChipTextOn: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  btnPrimary: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#3A3530',
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#F0EAE0',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: 20,
    color: '#A09088',
    textAlign: 'center',
  },
  dotsNav: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dotNav: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#C4A8D4',
  },
  dotNavOn: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#6B3FA0',
  },
});
