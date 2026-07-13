// Boîte de confirmation — basée sur Modal, PAS sur Alert.
//
// ⚠️ RAISON D'ÊTRE : `Alert.alert` est un no-op SILENCIEUX sur react-native-web.
// Les confirmations de parametres.tsx / profil.tsx étaient enveloppées dedans :
// la boîte ne s'affichait jamais, donc le `onPress` du bouton « Confirmer »
// n'était JAMAIS exécuté — « se déconnecter », « supprimer mon compte » et
// « réinitialiser ma progression » ne faisaient tout simplement RIEN sur web.
// (Même racine que la modale « Bon retour parmi nous » de pricing.tsx.)
//
// Toute nouvelle confirmation doit passer par ce composant, jamais par Alert.

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  titre: string;
  corps: string;
  confirmer: string;
  annuler: string;
  // true = action irréversible (déconnexion, suppression) → bouton rouge.
  destructif?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  titre,
  corps,
  confirmer,
  annuler,
  destructif = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.titre}>{titre}</Text>
          <Text style={styles.corps}>{corps}</Text>

          <Pressable
            style={[styles.btnConfirm, destructif && styles.btnConfirmDestructif]}
            onPress={onConfirm}
          >
            <Text style={styles.btnConfirmText}>{confirmer}</Text>
          </Pressable>

          <Pressable onPress={onCancel}>
            <Text style={styles.btnCancelText}>{annuler}</Text>
          </Pressable>
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
    gap: 14,
  },
  titre: {
    fontFamily: 'serif',
    fontSize: 20,
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
    backgroundColor: '#3A3530',
    alignItems: 'center',
    marginTop: 4,
  },
  btnConfirmDestructif: {
    backgroundColor: '#A03A3A',
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
});
