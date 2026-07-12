import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Persistance de l'auth choisie selon la plateforme :
//  - Web   : getAuth() → persistance browserLocalPersistence par défaut.
//            getReactNativePersistence n'existe PAS dans le bundle web de
//            firebase/auth, d'où le require() dynamique côté natif uniquement
//            (jamais évalué quand Platform.OS === 'web').
//  - Natif : initializeAuth + getReactNativePersistence(AsyncStorage).
//            Note : AsyncStorage n'est pas chiffré sur Android (lisible sur
//            appareil rooté). Pour de l'auth sensible en prod, envisager
//            expo-secure-store.
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // require dynamique : la ligne n'est atteinte que sur natif, donc
  // getReactNativePersistence n'est jamais résolu dans le bundle web.
  const { getReactNativePersistence } = require('@firebase/auth');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;