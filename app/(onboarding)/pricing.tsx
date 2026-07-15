import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { useTranslation } from '../../src/hooks/useTranslation';
import { canPay, PADDLE_ACTIVE } from '../../services/config';
import { auth } from '../../services/firebase';
import { convertOrSignIn, mapConversionError, needsAccount } from '../../services/authConversion';
import { showAuthToast } from '../../components/ui/AuthToast';
import { openCheckout } from '../../services/paddle';
import { deviceHadSubscription, hasActiveSubscription } from '../../services/subscription';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export default function Pricing() {
  const router = useRouter();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState('annuel');
  // Conversion inline pour un plan payant choisi directement à l'onboarding
  // (même mécanique qu'au cycle 8) : compte permanent email+password avant Paddle.
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Email saisi déjà rattaché à un compte : invite honnête « connecte-toi » +
  // bouton de reconnexion, plutôt qu'un faux « mot de passe incorrect ».
  const [emailExists, setEmailExists] = useState(false);
  // Réactif à la restauration de session Firebase : formulaire de création de
  // compte affiché seulement si pas (encore) de compte permanent.
  const [mustCreateAccount, setMustCreateAccount] = useState(true);
  // Question « Bon retour parmi nous » : posée au clic « essai gratuit » quand
  // l'appareil porte le marqueur had_subscription. Sans elle, un abonné qui
  // revient (nouveau tél, cache vidé) se fabriquerait un anonyme NEUF et
  // perdrait l'accès à son abonnement, attaché à son ancien UID.
  const [showRetourAbonne, setShowRetourAbonne] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setMustCreateAccount(!user || user.isAnonymous);
    });
    return unsub;
  }, []);

  function selectPlan(plan: string) {
    setSelectedPlan(plan);
  }

  // Démarrage de l'essai gratuit (7 cycles, ZÉRO friction) : compte Firebase
  // ANONYME (identité pour le futur paiement/webhook), sans email ni carte. La
  // progression reste LOCALE (AsyncStorage). Au cycle 8, ce compte anonyme sera
  // converti en permanent via linkWithCredential, même UID → aucune perte.
  // C'est l'UNIQUE chemin « sans compte » (l'ancien handleSkipAccount d'auth.tsx
  // a été supprimé au profit de celui-ci).
  async function startFreeTrial() {
    try {
      const current = auth.currentUser;
      // Un compte PERMANENT (donc potentiellement abonné) est encore connecté :
      // la session Firebase vit dans IndexedDB et survit au reset comme au
      // AsyncStorage.clear(). Sans ce signOut, « nouveau compte » réutiliserait
      // cette identité — l'utilisateur hériterait de l'abonnement (accès aux
      // cycles 8+) et, pire, se retrouverait DANS le compte de quelqu'un d'autre
      // sur un appareil prêté. Un essai gratuit ne démarre jamais sur l'identité
      // d'un compte permanent.
      if (current && !current.isAnonymous) {
        if (__DEV__) console.log('[pricing] compte permanent connecté (uid=', current.uid, ') → signOut avant nouvel essai');
        await signOut(auth);
      }
      if (!auth.currentUser) {
        const cred = await signInAnonymously(auth);
        if (__DEV__) console.log('[pricing] signInAnonymously OK uid=', cred.user.uid, 'anon=', cred.user.isAnonymous);
      } else if (__DEV__) {
        console.log('[pricing] session anonyme réutilisée uid=', auth.currentUser.uid);
      }
    } catch (e: any) {
      // Échec (hors-ligne) : on ne bloque pas l'entrée en essai. La conversion
      // du cycle 8 gérera l'absence de compte anonyme (createUser au lieu de link).
      if (__DEV__) console.log('[pricing] signInAnonymously ÉCHEC', e?.code, e?.message);
    }
    try {
      // Purge des droits hérités. useSubscriptionSync finira par retirer la clé
      // (le doc du nouvel anonyme n'a pas d'abonnement), mais le gate de home.tsx
      // lit AsyncStorage IMMÉDIATEMENT au chargement : sans cette purge explicite,
      // un ancien subscription_active='true' laisserait passer pendant la fenêtre
      // de synchro. Un essai gratuit démarre toujours sans accès payant.
      await AsyncStorage.removeItem('subscription_active');
      await AsyncStorage.multiSet([
        ['selected_plan', 'free'],
        ['onboarding_completed', 'true'],
      ]);
    } catch {
      // fallback silencieux — on continue la navigation
    }
    router.replace('/(app)/splash');
  }

  async function handlePurchase() {
    // DIAGNOSTIC dev-only (__DEV__ = false en build prod → strip automatique).
    // NB : cette page d'onboarding n'ouvre PAS Paddle (user pas encore
    // authentifié) — elle route vers auth.
    if (__DEV__) {
      console.log('[pricing] handlePurchase', {
        selectedPlan,
        platform: Platform.OS,
        canPay: canPay(),
        PADDLE_ACTIVE,
      });
    }
    // Attendre la restauration de session avant toute lecture de currentUser
    // (évite de recréer un anonyme en double après un rechargement de page).
    await auth.authStateReady();
    // Essai gratuit = 7 cycles, ZÉRO friction. On crée un compte Firebase
    // ANONYME (identité pour le futur paiement/webhook), sans email ni carte.
    // La progression reste LOCALE (AsyncStorage). Au cycle 8, ce compte anonyme
    // sera converti en permanent via email+password (linkWithCredential), même
    // UID → aucune perte. C'est l'UNIQUE chemin "sans compte" (l'ancien
    // handleSkipAccount d'auth.tsx a été supprimé au profit de celui-ci).
    if (selectedPlan === 'free') {
      // Garde-fou : cet appareil a-t-il déjà porté un abonnement ? Si oui, on ne
      // crée SURTOUT PAS un anonyme neuf en silence — on demande à l'utilisateur
      // s'il revient (→ reconnexion) ou s'il veut vraiment un nouveau compte.
      // Un vrai nouvel utilisateur (aucun marqueur) ne voit jamais cette question.
      if (await deviceHadSubscription()) {
        if (__DEV__) console.log('[pricing] had_subscription détecté → question retour abonné');
        setShowRetourAbonne(true);
        return;
      }
      await startFreeTrial();
      return;
    }

    // Plan payant — bloqué si aucun provider de paiement actif pour la plateforme.
    if (!canPay()) {
      Alert.alert(t.commun.disponibleProchainement);
      return;
    }

    // ── Branche WEB → conversion inline + Paddle (arbitrage #2) ────────────
    // Un plan payant choisi directement à l'onboarding : on crée le compte
    // permanent email+password SUR PLACE (même mécanique qu'au cycle 8), puis
    // on enchaîne le checkout Paddle sans quitter la page. Aucune écriture
    // optimiste de subscription_active — c'est le webhook → Firestore.
    if (Platform.OS === 'web' && PADDLE_ACTIVE) {
      let checkoutEmail = auth.currentUser?.email ?? '';
      if (needsAccount()) {
        const email = accountEmail.trim().toLowerCase();
        if (!EMAIL_RE.test(email)) {
          showAuthToast(t.compte.errEmailInvalide, 'error');
          return;
        }
        if (accountPassword.length < 6) {
          showAuthToast(t.compte.errPasswordCourt, 'error');
          return;
        }
        setEmailExists(false);
        setSubmitting(true);
        const res = await convertOrSignIn(email, accountPassword);
        setSubmitting(false);
        if (!res.ok) {
          // Email connu mais connexion impossible → invite honnête inline + bouton
          // « Me reconnecter » (auth.tsx). Les autres erreurs restent des toasts.
          if (res.code === 'mm/email-exists-signin-failed') {
            setEmailExists(true);
            return;
          }
          showAuthToast(mapConversionError(res.code, t.compte), 'error');
          return;
        }
        checkoutEmail = res.user.email ?? email;
      }
      if (!checkoutEmail || !auth.currentUser) {
        showAuthToast(t.compte.errGenerique, 'error');
        return;
      }
      try {
        await AsyncStorage.multiSet([
          ['selected_plan', selectedPlan],
          ['onboarding_completed', 'true'],
        ]);
      } catch {
        // fallback silencieux
      }
      // GARDE-FOU anti double-paiement : convertOrSignIn a pu reconnecter un
      // utilisateur EXISTANT (email déjà enregistré → signIn sur son compte).
      // On ne l'envoie chez Paddle qu'après avoir vérifié côté serveur qu'il
      // n'est pas déjà abonné. Sinon on lui rouvre simplement son espace.
      if (await hasActiveSubscription(auth.currentUser.uid)) {
        if (__DEV__) console.log('[pricing] abonnement déjà actif → aucun paiement, restauration');
        router.replace('/(app)/activation?restore=1' as any);
        return;
      }
      await openCheckout({
        plan: selectedPlan as 'mensuel' | 'annuel' | 'lifetime',
        email: checkoutEmail,
        firebaseUid: auth.currentUser.uid,
        onCheckoutCompleted: () => { router.replace('/(app)/splash'); },
      });
      return;
    }

    // ── Branche NATIVE → RevenueCat (futur) ────────────────────────────────
    // Aujourd'hui : stub d'écriture optimiste, identique au comportement
    // historique tant que RevenueCat n'est pas câblé. À remplacer par
    // Purchases.purchaseProduct(...) puis basculer subscription_active='true'
    // dans le callback success du SDK RevenueCat (cf. checklist pré-stores #1).
    try {
      await AsyncStorage.multiSet([
        ['selected_plan', selectedPlan],
        ['subscription_active', 'true'],
        ['onboarding_completed', 'true'],
      ]);
    } catch {
      // fallback silencieux — on continue la navigation
    }
    router.push('/(onboarding)/auth');
  }

  function handleRestore() {
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 12, 20), paddingBottom: Math.max(insets.bottom, 12) }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.orb, {
        width: 140,
        height: 140,
        backgroundColor: '#FDE8B0',
        opacity: 0.25,
        top: -20,
        right: -20,
      }]} />
      <View style={[styles.orb, {
        width: 80,
        height: 80,
        backgroundColor: '#C4A8D4',
        opacity: 0.25,
        bottom: 24,
        left: -12,
      }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Svg width={114} height={87} viewBox="0 0 56 44">
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
          <Text style={styles.title}>{t.pricing.titre}</Text>
        </View>

        <View style={styles.progressBlock}>
          <Text style={styles.progressLabel}>{t.pricing.etape}</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.plansContainer}>
          {/* Plan Free */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'free' && styles.planCardSelected,
              { borderColor: '#B8D4B0' },
            ]}
            onPress={() => selectPlan('free')}
          >
            <View style={styles.planBody}>
              <View style={[styles.radio, selectedPlan === 'free' && styles.radioSelected]}>
                {selectedPlan === 'free' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{t.pricing.plans.free.titre}</Text>
                <Text style={styles.planSubtitle}>{t.pricing.plans.free.sousTitre}</Text>
                <Text style={styles.planDescription}>{t.pricing.plans.free.description}</Text>
              </View>
              <View style={styles.planPrice}>
                <Text style={[styles.priceAmount, { color: '#5A8050' }]}>
                  {t.pricing.plans.free.prix}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Plan Lifetime */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'lifetime' && styles.planCardSelected,
              { borderColor: selectedPlan === 'lifetime' ? '#3A3530' : '#3A3530' }
            ]}
            onPress={() => selectPlan('lifetime')}
          >
            <View style={[styles.planBadge, { backgroundColor: '#3A3530' }]}>
              <Text style={styles.planBadgeText}>{t.pricing.plans.lifetime.badge}</Text>
            </View>
            <View style={styles.planBody}>
              <View style={[styles.radio, selectedPlan === 'lifetime' && styles.radioSelected]}>
                {selectedPlan === 'lifetime' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{t.pricing.plans.lifetime.titre}</Text>
                <Text style={styles.planSubtitle}>{t.pricing.plans.lifetime.sousTitre}</Text>
              </View>
              <View style={styles.planPrice}>
                <Text style={styles.priceAmount}>149€</Text>
                <Text style={styles.priceUnit}>{t.pricing.plans.lifetime.unite}</Text>
              </View>
            </View>
          </Pressable>

          {/* Plan Annuel */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'annuel' && styles.planCardSelected,
              { borderColor: selectedPlan === 'annuel' ? '#6B3FA0' : '#6B3FA0' }
            ]}
            onPress={() => selectPlan('annuel')}
          >
            <View style={[styles.planBadge, { backgroundColor: '#FDE8B0' }]}>
              <Text style={[styles.planBadgeText, { color: '#7A5000' }]}>{t.pricing.plans.annuel.badge}</Text>
            </View>
            <View style={styles.planBody}>
              <View style={[styles.radio, selectedPlan === 'annuel' && styles.radioSelected]}>
                {selectedPlan === 'annuel' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{t.pricing.plans.annuel.titre}</Text>
                <Text style={styles.planSubtitle}>{t.pricing.plans.annuel.sousTitre}</Text>
              </View>
              <View style={styles.planPrice}>
                <Text style={[styles.priceAmount, { color: '#6B3FA0' }]}>6,58€</Text>
                <Text style={styles.priceUnit}>{t.pricing.plans.annuel.unite}</Text>
              </View>
            </View>
          </Pressable>

          {/* Plan Mensuel */}
          <Pressable
            style={[
              styles.planCard,
              styles.planCardBasic,
              selectedPlan === 'mensuel' && styles.planCardSelected,
              { borderColor: selectedPlan === 'mensuel' ? '#C4A8D4' : '#D4C4B8' }
            ]}
            onPress={() => selectPlan('mensuel')}
          >
            <View style={styles.planBody}>
              <View style={[styles.radio, selectedPlan === 'mensuel' && styles.radioSelected]}>
                {selectedPlan === 'mensuel' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{t.pricing.plans.mensuel.titre}</Text>
                <Text style={styles.planSubtitle}>{t.pricing.plans.mensuel.sousTitre}</Text>
              </View>
              <View style={styles.planPrice}>
                <Text style={styles.priceAmount}>12,99€</Text>
                <Text style={styles.priceUnit}>{t.pricing.plans.mensuel.unite}</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.benefitsContainer}>
          {t.pricing.avantages.map((b) => (
            <View style={styles.benefit} key={b}>
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path
                  d="M20 6L9 17L4 12"
                  stroke="#6B3FA0"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomBlock}>
        {selectedPlan !== 'free' && mustCreateAccount ? (
          <View style={styles.accountForm}>
            <Text style={styles.accountTitle}>{t.compte.titre}</Text>
            <TextInput
              style={styles.accountInput}
              placeholder={t.compte.emailPlaceholder}
              placeholderTextColor="#A09088"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              value={accountEmail}
              onChangeText={setAccountEmail}
            />
            <TextInput
              style={styles.accountInput}
              placeholder={t.compte.passwordPlaceholder}
              placeholderTextColor="#A09088"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              value={accountPassword}
              onChangeText={setAccountPassword}
            />
            <Text style={styles.accountRappel}>{t.compte.rappelReconnexion}</Text>
            {emailExists ? (
              <View style={styles.emailExistsBox}>
                <Text style={styles.emailExistsText}>{t.compte.errEmailDejaUtilise}</Text>
                <Pressable
                  style={styles.emailExistsBtn}
                  onPress={() => router.push('/(onboarding)/auth')}
                >
                  <Text style={styles.emailExistsBtnText}>{t.compte.boutonReconnexion}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable
          style={[styles.btnPrimary, submitting && { opacity: 0.5 }]}
          onPress={handlePurchase}
          disabled={submitting}
        >
          <Text style={styles.btnPrimaryText}>
            {selectedPlan === 'free' ? t.pricing.plans.free.bouton : t.pricing.cta}
          </Text>
        </Pressable>

        {/* Porte de reconnexion, juste sous le CTA. Sans elle, un abonné qui
            revient sur un nouvel appareil (storage vide → onboarding) n'a AUCUN
            moyen de retrouver son compte : s'il choisit « essai gratuit »,
            signInAnonymously lui crée un nouvel UID et son abonnement (attaché à
            l'ancien) devient inaccessible. auth.tsx → magic link → même UID →
            useSubscriptionSync repose subscription_active. */}
        <Pressable style={styles.btnReconnexion} onPress={() => router.push('/(onboarding)/auth')}>
          <Text style={styles.btnReconnexionText}>{t.pricing.dejaCompte}</Text>
        </Pressable>

        <Text style={styles.bottomText}>{t.pricing.bottomText}</Text>

        {/* « Restaurer un achat » est un concept de store natif (App Store /
            Play Store, via RevenueCat en Phase 2). Sur web, la source de vérité
            est Firestore et le vrai chemin est le lien de reconnexion ci-dessus :
            on masque donc ce lien, qui ne ferait rien et sèmerait la confusion.
            Code conservé tel quel pour le pipeline natif. */}
        {Platform.OS !== 'web' ? (
          <Pressable onPress={handleRestore}>
            <Text style={styles.restoreText}>{t.pricing.restaurer}</Text>
          </Pressable>
        ) : null}

        <View style={styles.dotsNav}>
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={[styles.dotNav, styles.dotNavOn]} />
          <View style={styles.dotNav} />
        </View>
      </View>

      {/* Question « Bon retour parmi nous » — uniquement si l'appareil porte le
          marqueur had_subscription. Modal (et non Alert) : Alert.alert n'affiche
          rien sur React Native Web. */}
      <Modal
        visible={showRetourAbonne}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRetourAbonne(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.pricing.retourAbonne.titre}</Text>
            <Text style={styles.modalText}>{t.pricing.retourAbonne.texte}</Text>

            <Pressable
              style={styles.modalBtnPrimary}
              onPress={() => {
                setShowRetourAbonne(false);
                router.push('/(onboarding)/auth');
              }}
            >
              <Text style={styles.modalBtnPrimaryText}>{t.pricing.retourAbonne.retrouver}</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                setShowRetourAbonne(false);
                await startFreeTrial();
              }}
            >
              <Text style={styles.modalBtnSecondaryText}>{t.pricing.retourAbonne.nouveauCompte}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0EAE0',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  content: {
    width: '100%',
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 23,
    fontStyle: 'italic',
    color: '#2A2520',
    textAlign: 'center',
  },
  progressBlock: {
    width: '100%',
    gap: 6,
  },
  progressLabel: {
    fontFamily: 'Jost',
    fontSize: 10,
    color: '#9B80B8',
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(196,168,212,0.25)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6B3FA0',
  },
  plansContainer: {
    width: '100%',
    gap: 12,
  },
  planCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderRadius: 13,
    overflow: 'hidden',
  },
  planCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  planCardBasic: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 0.5,
  },
  planBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  planBadgeText: {
    fontFamily: 'Jost',
    fontSize: 10,
    fontWeight: '500',
    color: '#FDE8B0',
  },
  planBody: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  radio: {
    width: 15,
    height: 15,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#3A3530',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#6B3FA0',
    borderColor: '#6B3FA0',
  },
  radioDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'white',
  },
  planInfo: {
    flex: 1,
    gap: 2,
  },
  planTitle: {
    fontFamily: 'Jost',
    fontSize: 12,
    fontWeight: '500',
    color: '#2A2520',
  },
  planSubtitle: {
    fontFamily: 'Jost',
    fontSize: 10,
    fontWeight: '300',
    color: '#7A7068',
  },
  planDescription: {
    fontFamily: 'Jost',
    fontSize: 9,
    fontWeight: '300',
    color: '#9A8878',
    marginTop: 3,
    lineHeight: 13,
  },
  planPrice: {
    alignItems: 'center',
    gap: 1,
  },
  priceAmount: {
    fontFamily: 'serif',
    fontSize: 20,
    fontStyle: 'italic',
    color: '#3A3530',
  },
  priceUnit: {
    fontFamily: 'Jost',
    fontSize: 8,
    color: '#9A8878',
  },
  benefitsContainer: {
    width: '100%',
    gap: 8,
  },
  benefit: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  benefitText: {
    fontFamily: 'Jost',
    fontSize: 10,
    color: '#3A3530',
    flex: 1,
  },
  bottomBlock: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  accountForm: {
    width: '100%',
    gap: 8,
  },
  accountTitle: {
    fontFamily: 'serif',
    fontSize: 14,
    fontStyle: 'italic',
    color: '#3A3530',
    textAlign: 'center',
  },
  accountInput: {
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#2A2520',
  },
  accountRappel: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: '#7A7068',
    textAlign: 'center',
    lineHeight: 16,
  },
  emailExistsBox: {
    width: '100%',
    backgroundColor: '#F5EEFB',
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'center',
  },
  emailExistsText: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 18,
  },
  emailExistsBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#6B3FA0',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  emailExistsBtnText: {
    fontFamily: 'Jost',
    fontSize: 14,
    fontWeight: '500',
    color: '#6B3FA0',
  },
  btnPrimary: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#3A3530',
    alignItems: 'center',
    marginTop: -12,
  },
  btnPrimaryText: {
    color: '#F0EAE0',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  bottomText: {
    fontFamily: 'serif',
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6B3FA0',
    textAlign: 'center',
  },
  btnReconnexion: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: '#6B3FA0',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  btnReconnexionText: {
    fontFamily: 'Jost',
    fontSize: 14,
    fontWeight: '500',
    color: '#6B3FA0',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,14,48,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#F0EAE0',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 14,
  },
  modalTitle: {
    fontFamily: 'serif',
    fontSize: 21,
    fontStyle: 'italic',
    color: '#2A2520',
    textAlign: 'center',
    width: '100%',
  },
  modalText: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 20,
    width: '100%',
  },
  modalBtnPrimary: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#3A3530',
    alignItems: 'center',
    marginTop: 4,
  },
  modalBtnPrimaryText: {
    color: '#F0EAE0',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  modalBtnSecondaryText: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#6B3FA0',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  restoreText: {
    fontFamily: 'Jost',
    fontSize: 10,
    color: '#A09088',
    textDecorationLine: 'underline',
  },
  dotsNav: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
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
