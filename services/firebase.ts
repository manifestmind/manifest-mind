import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDqKc6XJz70kMJp1rhhifY7cPmucCgOCSU',
  authDomain: 'manifestmind.firebaseapp.com',
  projectId: 'manifestmind',
  storageBucket: 'manifestmind.firebasestorage.app',
  messagingSenderId: '481097482104',
  appId: '1:481097482104:web:89257299c01bd0df51928d',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;