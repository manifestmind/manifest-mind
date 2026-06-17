import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';

export default function Attraction() {
  const router = useRouter();
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  const titleAnim = useRef(new Animated.Value(0)).current;
  const quote1Anim = useRef(new Animated.Value(0)).current;
  const quote2Anim = useRef(new Animated.Value(0)).current;
  const quote3Anim = useRef(new Animated.Value(0)).current;
  const finalAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Titre — fondu majestueux 1500ms + translateY 16→0
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();

    // 2. 3 citations — stagger 1200ms entre chaque, slide-up + fade plus lents (1000ms)
    //    Plus majestueux : on laisse le temps de lire avant l'apparition suivante.
    Animated.sequence([
      Animated.delay(1500),
      Animated.stagger(1200, [
        Animated.timing(quote1Anim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(quote2Anim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(quote3Anim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 3. Phrase finale — fade + translateY après les 3 citations
    //    Citations finissent à 1500 + 2*1200 + 1000 = 4900. Délai 5200 pour respirer.
    Animated.timing(finalAnim, {
      toValue: 1,
      duration: 800,
      delay: 5200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // 4. Pulsation couleur subtile sur la phrase finale — boucle infinie
    //    #6B3FA0 ↔ #9B6FD0, 1500ms par direction, ease in/out quad.
    //    useNativeDriver: false (color interpolation non native).
    Animated.sequence([
      Animated.delay(6200),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ])
      ),
    ]).start();

    // 5. Bouton — apparition différée
    Animated.timing(buttonAnim, {
      toValue: 1,
      duration: 600,
      delay: 6300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  function handleNext() {
    router.push('/(onboarding)/features');
  }

  const pulseColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#6B3FA0', '#9B6FD0'],
  });

  const final = t.attraction.final;
  const c1 = t.attraction.citation1;
  const c2 = t.attraction.citation2;
  const c3 = t.attraction.citation3;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 24, 80),
          paddingBottom: Math.max(insets.bottom, 40),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Orbes décoratifs (identiques à welcome.tsx) */}
      <View style={[styles.orb, { width: 160, height: 160, backgroundColor: '#B8D4B0', top: -45, right: -45 }]} />
      <View style={[styles.orb, { width: 100, height: 100, backgroundColor: '#C4A8D4', bottom: 80, left: -28 }]} />
      <View style={[styles.orb, { width: 70, height: 70, backgroundColor: '#E8C890', bottom: 160, right: -18 }]} />

      {/* 1. Titre — fondu majestueux violet */}
      <Animated.View
        style={{
          opacity: titleAnim,
          transform: [
            { translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        }}
      >
        <Text style={styles.title}>{t.attraction.titre}</Text>
      </Animated.View>

      {/* 2. 3 citations — chacune slide-up + fade */}
      <View style={styles.quotesBlock}>
        <Animated.View
          style={{
            opacity: quote1Anim,
            transform: [
              { translateY: quote1Anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            ],
          }}
        >
          <Text style={styles.quoteText}>{c1.texte}</Text>
          <Text style={styles.quoteAuthor}>— {c1.auteur}</Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: quote2Anim,
            transform: [
              { translateY: quote2Anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            ],
          }}
        >
          <Text style={styles.quoteText}>{c2.texte}</Text>
          <Text style={styles.quoteAuthor}>— {c2.auteur}</Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: quote3Anim,
            transform: [
              { translateY: quote3Anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            ],
          }}
        >
          <Text style={styles.quoteText}>{c3.texte}</Text>
          <Text style={styles.quoteAuthor}>— {c3.auteur}</Text>
        </Animated.View>
      </View>

      {/* 3. Phrase finale — Cormorant italic bold, violet pulsé subtil */}
      <Animated.View
        style={{
          opacity: finalAnim,
          transform: [
            { translateY: finalAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        }}
      >
        <Animated.Text style={[styles.finalText, { color: pulseColor }]}>
          {final.ligne1}
        </Animated.Text>
        <Animated.Text style={[styles.finalText, { color: pulseColor }]}>
          {final.ligne2}
        </Animated.Text>
      </Animated.View>

      {/* 4. Bouton — apparition différée */}
      <Animated.View
        style={{
          width: '100%',
          opacity: buttonAnim,
          transform: [
            { translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        }}
      >
        <Pressable style={styles.btnPrimary} onPress={handleNext}>
          <Text style={styles.btnPrimaryText}>{t.attraction.bouton}</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0EAE0',
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 32,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  // 1. Titre — Cormorant Garamond italic violet
  title: {
    fontFamily: 'serif',
    fontSize: 24,
    fontStyle: 'italic',
    color: '#6B3FA0',
    textAlign: 'center',
    lineHeight: 34,
    paddingHorizontal: 8,
  },
  // 2. Citations
  quotesBlock: {
    width: '100%',
    gap: 28,
    alignItems: 'center',
  },
  quoteText: {
    fontFamily: 'serif',
    fontSize: 17,
    fontStyle: 'italic',
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  quoteAuthor: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#9B7AB8',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  // 3. Phrase finale — Cormorant italic bold violet pulsé
  finalText: {
    fontFamily: 'serif',
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '700',
    lineHeight: 30,
    textAlign: 'center',
  },
  // 4. Bouton
  btnPrimary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#3A3530',
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: {
    color: '#F0EAE0',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
