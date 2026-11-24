import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 1.1.0 — coordination avec CongratulationsToast : les deux messages
// s'affichaient AU MÊME ENDROIT en même temps (palier de points) et se
// superposaient. Ce message de points note jusqu'à quand il reste à l'écran ;
// le message de félicitations attend la fin avant d'apparaître.
const SHOW_MS = 2000;
const FADE_MS = 300;
let pointsToastUntil = 0;
export function pointsToastRemainingMs(): number {
  return Math.max(0, pointsToastUntil - Date.now());
}

export default function PointsToast({
  message,
  onHide,
}: {
  message: string;
  onHide: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    pointsToastUntil = Date.now() + FADE_MS + SHOW_MS + FADE_MS;
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => onHide());
    }, SHOW_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      // Sous la zone sûre (encoche, barre d'état) au lieu d'un 60 fixe.
      top: Math.max(insets.top + 12, 24),
      left: 16,
      right: 16,
      backgroundColor: '#3A2850',
      padding: 12,
      borderRadius: 12,
      zIndex: 999,
      opacity,
      alignItems: 'center',
    }}>
      <Text style={{
        color: '#FDE8B0',
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.5,
        textAlign: 'center',
      }}>
        {message}
      </Text>
    </Animated.View>
  );
}
