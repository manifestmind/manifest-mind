import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text } from 'react-native';

// Toast global d'authentification — visible sur web ET natif.
// Remplace Alert.alert, qui est un no-op SILENCIEUX sur react-native-web
// (aucune modale, aucun log) : les erreurs d'auth passaient donc inaperçues
// pendant les tests web. On expose une fonction impérative showAuthToast()
// appelable depuis n'importe où (écran auth, handler deep-link de _layout),
// et un host <AuthToastHost/> monté une seule fois au niveau racine.

type ToastKind = 'error' | 'success' | 'info';
type ToastPayload = { message: string; kind: ToastKind; id: number };

// Pont module-level entre l'appel impératif et le host monté.
let emit: ((p: ToastPayload) => void) | null = null;
let counter = 0;

export function showAuthToast(message: string, kind: ToastKind = 'info') {
  counter += 1;
  // Si le host n'est pas encore monté, on ignore silencieusement (cas rare :
  // le host est monté au root avant tout écran interactif).
  emit?.({ message, kind, id: counter });
}

const COLORS: Record<ToastKind, { bg: string; fg: string }> = {
  error: { bg: '#7A2540', fg: '#FDE8EC' },
  success: { bg: '#2C5A3A', fg: '#E8F5EC' },
  info: { bg: '#3A2850', fg: '#FDE8B0' },
};

export function AuthToastHost() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  // S'abonne au pont impératif au montage.
  useEffect(() => {
    emit = (p) => setToast(p);
    return () => {
      emit = null;
    };
  }, []);

  // Fade-in puis auto-hide après 5 s (assez long pour lire une erreur en test).
  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => setToast(null));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, opacity]);

  if (!toast) return null;
  const c = COLORS[toast.kind];

  return (
    <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="box-none">
      <Pressable
        onPress={() => setToast(null)}
        style={[styles.toast, { backgroundColor: c.bg }]}
      >
        <Text style={[styles.text, { color: c.fg }]}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 480,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
