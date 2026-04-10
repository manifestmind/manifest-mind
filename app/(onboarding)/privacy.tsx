import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';


// Retourne les URLs légales selon la langue
function getLegalUrls(language: string) {
  switch (language) {
    case 'en':
      return {
        terms: 'https://manifestmind.github.io/manifest-mind/terms_of_use_en.html',
        privacy: 'https://manifestmind.github.io/manifest-mind/privacy_policy_en.html',
      };
    case 'es':
      return {
        terms: 'https://manifestmind.github.io/manifest-mind/terminos_uso_es.html',
        privacy: 'https://manifestmind.github.io/manifest-mind/politica_privacidad_es.html',
      };
    case 'fr':
    default:
      return {
        terms: 'https://manifestmind.github.io/manifest-mind/conditions_utilisation_fr.html',
        privacy: 'https://manifestmind.github.io/manifest-mind/politique_confidentialite_fr.html',
      };
  }
}

export default function Privacy() {
  const router = useRouter();
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleContinue() {
    if (acceptedTerms) {
      const now = new Date().toISOString();
      await AsyncStorage.setItem('legal_accepted', 'true');
      await AsyncStorage.setItem('legal_accepted_date', now);
      await AsyncStorage.setItem('user_language', 'fr');
      router.push('/(onboarding)/pricing');
    }
  }

  function handleToggleTerms() {
    setAcceptedTerms(!acceptedTerms);
  }

  async function openTerms() {
    const urls = getLegalUrls('fr');
    await WebBrowser.openBrowserAsync(urls.terms);
  }

  async function openPrivacy() {
    const urls = getLegalUrls('fr');
    await WebBrowser.openBrowserAsync(urls.privacy);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.orb, {
        width: 130,
        height: 130,
        backgroundColor: '#DDD0F8',
        opacity: 0.25,
        top: -20,
        right: -20,
      }]} />
      <View style={[styles.orb, {
        width: 80,
        height: 80,
        backgroundColor: '#B8D4B0',
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
          <Text style={styles.title}>Confidentialité</Text>
        </View>

        <View style={styles.progressBlock}>
          <Text style={styles.progressLabel}>Étape 2 / 3</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.itemsContainer}>
          <View style={styles.privacyItem}>
            <View style={[styles.itemIcon, { backgroundColor: '#DDD0F8' }]} />
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Données chiffrées</Text>
              <Text style={styles.itemText}>Progression et journal sécurisés</Text>
            </View>
          </View>

          <View style={styles.privacyItem}>
            <View style={[styles.itemIcon, { backgroundColor: '#C8E8C0' }]} />
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Jamais vendues</Text>
              <Text style={styles.itemText}>Aucun partage tiers, jamais</Text>
            </View>
          </View>

          <View style={styles.privacyItem}>
            <View style={[styles.itemIcon, { backgroundColor: '#FDE8B0' }]} />
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Suppression à tout moment</Text>
              <Text style={styles.itemText}>Depuis les Paramètres de l'app</Text>
            </View>
          </View>

          <View style={styles.privacyItem}>
            <View style={[styles.itemIcon, { backgroundColor: '#F8D0D8' }]} />
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Aucune publicité</Text>
              <Text style={styles.itemText}>Jamais de ciblage marketing</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.checkboxContainer} onPress={handleToggleTerms}>
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
            {acceptedTerms && (
              <Svg width={12} height={12} viewBox="0 0 24 24">
                <Path
                  d="M20 6L9 17L4 12"
                  stroke="white"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            )}
          </View>
          <Text style={styles.checkboxText}>
            J'accepte les{' '}
            <Text style={styles.linkText} onPress={openTerms}>
              Conditions d'utilisation
            </Text>
            {' '}et la{' '}
            <Text style={styles.linkText} onPress={openPrivacy}>
              Politique de confidentialité
            </Text>
          </Text>
        </Pressable>
      </View>

      <View style={styles.bottomBlock}>
        <Pressable
          style={[styles.btnPrimary, !acceptedTerms && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!acceptedTerms}
        >
          <Text style={styles.btnPrimaryText}>Continuer →</Text>
        </Pressable>
        <View style={styles.dotsNav}>
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={[styles.dotNav, styles.dotNavOn]} />
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
    paddingHorizontal: 20,
    paddingTop: 31,
    paddingBottom: 14,
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
    height: 4,
    backgroundColor: 'rgba(196,168,212,0.25)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    width: '66%',
    height: '100%',
    backgroundColor: '#6B3FA0',
  },
  itemsContainer: {
    width: '100%',
    gap: 12,
  },
  privacyItem: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontFamily: 'Jost',
    fontSize: 11,
    fontWeight: '500',
    color: '#2A2520',
  },
  itemText: {
    fontFamily: 'Jost',
    fontSize: 10,
    fontWeight: '300',
    color: '#7A7068',
  },
  checkboxContainer: {
    width: '100%',
    backgroundColor: 'rgba(221,208,248,0.3)',
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C4A8D4',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6B3FA0',
  },
  checkboxText: {
    flex: 1,
    fontFamily: 'Jost',
    fontSize: 10,
    fontWeight: '300',
    color: '#4A3060',
    lineHeight: 16,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  bottomBlock: {
    width: '100%',
    gap: 16,
  },
  btnPrimary: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#3A3530',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPrimaryText: {
    color: '#F0EAE0',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
