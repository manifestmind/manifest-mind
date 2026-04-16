import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';

export default function Name() {
  const router = useRouter();
  const t = useTranslation();
  const { edit } = useLocalSearchParams();
  const isEdit = edit === 'true';
  const [name, setName] = useState('');

  useEffect(() => {
    if (isEdit) {
      AsyncStorage.getItem('user_name').then(n => { if (n) setName(n); });
    }
  }, []);

  async function handleSave() {
    if (!name.trim()) return;
    await AsyncStorage.setItem('user_name', name.trim());
    if (isEdit) {
      router.back();
    } else {
      router.replace('/(app)/home' as any);
    }
  }

  return (
    <View style={styles.container}>
      {/* Œil SVG statique */}
      <Svg width={180} height={138} viewBox="0 0 56 44" style={{ overflow: 'visible' }}>
        <Defs>
          <ClipPath id="nc1">
            <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
          </ClipPath>
        </Defs>
        <Ellipse cx="28" cy="22" rx="20" ry="13" fill="none" stroke="#C4A8D4" strokeWidth="0.4" opacity="0.5" />
        <Ellipse cx="28" cy="22" rx="17" ry="11" fill="none" stroke="#9B72C8" strokeWidth="0.3" opacity="0.3" />
        <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
        <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#nc1)" />
        <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#nc1)" />
        <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#nc1)" />
        <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#nc1)" />
        <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#nc1)" />
        <Circle cx="25.5" cy="23.5" r="0.6" fill="white" opacity="0.5" clipPath="url(#nc1)" />
        <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#nc1)" />
        <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#nc1)" />
        <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
        <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
        <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
        <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
      </Svg>

      <Text style={styles.title}>{t.name.titre}</Text>
      <TextInput
        style={styles.input}
        placeholder={t.name.placeholder}
        placeholderTextColor="#B0A898"
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <Pressable
        style={[styles.btn, !name.trim() && styles.btnDisabled]}
        onPress={handleSave}
        disabled={!name.trim()}
      >
        <Text style={styles.btnText}>{isEdit ? t.name.btnEdit : t.name.btnNouvel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EAE0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 24,
    fontStyle: 'italic',
    color: '#2A2520',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#E8E0D4',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2A2520',
    textAlign: 'center',
    fontFamily: 'Jost',
  },
  btn: {
    width: '100%',
    backgroundColor: '#3A3530',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: '#F0EAE0',
    fontFamily: 'Jost',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
