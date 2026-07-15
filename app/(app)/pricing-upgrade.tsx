import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { canPay, FREE_CYCLES, PADDLE_ACTIVE } from '../../services/config';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { convertOrSignIn, mapConversionError, needsAccount } from '../../services/authConversion';
import { showAuthToast } from '../../components/ui/AuthToast';
import { openCheckout } from '../../services/paddle';
import { hasActiveSubscription } from '../../services/subscription';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PricingUpgrade() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState('annuel');
  const [isFreemiumExpired, setIsFreemiumExpired] = useState(false);
  // Conversion inline : si l'utilisateur est anonyme (essai) ou absent, on lui
  // demande email + mot de passe pour créer son compte permanent avant de payer.
  const [mustCreateAccount, setMustCreateAccount] = useState(true);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Email saisi déjà rattaché à un compte : on bascule sur une invite honnête
  // « connecte-toi » + bouton de reconnexion, au lieu d'un faux « mot de passe
  // incorrect » (un compte magic link n'a jamais eu de mot de passe).
  const [emailExists, setEmailExists] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cycle = parseInt((await AsyncStorage.getItem('current_cycle')) || '1');
        const subActive = (await AsyncStorage.getItem('subscription_active')) === 'true';
        setIsFreemiumExpired(cycle > FREE_CYCLES && !subActive);
      } catch {
        // fallback silencieux — pas de bandeau freemium si lecture impossible
      }
    })();
  }, []);

  // Réactif à la restauration de session Firebase : le formulaire de création
  // de compte ne s'affiche que si l'utilisateur n'a pas (encore) de compte
  // permanent (anonyme ou null). Évite un formulaire affiché à tort pendant la
  // fenêtre de réhydratation.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setMustCreateAccount(!user || user.isAnonymous);
    });
    return unsub;
  }, []);

  async function handlePurchase() {
    // Attendre la fin de la restauration de la session Firebase : sur web,
    // auth.currentUser est null au chargement tant que la persistance n'a pas
    // réhydraté. Sans ça, l'anonyme d'essai apparaît comme "null" → createUser
    // au lieu de linkWithCredential (perte de la vraie conversion).
    await auth.authStateReady();
    // DIAGNOSTIC dev-only (__DEV__ = false en build prod → strip automatique).
    if (__DEV__) {
      console.log('[pricing-upgrade] handlePurchase', {
        selectedPlan,
        platform: Platform.OS,
        canPay: canPay(),
        PADDLE_ACTIVE,
        uid: auth.currentUser?.uid ?? null,
        isAnonymous: auth.currentUser?.isAnonymous ?? null,
        email: auth.currentUser?.email ?? null,
      });
    }
    // Bloqué si aucun provider de paiement n'est actif pour la plateforme courante
    // (Paddle sur web, RevenueCat/IAP sur native).
    if (!canPay()) {
      Alert.alert(t.commun.disponibleProchainement);
      return;
    }

    // ── Branche WEB → Paddle Checkout ─────────────────────────────────────
    // Aucune écriture optimiste de subscription_active ici : c'est le listener
    // useSubscriptionSync (monté dans _layout.tsx) qui s'en chargera quand le
    // webhook Paddle aura mis à jour Firestore. On enregistre seulement
    // selected_plan localement pour l'affichage UI du plan choisi.
    if (Platform.OS === 'web' && PADDLE_ACTIVE) {
      // 1) S'assurer d'un compte permanent avec email. Anonyme (essai) → on
      //    convertit via email+password (linkWithCredential, même UID → aucune
      //    perte). Déjà permanent → on saute cette étape.
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
        setMustCreateAccount(false);
      }
      if (!checkoutEmail || !auth.currentUser) {
        showAuthToast(t.compte.errGenerique, 'error');
        return;
      }
      // 2) GARDE-FOU anti double-paiement. convertOrSignIn a pu reconnecter un
      //    utilisateur EXISTANT (email déjà enregistré → signIn sur son compte) :
      //    typiquement l'abonné revenu sur un appareil neuf, qui a démarré un
      //    essai anonyme et se retrouve ici au cycle 8. Son abonnement vit sur
      //    son ancien UID — on le détecte AVANT d'ouvrir Paddle, et on lui rouvre
      //    son espace au lieu de le faire payer une seconde fois.
      if (await hasActiveSubscription(auth.currentUser.uid)) {
        if (__DEV__) console.log('[pricing-upgrade] abonnement déjà actif → aucun paiement, restauration');
        router.replace('/(app)/activation?restore=1' as any);
        return;
      }

      // 3) Enregistrer le plan choisi (affichage) — pas d'écriture optimiste de
      //    subscription_active : c'est le webhook → Firestore → useSubscriptionSync.
      try {
        await AsyncStorage.setItem('selected_plan', selectedPlan);
      } catch {
        // Écriture impossible — continuer quand même
      }
      // 4) Enchaîner DIRECTEMENT sur le checkout Paddle, sans quitter la page.
      //    À la complétion, on route vers l'écran d'activation : `checkout.completed`
      //    arrive AVANT que le webhook ait écrit subscription_active (Firestore →
      //    useSubscriptionSync → AsyncStorage). Router vers home ici ferait rebondir
      //    l'utilisateur sur ce paywall alors qu'il vient de payer. L'écran
      //    d'activation attend la clé puis route.
      await openCheckout({
        plan: selectedPlan as 'mensuel' | 'annuel' | 'lifetime',
        email: checkoutEmail,
        firebaseUid: auth.currentUser.uid,
        onCheckoutCompleted: () => {
          if (__DEV__) console.log('[pricing-upgrade] checkout.completed → route /activation');
          router.replace('/(app)/activation' as any);
        },
      });
      return;
    }

    // ── Branche NATIVE → RevenueCat (futur) ───────────────────────────────
    // Aujourd'hui : stub d'écriture optimiste, identique au comportement
    // historique tant que RevenueCat n'est pas câblé. À remplacer par
    // Purchases.purchaseProduct(...) puis basculer subscription_active='true'
    // dans le callback success du SDK RevenueCat (cf. checklist pré-stores #1).
    try {
      await AsyncStorage.multiSet([
        ['selected_plan', selectedPlan],
        ['subscription_active', 'true'],
      ]);
    } catch {
      // Écriture impossible — continuer quand même
    }
    router.replace('/(app)/home' as any);
  }

  function handleRestore() {
    // stub — intégration RevenueCat à venir
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 12, 20), paddingBottom: Math.max(insets.bottom, 12) }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.orb, {
        width: 140, height: 140, backgroundColor: '#FDE8B0',
        opacity: 0.25, top: -20, right: -20,
      }]} />
      <View style={[styles.orb, {
        width: 80, height: 80, backgroundColor: '#C4A8D4',
        opacity: 0.25, bottom: 24, left: -12,
      }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Svg width={114} height={87} viewBox="0 0 56 44">
            <Defs>
              <ClipPath id="pu1">
                <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
              </ClipPath>
            </Defs>
            <Ellipse cx="28" cy="22" rx="20" ry="13"
              fill="none" stroke="#C4A8D4" strokeWidth="0.4" opacity="0.5" />
            <Ellipse cx="28" cy="22" rx="17" ry="11"
              fill="none" stroke="#9B72C8" strokeWidth="0.3" opacity="0.3" />
            <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
            <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#pu1)" />
            <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#pu1)" />
            <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#pu1)" />
            <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#pu1)" />
            <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#pu1)" />
            <Circle cx="25.5" cy="23.5" r="0.6" fill="white" opacity="0.5" clipPath="url(#pu1)" />
            <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#pu1)" />
            <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#pu1)" />
            <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850"
              strokeWidth="1.4" strokeLinecap="round" />
            <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850"
              strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
            <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
          </Svg>
          {isFreemiumExpired ? (
            <View style={styles.freemiumBanner}>
              <Text style={styles.freemiumTitle}>{t.pricingUpgrade.freemiumTitre}</Text>
              <Text style={styles.freemiumMessage}>{t.pricingUpgrade.freemiumMessage}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{t.pricingUpgrade.titre}</Text>
        </View>

        <View style={styles.plansContainer}>
          {/* Plan Lifetime */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'lifetime' && styles.planCardSelected,
              { borderColor: '#3A3530' },
            ]}
            onPress={() => setSelectedPlan('lifetime')}
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
              { borderColor: '#6B3FA0' },
            ]}
            onPress={() => setSelectedPlan('annuel')}
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
              { borderColor: selectedPlan === 'mensuel' ? '#C4A8D4' : '#D4C4B8' },
            ]}
            onPress={() => setSelectedPlan('mensuel')}
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
                <Path d="M20 6L9 17L4 12" stroke="#6B3FA0" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomBlock}>
        {mustCreateAccount ? (
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
                  onPress={() => router.push('/(onboarding)/auth' as any)}
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
          <Text style={styles.btnPrimaryText}>{t.pricingUpgrade.confirmer}</Text>
        </Pressable>

        {/* Porte de reconnexion. C'est ICI qu'atterrit l'ancien abonné revenu sur
            un appareil neuf : essai anonyme démarré, bloqué au cycle 8, son
            abonnement vivant sur son ancien UID. Sans ce lien il n'avait aucune
            sortie autre que repayer. → auth.tsx → magic link → même UID →
            useSubscriptionSync repose subscription_active. */}
        <Pressable style={styles.btnReconnexion} onPress={() => router.push('/(onboarding)/auth' as any)}>
          <Text style={styles.btnReconnexionText}>{t.pricing.dejaCompte}</Text>
        </Pressable>

        <Text style={styles.bottomText}>{t.pricing.bottomText}</Text>

        {/* Concept de store natif (RevenueCat, Phase 2) : sans effet sur web, où
            le vrai chemin est le lien de reconnexion ci-dessus. Masqué pour ne pas
            semer la confusion ; code conservé pour le pipeline natif. */}
        {Platform.OS !== 'web' ? (
          <Pressable onPress={handleRestore}>
            <Text style={styles.restoreText}>{t.pricingUpgrade.restaurer}</Text>
          </Pressable>
        ) : null}
      </View>
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
  freemiumBanner: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  freemiumTitle: {
    fontFamily: 'serif',
    fontSize: 18,
    fontStyle: 'italic',
    color: '#6B3FA0',
    textAlign: 'center',
  },
  freemiumMessage: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 18,
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
  bottomText: {
    fontFamily: 'serif',
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6B3FA0',
    textAlign: 'center',
  },
  restoreText: {
    fontFamily: 'Jost',
    fontSize: 10,
    color: '#A09088',
    textDecorationLine: 'underline',
  },
});
