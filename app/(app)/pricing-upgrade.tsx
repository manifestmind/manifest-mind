import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { FREE_CYCLES, STORES_ACTIVE } from '../../services/config';

export default function PricingUpgrade() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState('annuel');
  const [isFreemiumExpired, setIsFreemiumExpired] = useState(false);

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

  async function handlePurchase() {
    if (!STORES_ACTIVE) {
      Alert.alert(t.pricing.disponibleProchainement);
      return;
    }
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
        <Pressable style={styles.btnPrimary} onPress={handlePurchase}>
          <Text style={styles.btnPrimaryText}>{t.pricingUpgrade.confirmer}</Text>
        </Pressable>

        <Text style={styles.bottomText}>{t.pricing.bottomText}</Text>

        <Pressable onPress={handleRestore}>
          <Text style={styles.restoreText}>{t.pricingUpgrade.restaurer}</Text>
        </Pressable>
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
});
