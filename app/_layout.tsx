import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { auth } from '../services/firebase';
import { useSubscriptionSync } from '../hooks/useSubscriptionSync';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import { useTranslation } from '../src/hooks/useTranslation';

function SubscriptionSync() {
  useSubscriptionSync();
  return null;
}

function DeepLinkHandler() {
  const t = useTranslation();

  useEffect(() => {
    async function handleAuthLink(url: string) {
      if (!isSignInWithEmailLink(auth, url)) return;
      try {
        const email = await AsyncStorage.getItem('emailForSignIn');
        if (!email) {
          Alert.alert(t.auth.alertLienEmailManquant.titre, t.auth.alertLienEmailManquant.corps);
          return;
        }
        await signInWithEmailLink(auth, email, url);
        await AsyncStorage.removeItem('emailForSignIn');

        // Initialiser le cycle si c'est la première connexion
        const cycle = await AsyncStorage.getItem('current_cycle');
        if (!cycle) {
          await AsyncStorage.multiSet([
            ['current_cycle', '1'],
            ['current_theme', '1'],
            ['cycle_completed', 'false'],
            ['cycle_points', '0'],
            ['points_total', '0'],
            ['cycle_step_status', JSON.stringify({
              opening: false, affirmation: false,
              action_easy: false, action_hard: false,
              visualisation: false, journal: false, vision_board: false,
            })],
            ['cycle_earned_points', JSON.stringify({
              opening: 0, affirmation: 0,
              action_easy: 0, action_hard: 0,
              visualisation: 0, journal: 0, vision_board: 0,
            })],
          ]);
        }

        await AsyncStorage.setItem('onboarding_completed', 'true');
        router.replace('/(app)/splash' as any);
      } catch (error: any) {
        const code: string = error?.code ?? '';
        if (code === 'auth/expired-action-code') {
          Alert.alert(t.auth.alertLienExpire.titre, t.auth.alertLienExpire.corps);
        } else if (code === 'auth/invalid-action-code' || code === 'auth/invalid-email') {
          Alert.alert(t.auth.alertLienInvalide.titre, t.auth.alertLienInvalide.corps);
        } else if (code === 'auth/network-request-failed') {
          Alert.alert(t.auth.alertErreurReseau.titre, t.auth.alertErreurReseau.corps);
        } else if (code === 'auth/user-not-found') {
          Alert.alert(t.auth.alertUtilisateurIntrouvable.titre, t.auth.alertUtilisateurIntrouvable.corps);
        } else {
          Alert.alert(t.auth.alertLienInvalide.titre, t.auth.alertLienInvalide.corps);
        }
      }
    }

    // Démarrage à froid — app ouverte via le lien
    Linking.getInitialURL().then(url => { if (url) handleAuthLink(url); });

    // App déjà ouverte, reçoit le lien
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthLink(url));
    return () => sub.remove();
  }, [t]);

  return null;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <DeepLinkHandler />
      <SubscriptionSync />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 300 }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)/splash"        options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)/home"          options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)/affirmation"   options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/action"        options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/visualisation" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/journal"       options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/vision-board"  options={{ animation: 'slide_from_right', animationDuration: 280 }} />
        <Stack.Screen name="(app)/celebration"   options={{ animation: 'slide_from_bottom', animationDuration: 400 }} />
        <Stack.Screen name="(app)/profil"        options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)/parametres"    options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)/name"          options={{ animation: 'fade' }} />
      </Stack>
    </LanguageProvider>
  );
}
