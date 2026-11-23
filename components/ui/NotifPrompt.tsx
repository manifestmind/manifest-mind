// ManifestMind — carte d'autorisation des notifications (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
//
// NATIF UNIQUEMENT (rend null sur web, où il n'y a pas de notifications).
//
//   - variant="demande"  → home.tsx : UNE fois, à la première arrivée sur
//     l'accueil d'une personne abonnée. Une phrase d'explication, puis la
//     fenêtre système. « Plus tard » = refus doux → reproposition à J+3.
//   - variant="relance"  → celebration.tsx : si les notifications sont coupées,
//     3 fois au maximum (J+3, +14 j, +30 j), jamais plus. « Ne plus me
//     demander » arrête tout. Le bouton mène aux réglages du téléphone (ou
//     repose la question système quand Android l'autorise encore).
//
// Jamais bloquante : une carte en bas d'écran, que l'on ferme d'un geste.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { isSubscriber } from '../../services/access';
import {
  NOTIF_KEYS,
  markRepromptShown,
  notificationsGranted,
  openNotificationSettings,
  requestNotificationPermission,
  shouldReprompt,
  stopReprompts,
} from '../../services/notifications';

type Variant = 'demande' | 'relance';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function NotifPrompt({ variant }: { variant: Variant }) {
  const t = useTranslation().notifications;
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    (async () => {
      try {
        if (variant === 'demande') {
          if ((await AsyncStorage.getItem(NOTIF_KEYS.permissionAsked)) === 'true') return;
          if (!(await isSubscriber())) return; // « après l'achat » seulement
          const p = await Notifications.getPermissionsAsync();
          if (p.status === 'granted') {
            // Déjà accordées (ex. mise à jour d'une installation existante).
            await AsyncStorage.setItem(NOTIF_KEYS.permissionAsked, 'true');
            return;
          }
          if (active) setVisible(true);
        } else {
          if (!(await shouldReprompt())) return;
          await markRepromptShown(); // une seule fois par échéance
          if (active) setVisible(true);
        }
      } catch {
        // stockage ou système indisponible → rien à afficher
      }
    })();
    // Retour des réglages avec les notifications réactivées → la carte s'efface.
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') notificationsGranted().then((g) => { if (g && active) setVisible(false); });
    });
    return () => { active = false; sub.remove(); };
  }, [variant]);

  if (Platform.OS === 'web' || !visible) return null;

  async function activer() {
    setVisible(false);
    await requestNotificationPermission(); // pose aussi la reproposition à J+3 si refus
  }

  async function plusTardDemande() {
    setVisible(false);
    try {
      await AsyncStorage.multiSet([
        [NOTIF_KEYS.permissionAsked, 'true'],
        [NOTIF_KEYS.repromptNext, String(Date.now() + 3 * DAY_MS)],
      ]);
    } catch {}
  }

  async function ouvrirReglages() {
    setVisible(false);
    await openNotificationSettings();
  }

  async function nePlusDemander() {
    setVisible(false);
    await stopReprompts();
  }

  const demande = variant === 'demande';
  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 16 }]}>
      <View style={styles.card}>
        <Text style={styles.titre}>{demande ? t.demandeTitre : t.relanceTitre}</Text>
        <Text style={styles.message}>{demande ? t.demandeTexte : t.relanceTexte}</Text>
        <Pressable style={styles.btn} onPress={demande ? activer : ouvrirReglages}>
          <Text style={styles.btnText}>{demande ? t.demandeActiver : t.ouvrirReglages}</Text>
        </Pressable>
        <Pressable onPress={demande ? plusTardDemande : () => setVisible(false)} hitSlop={8}>
          <Text style={styles.lien}>{t.plusTard}</Text>
        </Pressable>
        {!demande ? (
          <Pressable onPress={nePlusDemander} hitSlop={8}>
            <Text style={styles.lienDiscret}>{t.nePlusDemander}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// Même apparence que la carte d'installation de la célébration (InstallPrompt).
const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
  },
  card: {
    backgroundColor: '#F0EAE0',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  titre: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 19,
    color: '#2A2520',
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 19,
  },
  btn: {
    width: '100%',
    backgroundColor: '#6B3FA0',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  btnText: {
    fontFamily: 'Jost',
    fontSize: 14,
    fontWeight: '600',
    color: '#F0EAE0',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  lien: {
    fontFamily: 'Jost',
    fontSize: 12.5,
    color: '#6B3FA0',
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  lienDiscret: {
    fontFamily: 'Jost',
    fontSize: 11.5,
    color: '#8A7E74',
  },
});
