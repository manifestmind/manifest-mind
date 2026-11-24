// ManifestMind — outil « Aperçu d'un cycle » (APK DE TEST UNIQUEMENT)
// ─────────────────────────────────────────────────────────────────────────────
//
// Sert à vérifier à l'œil, sur téléphone, les cycles où des textes étaient
// coupés ou superposés : on choisit un numéro de cycle, puis on ouvre les VRAIS
// écrans (affirmation, action, visualisation, accueil) sur ce cycle.
//
// 🔒 ABSENT DES VERSIONS PUBLIÉES : activé seulement si la variable de
// construction EXPO_PUBLIC_PREVIEW_TOOLS vaut 'true' — posée UNIQUEMENT dans le
// profil `preview` d'eas.json (APK de test). Elle est remplacée par sa valeur au
// moment de la construction : dans le site et les versions des boutiques, le
// test devient `false` et tout le code ci-dessous est retiré par la
// minification. Vérifié par recherche de « APERCU_CYCLE_OUTIL » dans les
// fichiers produits (attendu : 0).
//
// Le cycle d'origine est sauvegardé et restauré par « Revenir à mon cycle ».

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const ENABLED = process.env.EXPO_PUBLIC_PREVIEW_TOOLS === 'true';

const BACKUP_KEY = 'apercu_cycle_sauvegarde';
const KEYS = ['current_cycle', 'current_theme', 'cycle_completed', 'cycle_step_status', 'next_cycle_time'];
const STEPS0 = { opening: true, affirmation: false, action_easy: false, action_hard: false, visualisation: false, journal: false, vision_board: false };

function CyclePreviewImpl() {
  const MARK = 'APERCU_CYCLE_OUTIL';
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState('');

  async function goTo(route: string) {
    const n = parseInt(value, 10);
    if (!(n >= 1 && n <= 365)) { setMsg('Cycle entre 1 et 365'); return; }
    if (!(await AsyncStorage.getItem(BACKUP_KEY))) {
      const saved = await AsyncStorage.multiGet(KEYS);
      await AsyncStorage.setItem(BACKUP_KEY, JSON.stringify(saved));
    }
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    await AsyncStorage.multiSet([
      ['current_cycle', String(n)],
      ['current_theme', String(((n - 1) % 7) + 1)],
      ['cycle_completed', 'false'],
      ['cycle_step_status', JSON.stringify(STEPS0)],
      ['next_cycle_time', String(midnight.getTime())],
    ]);
    setOpen(false);
    router.push(route as any);
  }

  async function restore() {
    const raw = await AsyncStorage.getItem(BACKUP_KEY);
    if (raw) {
      const saved: [string, string | null][] = JSON.parse(raw);
      await AsyncStorage.multiRemove(saved.filter(([, v]) => v === null).map(([k]) => k));
      await AsyncStorage.multiSet(saved.filter(([, v]) => v !== null) as [string, string][]);
      await AsyncStorage.removeItem(BACKUP_KEY);
      setMsg('Cycle d\'origine restauré');
    } else {
      setMsg('Rien à restaurer');
    }
  }

  return (
    <>
      <Pressable style={styles.row} onPress={() => { setMsg(''); setOpen(true); }} accessibilityHint={MARK}>
        <Text style={styles.rowText}>🛠 Aperçu d'un cycle (APK de test)</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.titre}>Aperçu d'un cycle</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              keyboardType="number-pad"
              placeholder="N° de cycle (1-365)"
              maxLength={3}
            />
            {msg ? <Text style={styles.msg}>{msg}</Text> : null}
            {[
              ['Affirmation', '/(app)/affirmation'],
              ['Action', '/(app)/action'],
              ['Visualisation', '/(app)/visualisation'],
              ['Accueil', '/(app)/home'],
            ].map(([label, route]) => (
              <Pressable key={route} style={styles.btn} onPress={() => goTo(route)}>
                <Text style={styles.btnText}>{label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.btnAlt} onPress={restore}>
              <Text style={styles.btnAltText}>Revenir à mon cycle</Text>
            </Pressable>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.close}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default ENABLED ? CyclePreviewImpl : function CyclePreviewOff() { return null; };

// Styles créés SEULEMENT si l'outil est actif : sinon aucune règle de style n'est
// ajoutée au site ni aux apps publiées.
const styles = ENABLED ? StyleSheet.create({
  row: { marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B5547A' },
  rowText: { fontSize: 13, color: '#B5547A', textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(26,14,48,0.55)', justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#F0EAE0', borderRadius: 18, padding: 20, gap: 10 },
  titre: { fontSize: 18, color: '#2A2520', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#C4A8D4', borderRadius: 10, padding: 10, fontSize: 16, textAlign: 'center', backgroundColor: 'white' },
  msg: { fontSize: 12, color: '#B5547A', textAlign: 'center' },
  btn: { backgroundColor: '#6B3FA0', borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: '#F0EAE0', fontSize: 14 },
  btnAlt: { borderWidth: 1, borderColor: '#6B3FA0', borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  btnAltText: { color: '#6B3FA0', fontSize: 14 },
  close: { fontSize: 13, color: '#6B3FA0', textAlign: 'center', textDecorationLine: 'underline' },
}) : ({} as any);
