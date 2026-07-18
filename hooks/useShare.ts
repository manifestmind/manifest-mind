import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../src/i18n/translations';
import { showAuthToast } from '../components/ui/AuthToast';

export async function shareProgress() {
  try {
    const cycleNumber = parseInt(
      await AsyncStorage.getItem('current_cycle') || '1'
    );
    const pointsTotal = parseInt(
      await AsyncStorage.getItem('points_total') || '0'
    );
    const langRaw = await AsyncStorage.getItem('user_language');
    const lang = (langRaw === 'en' || langRaw === 'es') ? langRaw : 'fr';
    const t = translations[lang];

    const pct = (pointsTotal / 36500) * 100;
    // Annotation explicite : sans elle, TS fige le type sur le littéral de
    // `eveil` et refuse les 3 autres niveaux (aucun impact au runtime).
    let level: string = t.niveaux.eveil;
    if (pct >= 75) level = t.niveaux.manifestation;
    else if (pct >= 50) level = t.niveaux.expansion;
    else if (pct >= 25) level = t.niveaux.ancrage;

    const message = t.share.message(cycleNumber, level, pointsTotal);

    // WEB : expo-sharing partage un FICHIER, or FileSystem.writeAsStringAsync
    // n'existe pas sur web → crash (masqué autrefois par un Alert.alert muet).
    // Le partage utile sur web = le TEXTE + le lien manifest-mind.app à coller
    // ailleurs → on copie dans le presse-papier + toast VISIBLE.
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(message);
      showAuthToast(`${t.share.copieeTitre} — ${t.share.copieCorps}`, 'success');
      return;
    }

    // NATIF (Phase 2) — flux inchangé : fichier temporaire + feuille de partage.
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      const fileUri = FileSystem.cacheDirectory + 'progression.txt';
      await FileSystem.writeAsStringAsync(fileUri, message);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: t.share.dialogTitle,
        UTI: 'public.plain-text',
      });
    } else {
      await Clipboard.setStringAsync(message);
      showAuthToast(`${t.share.copieeTitre} — ${t.share.copieCorps}`, 'success');
    }
  } catch (error) {
    if (__DEV__) console.error('Erreur partage:', error);
    const langRaw = await AsyncStorage.getItem('user_language').catch(() => null);
    const lang = (langRaw === 'en' || langRaw === 'es') ? langRaw : 'fr';
    const t = translations[lang];
    showAuthToast(`${t.share.erreurTitre} — ${t.share.erreurCorps}`, 'error');
  }
}
