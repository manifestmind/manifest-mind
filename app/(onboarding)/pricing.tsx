import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { canPay, PADDLE_ACTIVE, STORES_ACTIVE } from '../../services/config';


export default function Pricing() {
  const router = useRouter();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState('annuel');

  function selectPlan(plan: string) {
    setSelectedPlan(plan);
  }

  async function handlePurchase() {
    // Plan "Free" — accès direct sans paiement, navigation vers l'app sans auth
    if (selectedPlan === 'free') {
      try {
        await AsyncStorage.multiSet([
          ['selected_plan', 'free'],
          ['onboarding_completed', 'true'],
        ]);
      } catch {
        // fallback silencieux — on continue la navigation
      }
      router.replace('/(app)/splash');
      return;
    }

    // Plan payant — bloqué si aucun provider de paiement actif pour la plateforme.
    if (!canPay()) {
      Alert.alert(t.pricing.disponibleProchainement);
      return;
    }

    // ── Branche WEB → Paddle (paiement post-auth) ──────────────────────────
    // Paddle nécessite un Firebase UID pour rattacher la transaction à un user
    // côté webhook. À ce stade de l'onboarding, l'utilisateur n'est pas encore
    // authentifié. On enregistre le plan choisi et on pousse vers auth.tsx ;
    // le paiement effectif aura lieu plus tard (depuis parametres.tsx ou via
    // le gate freemium à partir du cycle 8). Aucune écriture optimiste de
    // subscription_active — c'est le listener Firestore qui en sera la source.
    if (Platform.OS === 'web' && PADDLE_ACTIVE) {
      try {
        await AsyncStorage.setItem('selected_plan', selectedPlan);
      } catch {
        // fallback silencieux
      }
      router.push('/(onboarding)/auth');
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
        <Pressable style={styles.btnPrimary} onPress={handlePurchase}>
          <Text style={styles.btnPrimaryText}>
            {selectedPlan === 'free' ? t.pricing.plans.free.bouton : t.pricing.cta}
          </Text>
        </Pressable>

        <Text style={styles.bottomText}>{t.pricing.bottomText}</Text>

        <Pressable onPress={handleRestore}>
          <Text style={styles.restoreText}>{t.pricing.restaurer}</Text>
        </Pressable>

        <View style={styles.dotsNav}>
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={[styles.dotNav, styles.dotNavOn]} />
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
