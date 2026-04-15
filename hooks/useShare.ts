import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function shareProgress() {
  try {
    const cycleNumber = parseInt(
      await AsyncStorage.getItem('current_cycle') || '1'
    );
    const pointsTotal = parseInt(
      await AsyncStorage.getItem('points_total') || '0'
    );

    const pct = (pointsTotal / 36500) * 100;
    let level = 'Éveillé·e';
    if (pct >= 75) level = 'Manifestant·e';
    else if (pct >= 50) level = 'Rayonnant·e';
    else if (pct >= 25) level = 'Floraison';

    const message =
      `👁✨ ManifestMind\n\n` +
      `🔮 Cycle ${cycleNumber} / 365 complété\n` +
      `🌸 Niveau ${level}\n` +
      `⭐ ${pointsTotal} pts / 36 500\n\n` +
      `Je transforme ma vie\n` +
      `un cycle à la fois ✦\n\n` +
      `🔗 manifest-mind.app`;

    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      const fileUri = FileSystem.cacheDirectory + 'progression.txt';
      await FileSystem.writeAsStringAsync(fileUri, message);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Partager ma progression',
        UTI: 'public.plain-text',
      });
    } else {
      await Clipboard.setStringAsync(message);
      Alert.alert(
        'Copié !',
        'Ton message a été copié dans le presse-papier.'
      );
    }
  } catch (error) {
    console.error('Erreur partage:', error);
  }
}
