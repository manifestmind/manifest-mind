// ManifestMind — fenêtre de l'offre annuelle spéciale (version 1.1.0)
// ─────────────────────────────────────────────────────────────────────────────
// Présentation imposée (décision utilisatrice 2026-11-24) : « Offre annuelle
// spéciale : {prix}/an », prix lu dans la console — SANS prix barré, ni
// pourcentage, ni urgence. C'est un point d'achat : durée, renouvellement
// automatique et liens légaux y figurent (Apple 3.1.2, Google Play).

import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../src/hooks/useTranslation';

type Props = {
  visible: boolean;
  prix: string;
  onProfiter: () => void;
  onFermer: () => void;
};

export default function OffreSpecialeModal({ visible, prix, onProfiter, onFermer }: Props) {
  const t = useTranslation();
  const o = t.pricing.offre;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFermer}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.etoile}>✦</Text>
          <Text style={styles.titre}>{o.phrase.replace('{prix}', prix)}</Text>
          <Text style={styles.corps}>{o.texte}</Text>

          <Pressable style={styles.btnConfirm} onPress={onProfiter}>
            <Text style={styles.btnConfirmText}>{o.profiter}</Text>
          </Pressable>

          <Pressable onPress={onFermer}>
            <Text style={styles.btnCancelText}>{o.nonMerci}</Text>
          </Pressable>

          <Text style={styles.renouvellement}>{t.pricing.renouvellementAuto}</Text>
          <View style={styles.legalRow}>
            <Pressable onPress={() => { Linking.openURL(t.legal.privacyUrl).catch(() => {}); }}>
              <Text style={styles.legalLink}>{t.parametres.legalLinks.confidentialite}</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable onPress={() => { Linking.openURL(t.legal.termsUrl).catch(() => {}); }}>
              <Text style={styles.legalLink}>{t.parametres.legalLinks.conditions}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    gap: 12,
  },
  etoile: { fontSize: 22, color: '#6B3FA0' },
  titre: {
    fontFamily: 'serif',
    fontSize: 21,
    fontStyle: 'italic',
    color: '#2A2520',
    textAlign: 'center',
    width: '100%',
  },
  corps: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#3A3530',
    textAlign: 'center',
    lineHeight: 20,
    width: '100%',
  },
  btnConfirm: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#6B3FA0',
    alignItems: 'center',
    marginTop: 4,
  },
  btnConfirmText: {
    color: '#F0EAE0',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  btnCancelText: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#6B3FA0',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  renouvellement: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#7A6E64',
    textAlign: 'center',
    width: '100%',
  },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legalLink: { fontFamily: 'Jost', fontSize: 11, color: '#7A6E64', textDecorationLine: 'underline' },
  legalDot: { fontSize: 11, color: '#A09088' },
});
