import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Parametres() {
  return (
    <View style={{ flex: 1, backgroundColor: '#F0EAE0', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <Text style={{ fontSize: 18, color: '#2A2520', fontFamily: 'serif', fontStyle: 'italic' }}>
        Page Paramètres
      </Text>
      <Pressable
        onPress={() => router.back()}
        style={{ backgroundColor: '#3A3530', padding: 12, borderRadius: 50, paddingHorizontal: 24 }}
      >
        <Text style={{ color: 'white', fontFamily: 'Jost' }}>Retour</Text>
      </Pressable>
    </View>
  );
}
