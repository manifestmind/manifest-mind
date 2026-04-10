import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function Index() {
  useEffect(() => {
    const timer = setTimeout(async () => {
      const done = await AsyncStorage.getItem('onboarding_completed');
      if (!done) {
        router.replace('/(onboarding)/welcome' as any);
      } else {
        router.replace('/(app)/splash' as any);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F0EAE0' }} />
  );
}
