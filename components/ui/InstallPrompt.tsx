// ─────────────────────────────────────────────────────────────────────────────
// ManifestMind — InstallPrompt (point 4-bis)
// ─────────────────────────────────────────────────────────────────────────────
//
// Deux bannières + une modale d'instructions iOS partagée.
//   - variant="arrival"      → bannière discrète (bas de home.tsx)
//   - variant="celebration"  → bannière engageante (celebration.tsx, 1re fois)
// La rangée « Installer l'application » de parametres.tsx réutilise
// `IosInstallModal` + `performInstall` (elle, ignore le refus : escape hatch).
//
// 🔑 Clés AsyncStorage :
//   - pwa_arrival_dismissed        → ✕ sur l'ARRIVÉE uniquement (« j'ai vu,
//                                     enlève-la ») → l'arrivée ne revient plus.
//                                     N'affecte PAS la célébration (décision :
//                                     ✕ ≠ « ne me le propose plus jamais »).
//   - pwa_celebration_prompt_shown → garde « montré une fois » de la célébration
//                                     (sinon elle reviendrait à CHAQUE fin de cycle)
// → Les deux surfaces sont INDÉPENDANTES : arrivée fermée ✕ n'empêche pas la
//   célébration de proposer une fois le 1er cycle terminé.
//
// 🛡️ 100 % web-only, purement additif : rend `null` si natif / installé /
// refusé / (célébration déjà montrée). Ne touche à aucune logique existante.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { showAuthToast } from './AuthToast';
import {
  getPlatform,
  installOfferable,
  performInstall,
  subscribeInstalled,
} from '../../services/pwaInstall';

// ─── Icône « Partager » iOS (carré + flèche vers le haut) ────────────────────
function ShareIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v11M12 3L8.5 6.5M12 3l3.5 3.5" stroke="#6B3FA0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 11H5.5A1.5 1.5 0 004 12.5v6A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5v-6A1.5 1.5 0 0018.5 11H17" stroke="#6B3FA0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Modale d'instructions iOS (réutilisée par parametres.tsx) ───────────────
export function IosInstallModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.modalTitre}>{t.install.iosTitre}</Text>
          <View style={styles.step}>
            <Text style={styles.stepNum}>1</Text>
            <View style={styles.stepShareRow}>
              <Text style={styles.stepText}>{t.install.iosEtape1}</Text>
              <ShareIcon />
            </View>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.stepText}>{t.install.iosEtape2}</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>3</Text>
            <Text style={styles.stepText}>{t.install.iosEtape3}</Text>
          </View>
          <Pressable style={styles.modalBtn} onPress={onClose}>
            <Text style={styles.modalBtnText}>{t.install.iosCompris}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type Variant = 'arrival' | 'celebration';

export default function InstallPrompt({ variant }: { variant: Variant }) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [iosModal, setIosModal] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let active = true;
    (async () => {
      if (!installOfferable()) return;
      try {
        if (variant === 'arrival') {
          // ✕ à l'arrivée = « j'ai vu, enlève-la » → ne revient plus (arrivée seule).
          if ((await AsyncStorage.getItem('pwa_arrival_dismissed')) === 'true') return;
        } else {
          // Célébration : INDÉPENDANTE du refus d'arrivée. Montrée une seule fois.
          if ((await AsyncStorage.getItem('pwa_celebration_prompt_shown')) === 'true') return;
          await AsyncStorage.setItem('pwa_celebration_prompt_shown', 'true');
        }
      } catch {
        return; // storage KO → ne rien afficher (aucun risque)
      }
      if (active) setVisible(true);
    })();
    // Masquer immédiatement si l'app est installée pendant l'affichage.
    const unsub = subscribeInstalled(() => active && setVisible(false));
    return () => { active = false; unsub(); };
  }, [variant]);

  if (Platform.OS !== 'web' || !visible) return null;

  // Textes/bouton distincts par plateforme : Android (clic → boîte native, la
  // promesse « en un geste » est vraie) vs iPhone (clic → instructions, bouton
  // honnête « Montre-moi »). 'other' (desktop) suit le libellé Android.
  const isIos = getPlatform() === 'ios';
  const label = isIos ? t.install.boutonIos : t.install.boutonAndroid;

  const install = () =>
    performInstall({
      onIosInstructions: () => setIosModal(true),
      onFallback: () => showAuthToast(t.install.androidFallback, 'info'),
    });

  if (variant === 'arrival') {
    // ✕ arrivée = refus de L'ARRIVÉE uniquement (la célébration proposera quand même).
    const dismissArrival = async () => {
      setVisible(false);
      try { await AsyncStorage.setItem('pwa_arrival_dismissed', 'true'); } catch {}
    };
    return (
      <>
        <View style={[styles.arrivalBar, { bottom: insets.bottom + 64 }]}>
          <Text style={styles.arrivalText} numberOfLines={2}>
            {isIos ? t.install.arriveeIos : t.install.arriveeAndroid}
          </Text>
          <Pressable style={styles.arrivalBtn} onPress={install}>
            <Text style={styles.arrivalBtnText}>{label}</Text>
          </Pressable>
          <Pressable style={styles.closeBtn} onPress={dismissArrival} hitSlop={10}>
            <Text style={styles.closeTxt}>✕</Text>
          </Pressable>
        </View>
        <IosInstallModal visible={iosModal} onClose={() => setIosModal(false)} />
      </>
    );
  }

  // variant === 'celebration' — « Plus tard » ferme simplement (déjà bornée à
  // une fois par pwa_celebration_prompt_shown, aucun flag de refus à poser).
  return (
    <>
      <View style={[styles.celebCardWrap, { bottom: insets.bottom + 16 }]}>
        <View style={styles.celebCard}>
          <Text style={styles.celebTitre}>{t.install.celebrationTitre}</Text>
          <Text style={styles.celebMessage}>
            {isIos ? t.install.celebrationIos : t.install.celebrationAndroid}
          </Text>
          <Pressable style={styles.celebBtn} onPress={install}>
            <Text style={styles.celebBtnText}>{label}</Text>
          </Pressable>
          <Pressable onPress={() => setVisible(false)} hitSlop={8}>
            <Text style={styles.celebPlusTard}>{t.install.plusTard}</Text>
          </Pressable>
        </View>
      </View>
      <IosInstallModal visible={iosModal} onClose={() => setIosModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  // ── Bannière arrivée (discrète, bas, au-dessus de la navbar) ──
  arrivalBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2A2520',
    borderRadius: 14,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 8,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  arrivalText: {
    flex: 1,
    fontFamily: 'Jost',
    fontSize: 12.5,
    color: '#F0EAE0',
    lineHeight: 17,
  },
  arrivalBtn: {
    backgroundColor: '#6B3FA0',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  arrivalBtnText: {
    fontFamily: 'Jost',
    fontSize: 12.5,
    fontWeight: '600',
    color: '#F0EAE0',
    letterSpacing: 0.5,
  },
  closeBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  closeTxt: { color: '#9A8878', fontSize: 15 },

  // ── Bannière célébration (engageante, carte basse) ──
  celebCardWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
  },
  celebCard: {
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
  celebTitre: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 19,
    color: '#2A2520',
    textAlign: 'center',
  },
  celebMessage: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 19,
  },
  celebBtn: {
    width: '100%',
    backgroundColor: '#6B3FA0',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  celebBtnText: {
    fontFamily: 'Jost',
    fontSize: 14,
    fontWeight: '600',
    color: '#F0EAE0',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  celebPlusTard: {
    fontFamily: 'Jost',
    fontSize: 12.5,
    color: '#6B3FA0',
    textDecorationLine: 'underline',
    marginTop: 2,
  },

  // ── Modale iOS ──
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
    gap: 16,
  },
  modalTitre: {
    fontFamily: 'serif',
    fontSize: 20,
    fontStyle: 'italic',
    color: '#2A2520',
    textAlign: 'center',
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: {
    fontFamily: 'Jost',
    fontSize: 13,
    fontWeight: '600',
    color: '#F0EAE0',
    backgroundColor: '#6B3FA0',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepShareRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepText: {
    flexShrink: 1,
    fontFamily: 'Jost',
    fontSize: 13.5,
    color: '#3A3530',
    lineHeight: 19,
  },
  modalBtn: {
    backgroundColor: '#3A3530',
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  modalBtnText: {
    color: '#F0EAE0',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
