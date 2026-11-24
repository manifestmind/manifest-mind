// ManifestMind — écran « Parcours accompli » (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// Atteint quand le cycle 365 est terminé (bouton de l'accueil, puis redirection
// automatique au premier minuit). Remplace l'ancienne boucle où le cycle 365 se
// rejouait indéfiniment.
//
// « Commencer un nouveau tour » (seulement à partir de minuit, comme tout cycle) :
//   - retour au cycle 1, même contenu des 365 jours, tour + 1 ;
//   - points du tour remis à 0 (la jauge du tour terminé reste affichée pleine,
//     cf. home/profil) ;
//   - journal du tour précédent EFFACÉ DÉFINITIVEMENT (stocké seulement sur
//     l'appareil → irrécupérable) : avertissement obligatoire avant, avec la
//     possibilité d'exporter ses données d'abord ;
//   - photos du vision board, prénom, réglages : conservés.
//
// Écran protégé par le gate de (app)/_layout.tsx (réservé aux abonnés).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { showAuthToast } from '../../components/ui/AuthToast';
import { exporterDonnees } from '../../services/dataExport';
import { rescheduleAll } from '../../services/notifications';
import { CYCLES_PER_TOUR, readTour, TOUR_KEY } from '../../services/levels';
import Orbe from '../../components/ui/Orbe';

const INITIAL_STEP_STATUS = {
  opening: false,
  affirmation: false,
  action_easy: false,
  action_hard: false,
  visualisation: false,
  journal: false,
  vision_board: false,
};
const ZERO_EARNED = { opening: 0, affirmation: 0, action_easy: 0, action_hard: 0, visualisation: 0, journal: 0, vision_board: 0 };

export default function ParcoursAccompli() {
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { lang } = useLanguage();
  const [ready, setReady] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const [points, setPoints] = useState(0);
  const [journaux, setJournaux] = useState(0);
  const [tour, setTour] = useState(1);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [[, cycleRaw], [, completed], [, nextRaw], [, pointsRaw]] = await AsyncStorage.multiGet([
          'current_cycle', 'cycle_completed', 'next_cycle_time', 'points_total',
        ]);
        const cycle = parseInt(cycleRaw || '1', 10) || 1;
        // Accès direct alors que le tour n'est pas fini → retour à l'accueil.
        if (!(cycle >= CYCLES_PER_TOUR && completed === 'true')) {
          router.replace('/(app)/home' as any);
          return;
        }
        setCanStart(Date.now() >= Number(nextRaw || 0));
        setPoints(parseInt(pointsRaw || '0', 10) || 0);
        setTour(await readTour());
        const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('journal_cycle_'));
        const entries = await AsyncStorage.multiGet(keys);
        setJournaux(entries.filter(([, v]) => {
          try { const d = JSON.parse(v || '{}'); return !d.skipped && !!d.text; } catch { return false; }
        }).length);
        setReady(true);
      } catch {
        router.replace('/(app)/home' as any);
      }
    })();
  }, []);

  async function exporter() {
    const res = await exporterDonnees(lang);
    showAuthToast(res.ok ? t.parametres.compte.exportOk : t.parametres.compte.exportErreur, res.ok ? 'success' : 'error');
  }

  async function startNewTour() {
    if (busy) return;
    setBusy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      // Journal du tour précédent : effacé définitivement (prévenu juste avant).
      const journalKeys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('journal_cycle_'));
      if (journalKeys.length) await AsyncStorage.multiRemove(journalKeys);
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      await AsyncStorage.multiSet([
        [TOUR_KEY, String(tour + 1)],
        ['current_cycle', '1'],
        ['current_theme', '1'],
        ['cycle_completed', 'false'],
        ['cycle_points', '0'],
        ['points_total', '0'],
        ['next_cycle_time', String(midnight.getTime())],
        ['cycle_step_status', JSON.stringify(INITIAL_STEP_STATUS)],
        ['cycle_earned_points', JSON.stringify(ZERO_EARNED)],
      ]);
      rescheduleAll(); // affirmation du cycle 1, rappel du jour (natif ; rien sur web)
    } catch {
      // stockage indisponible : on retourne quand même à l'accueil
    }
    setConfirmVisible(false);
    router.replace('/(app)/home' as any);
  }

  if (!ready) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Orbe style={[styles.orb, { width: 160, height: 160, backgroundColor: '#DDD0F8', top: -40, right: -40 }]} />
      <Orbe style={[styles.orb, { width: 90, height: 90, backgroundColor: '#B8D4B0', bottom: 80, left: -24 }]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 24, 48), paddingBottom: Math.max(insets.bottom + 24, 32) }]}
      >
        <Text style={styles.titre}>{t.parcours.titre}</Text>

        <View style={styles.bilan}>
          <View style={styles.bilanItem}>
            <Text style={styles.bilanValeur}>{CYCLES_PER_TOUR}</Text>
            <Text style={styles.bilanLabel}>{t.parcours.bilanCycles}</Text>
          </View>
          <View style={styles.bilanItem}>
            <Text style={styles.bilanValeur}>{points.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR')}</Text>
            <Text style={styles.bilanLabel}>{t.parcours.bilanPoints}</Text>
          </View>
          <View style={styles.bilanItem}>
            <Text style={styles.bilanValeur}>{journaux}</Text>
            <Text style={styles.bilanLabel}>{t.parcours.bilanJournaux}</Text>
          </View>
        </View>

        <Text style={styles.message}>{t.parcours.message}</Text>

        {canStart ? (
          <Pressable style={styles.btn} onPress={() => setConfirmVisible(true)}>
            <Text style={styles.btnText}>{t.parcours.commencer}</Text>
          </Pressable>
        ) : (
          <View style={[styles.btn, { opacity: 0.5 }]}>
            <Text style={styles.btnText}>{t.parcours.commenceDemain}</Text>
          </View>
        )}

        {/* Avant minuit, on peut revenir à l'accueil. Après minuit, l'accueil
            renvoie ici (le tour est fini) : le lien n'aurait plus de sens. */}
        {!canStart ? (
          <Pressable onPress={() => router.replace('/(app)/home' as any)} hitSlop={8}>
            <Text style={styles.lien}>{t.commun.navbar.accueil}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Avertissement : effacement définitif du journal du tour précédent. */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.cardTitre}>{t.parcours.avertTitre}</Text>
            <Text style={styles.cardTexte}>{t.parcours.avertTexte}</Text>
            <Pressable style={styles.btnSecondaire} onPress={exporter}>
              <Text style={styles.btnSecondaireText}>{t.parcours.exporter}</Text>
            </Pressable>
            <Pressable style={[styles.btn, busy && { opacity: 0.5 }]} onPress={startNewTour} disabled={busy}>
              <Text style={styles.btnText}>{t.parcours.confirmer}</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmVisible(false)} hitSlop={8}>
              <Text style={styles.lien}>{t.commun.annuler}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EAE0' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.25 },
  content: { paddingHorizontal: 24, gap: 20, alignItems: 'center' },
  titre: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 30,
    lineHeight: 40,
    color: '#6B3FA0',
    textAlign: 'center',
  },
  bilan: { flexDirection: 'row', width: '100%', gap: 8 },
  bilanItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 2,
  },
  bilanValeur: { fontFamily: 'serif', fontSize: 22, lineHeight: 30, color: '#C89A30' },
  bilanLabel: { fontFamily: 'Jost', fontSize: 11, lineHeight: 15, color: '#7A7068', textAlign: 'center' },
  message: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 26,
    color: '#3A3530',
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    backgroundColor: '#6B3FA0',
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'Jost',
    fontSize: 13,
    fontWeight: '600',
    color: '#F0EAE0',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  btnSecondaire: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#6B3FA0',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  btnSecondaireText: {
    fontFamily: 'Jost',
    fontSize: 13,
    fontWeight: '500',
    color: '#6B3FA0',
    textAlign: 'center',
  },
  lien: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#6B3FA0',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,14,48,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#F0EAE0',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 22,
    gap: 14,
    alignItems: 'center',
  },
  cardTitre: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 20,
    lineHeight: 28,
    color: '#2A2520',
    textAlign: 'center',
  },
  cardTexte: {
    fontFamily: 'Jost',
    fontSize: 13.5,
    lineHeight: 20,
    color: '#3A3530',
    textAlign: 'center',
  },
});
