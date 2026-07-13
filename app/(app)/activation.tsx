// Écran tampon post-paiement.
//
// Paddle émet `checkout.completed` dès que la carte est validée côté navigateur,
// alors que `subscription_active` n'existe qu'après l'aller-retour serveur :
// webhook Paddle → Firestore → useSubscriptionSync → AsyncStorage. Router vers
// home immédiatement ferait donc lire au gate freemium une clé encore absente →
// rebond sur le paywall juste après avoir payé. Cet écran occupe cette fenêtre.
//
// Il attend la MÊME clé AsyncStorage que celle que relira le gate de home.tsx
// (et non un snapshot Firestore) : on ne route que lorsque la valeur sur
// laquelle le gate se prononce est effectivement posée — aucune course possible.
// L'écran reste ainsi agnostique au provider (Paddle aujourd'hui, RevenueCat
// demain) et n'écrit jamais `subscription_active` lui-même : useSubscriptionSync
// en reste le seul écrivain.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';

const POLL_MS = 1000;
// Au-delà, on considère que le webhook ne viendra pas dans un délai raisonnable
// (backend en panne, utilisateur hors ligne, Firestore injoignable) et on rend
// la main à l'utilisateur : jamais de loader infini.
const SLOW_AFTER_MS = 30000;
// Respiration après la confirmation, avant de router vers home.
const SUCCESS_HOLD_MS = 1200;
// Durée minimale d'affichage de l'écran, activation instantanée ou non : en
// sandbox le webhook peut répondre en moins d'une seconde, et le moment
// "départ de la transformation" clignoterait sans qu'on ait eu le temps de le lire.
const MIN_VISIBLE_MS = 2500;

type Phase = 'waiting' | 'activated' | 'slow';

export default function Activation() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  // ?restore=1 → l'utilisateur n'a RIEN payé : on a détecté qu'il était déjà
  // abonné (garde-fou de services/subscription.ts) et on lui rouvre son espace.
  // Parler de « paiement reçu » ici serait faux.
  const { restore } = useLocalSearchParams<{ restore?: string }>();
  const isRestore = restore === '1';
  const [phase, setPhase] = useState<Phase>('waiting');
  const pulse = useRef(new Animated.Value(0)).current;
  const mountedAt = useRef(Date.now()).current;

  useEffect(() => {
    if (__DEV__) console.log('[activation] écran monté, attente de subscription_active');
  }, []);

  // Polling de subscription_active. Relancé quand phase repasse à 'waiting'
  // (bouton "Attendre encore").
  useEffect(() => {
    if (phase !== 'waiting') return;

    let cancelled = false;

    async function check() {
      try {
        const active = (await AsyncStorage.getItem('subscription_active')) === 'true';
        if (active && !cancelled) {
          if (__DEV__) console.log('[activation] subscription_active=true → succès');
          setPhase('activated');
        }
      } catch {
        // AsyncStorage indisponible — on retentera au prochain tick.
      }
    }

    check();
    const interval = setInterval(check, POLL_MS);
    const timeout = setTimeout(() => {
      if (!cancelled) {
        if (__DEV__) console.log('[activation] timeout — activation trop lente');
        setPhase('slow');
      }
    }, SLOW_AFTER_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phase]);

  // Abonnement actif → le gate de home.tsx lira 'true' et laissera passer.
  // On garantit MIN_VISIBLE_MS d'écran au total, même si le webhook a répondu
  // instantanément, puis SUCCESS_HOLD_MS pour lire la confirmation.
  useEffect(() => {
    if (phase !== 'activated') return;
    const elapsed = Date.now() - mountedAt;
    const delay = Math.max(SUCCESS_HOLD_MS, MIN_VISIBLE_MS - elapsed);
    if (__DEV__) console.log(`[activation] route vers /home dans ${delay}ms`);
    const timeout = setTimeout(() => router.replace('/(app)/home' as any), delay);
    return () => clearTimeout(timeout);
  }, [phase, mountedAt]);

  useEffect(() => {
    if (phase !== 'waiting') {
      pulse.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  const eyeScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const eyeOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top + 24, 32), paddingBottom: Math.max(insets.bottom + 16, 24) },
      ]}
    >
      <View style={[styles.orb, { width: 160, height: 160, backgroundColor: '#FDE8B0', opacity: 0.25, top: -30, right: -30 }]} />
      <View style={[styles.orb, { width: 90, height: 90, backgroundColor: '#C4A8D4', opacity: 0.25, bottom: 40, left: -16 }]} />

      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: eyeScale }], opacity: eyeOpacity }}>
          <Svg width={132} height={101} viewBox="0 0 56 44">
            <Defs>
              <ClipPath id="av1">
                <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
              </ClipPath>
            </Defs>
            <Ellipse cx="28" cy="22" rx="20" ry="13" fill="none" stroke="#C4A8D4" strokeWidth="0.4" opacity="0.5" />
            <Ellipse cx="28" cy="22" rx="17" ry="11" fill="none" stroke="#9B72C8" strokeWidth="0.3" opacity="0.3" />
            <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
            <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#av1)" />
            <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#av1)" />
            <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#av1)" />
            <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#av1)" />
            <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#av1)" />
            <Circle cx="25.5" cy="23.5" r="0.6" fill="white" opacity="0.5" clipPath="url(#av1)" />
            <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#av1)" />
            <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#av1)" />
            <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
            <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
            <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
          </Svg>
        </Animated.View>

        <View style={styles.textBlock}>
          {phase === 'waiting' ? (
            <>
              <Text style={styles.confirmation} numberOfLines={0} adjustsFontSizeToFit={false}>
                {isRestore ? t.activation.restaureConfirmation : t.activation.paiementRecu}
              </Text>
              <Text style={styles.title} numberOfLines={0} adjustsFontSizeToFit={false}>
                {isRestore ? t.activation.restaureTitre : t.activation.voyage}
              </Text>
              <Text style={styles.message} numberOfLines={0} adjustsFontSizeToFit={false}>
                {isRestore ? t.activation.restaurePreparation : t.activation.preparation}
              </Text>
            </>
          ) : phase === 'activated' ? (
            <>
              <Text style={styles.title} numberOfLines={0} adjustsFontSizeToFit={false}>
                {t.activation.succesTitre}
              </Text>
              <Text style={styles.message} numberOfLines={0} adjustsFontSizeToFit={false}>
                {t.activation.succesMessage}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.confirmation} numberOfLines={0} adjustsFontSizeToFit={false}>
                {isRestore ? t.activation.restaureConfirmation : t.activation.paiementRecu}
              </Text>
              <Text style={styles.title} numberOfLines={0} adjustsFontSizeToFit={false}>
                {t.activation.lentTitre}
              </Text>
              <Text style={styles.message} numberOfLines={0} adjustsFontSizeToFit={false}>
                {t.activation.lentMessage}
              </Text>
            </>
          )}
        </View>

        {/* Pendant l'attente : aucun bouton — on ne laisse pas l'utilisateur
            s'échapper vers le paywall pendant les secondes utiles. Les sorties
            n'apparaissent que si l'activation tarde anormalement. */}
        {phase === 'slow' ? (
          <View style={styles.actions}>
            <Pressable style={styles.btnPrimary} onPress={() => setPhase('waiting')}>
              <Text style={styles.btnPrimaryText}>{t.activation.rafraichir}</Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/(app)/home' as any)}>
              <Text style={styles.btnSecondaryText}>{t.activation.continuer}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EAE0',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 22,
  },
  textBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  confirmation: {
    fontFamily: 'Jost',
    fontSize: 13,
    fontWeight: '500',
    color: '#5A8050',
    textAlign: 'center',
    width: '100%',
  },
  title: {
    fontFamily: 'serif',
    fontSize: 23,
    fontStyle: 'italic',
    color: '#2A2520',
    textAlign: 'center',
    width: '100%',
  },
  message: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 20,
    width: '100%',
    maxWidth: 340,
  },
  actions: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
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
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: '#A09088',
    textDecorationLine: 'underline',
  },
});
