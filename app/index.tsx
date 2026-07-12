import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { isSignInWithEmailLink } from 'firebase/auth';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { auth } from '../services/firebase';
import { INITIAL_WEB_HREF } from '../services/initialUrl';

export default function Index() {
  useEffect(() => {
    // WEB : si l'URL d'ORIGINE (capturée au module load) est un lien de
    // connexion email, NE PAS router ici — le DeepLinkHandler (_layout)
    // finalise la session puis route. On teste INITIAL_WEB_HREF et non
    // window.location.href, déjà réécrit en /auth à ce stade (le "flash").
    if (
      Platform.OS === 'web' &&
      INITIAL_WEB_HREF &&
      isSignInWithEmailLink(auth, INITIAL_WEB_HREF)
    ) {
      if (__DEV__) console.log('[index] magic link (INITIAL_WEB_HREF) → routing délégué au DeepLinkHandler');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const done = await AsyncStorage.getItem('onboarding_completed');
        if (__DEV__) console.log('[index] onboarding_completed =', done);
        if (!done) {
          router.replace('/(onboarding)/welcome' as any);
        } else {
          router.replace('/(app)/splash' as any);
        }
      } catch {
        router.replace('/(onboarding)/welcome' as any);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F0EAE0' }} />
  );
}
