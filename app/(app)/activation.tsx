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
import { Animated, Easing, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { auth } from '../../services/firebase';
import { hasActiveSubscription } from '../../services/subscription';
import { SUPPORT_EMAIL } from '../../services/config';

const POLL_MS = 1000;
// Au-delà, on considère que le webhook ne viendra pas dans un délai raisonnable
// (backend en panne, utilisateur hors ligne, Firestore injoignable) et on rend
// la main à l'utilisateur : jamais de loader infini.
const SLOW_AFTER_MS = 30000;
// En phase 'slow', re-vérification SERVEUR autoritaire (getDoc users/{uid}) tous
// les SLOW_RECHECK_MS, plafonnée à SLOW_AUTO_MAX tentatives — borne le coût
// Firestore tout en laissant un webhook simplement en retard s'auto-débloquer.
const SLOW_RECHECK_MS = 4000;
const SLOW_AUTO_MAX = 3;
// Après ce nombre de vérifications serveur infructueuses, on bascule le message
// vers le "vrai recours" (webhook probablement en échec, pas juste en retard).
const ESCALATE_AFTER = 3;
// Cooldown VISIBLE entre deux clics manuels « Réessayer » infructueux : donne un
// retour continu à l'utilisateur ET borne les lectures Firestore.
const RETRY_COOLDOWN_S = 5;
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
  // Nombre de vérifications SERVEUR infructueuses en phase 'slow'. Au-delà
  // d'ESCALATE_AFTER, on passe du message "patience" au "vrai recours".
  const [attempts, setAttempts] = useState(0);
  const escalated = attempts >= ESCALATE_AFTER;
  const pulse = useRef(new Animated.Value(0)).current;
  const mountedAt = useRef(Date.now()).current;

  // 🔒 VÉRITÉ SERVEUR — la SEULE façon de débloquer l'accès. getDoc sur
  // users/{uid} : la valeur n'est `true` que si le webhook Paddle (Admin SDK,
  // HMAC vérifié) l'a écrite. Les règles Firestore interdisent l'écriture
  // client → impossible de la forger. Court-circuite un listener onSnapshot
  // mort ou branché sur le mauvais UID. Hors ligne / erreur → false (on ne
  // débloque jamais dans le doute). Ne JAMAIS écrire subscription_active ici.
  async function serverConfirms(): Promise<boolean> {
    const uid = auth.currentUser?.uid;
    return uid ? hasActiveSubscription(uid) : false;
  }

  // Une passe : d'abord la clé locale (le listener a pu la poser entre-temps),
  // sinon la vérité serveur. Succès → 'activated' + renvoie true. Échec →
  // +1 tentative + renvoie false (l'appelant manuel enchaîne un cooldown visible).
  async function runCheck(): Promise<boolean> {
    try {
      if ((await AsyncStorage.getItem('subscription_active')) === 'true') {
        setPhase('activated');
        return true;
      }
    } catch {
      // AsyncStorage indisponible — on tente quand même le serveur.
    }
    if (await serverConfirms()) {
      setPhase('activated');
      return true;
    }
    setAttempts((a) => a + 1);
    return false;
  }

  // Clic manuel « Réessayer » : feedback VISIBLE à chaque fois — jamais un bouton
  // muet. « Vérification… » pendant le getDoc, puis, en cas d'échec, un cooldown
  // affiché (« Réessayer dans Ns ») qui borne aussi les lectures Firestore.
  // Le succès survient PENDANT le check (avant le cooldown) → jamais bloqué.
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function onRetry() {
    if (checking || cooldown > 0) return;
    setChecking(true);
    const ok = await runCheck();
    setChecking(false);
    if (!ok) setCooldown(RETRY_COOLDOWN_S);
  }

  // Décompte visible du cooldown, seconde par seconde.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

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

  // Phase 'slow' : re-vérification SERVEUR autoritaire, bornée à SLOW_AUTO_MAX
  // passes automatiques. Un webhook simplement en retard s'auto-débloque sans
  // action ; au-delà, on rend la main (bouton « Réessayer » manuel + recours).
  useEffect(() => {
    if (phase !== 'slow') return;
    let cancelled = false;
    let autoLeft = SLOW_AUTO_MAX;

    (async () => {
      if (!cancelled) await runCheck(); // 1re passe immédiate en entrant dans 'slow'
    })();

    const interval = setInterval(() => {
      if (cancelled) return;
      if (autoLeft <= 0) {
        clearInterval(interval);
        return;
      }
      autoLeft -= 1;
      runCheck();
    }, SLOW_RECHECK_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // Volontairement [phase] seulement : runCheck lit/écrit via setState
    // fonctionnels, l'effet ne doit pas se relancer à chaque tentative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              {/* Escalade : tant que les vérifs serveur sont peu nombreuses, on
                  rassure (« encore un instant »). Au-delà d'ESCALATE_AFTER, on
                  passe au vrai recours (« ton paiement est en sécurité » + aide). */}
              <Text style={styles.title} numberOfLines={0} adjustsFontSizeToFit={false}>
                {escalated ? t.activation.bloqueTitre : t.activation.lentTitre}
              </Text>
              <Text style={styles.message} numberOfLines={0} adjustsFontSizeToFit={false}>
                {escalated ? t.activation.bloqueMessage : t.activation.lentMessage}
              </Text>
              {escalated && SUPPORT_EMAIL ? (
                <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
                  <Text style={styles.supportLink} numberOfLines={0}>
                    {t.activation.bloqueSupport.replace('{email}', SUPPORT_EMAIL)}
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>

        {/* Pendant l'attente : aucun bouton — on ne laisse pas l'utilisateur
            s'échapper vers le paywall pendant les secondes utiles. Les sorties
            n'apparaissent que si l'activation tarde anormalement.

            ⚠️ PLUS de bouton « Continuer → home » : c'était la BOUCLE (home →
            gate → paywall). Le seul chemin vers home passe par la phase
            'activated', qui exige subscription_active=true CONFIRMÉ (poll ou
            serveur). « Réessayer » relance une vérif SERVEUR autoritaire ; une
            fois escaladé, « J'ai payé — me reconnecter » ré-attache le listener
            au bon UID. Jamais d'octroi d'accès sur simple affirmation client. */}
        {phase === 'slow' ? (
          <View style={styles.actions}>
            {/* 3 états VISIBLES, jamais muet : « Vérification… » pendant le
                getDoc, puis « Réessayer dans Ns » (cooldown affiché), sinon
                « Réessayer » actif. */}
            <Pressable
              style={[styles.btnPrimary, (checking || cooldown > 0) && { opacity: 0.6 }]}
              onPress={onRetry}
              disabled={checking || cooldown > 0}
            >
              <Text style={styles.btnPrimaryText}>
                {checking
                  ? t.activation.verification
                  : cooldown > 0
                    ? t.activation.reessayerDans.replace('{s}', String(cooldown))
                    : t.activation.rafraichir}
              </Text>
            </Pressable>
            {escalated ? (
              <Pressable style={styles.btnRecours} onPress={() => router.replace('/(onboarding)/auth' as any)}>
                <Text style={styles.btnRecoursText}>{t.activation.jaiPaye}</Text>
              </Pressable>
            ) : null}
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
  btnRecours: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#6B3FA0',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  btnRecoursText: {
    fontFamily: 'Jost',
    fontSize: 14,
    fontWeight: '500',
    color: '#6B3FA0',
    textAlign: 'center',
  },
  supportLink: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#6B3FA0',
    textAlign: 'center',
    textDecorationLine: 'underline',
    width: '100%',
    maxWidth: 340,
    marginTop: 2,
  },
});
