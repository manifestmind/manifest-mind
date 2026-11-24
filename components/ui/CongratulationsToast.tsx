import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pointsToastRemainingMs } from './PointsToast';

// 1.1.0 : apparaît APRÈS le message de points s'il est encore à l'écran (au
// lieu de se superposer à lui), et sous la zone sûre du haut.
export default function CongratulationsToast({
  message,
  onHide,
}: {
  message: string;
  onHide: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      hideTimer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onHide());
      }, 6000);
    }, pointsToastRemainingMs());

    return () => { clearTimeout(startTimer); if (hideTimer) clearTimeout(hideTimer); };
  }, []);

  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute',
      top: Math.max(insets.top + 12, 24),
      left: 16,
      right: 16,
      backgroundColor: '#4A2080',
      padding: 14,
      borderRadius: 12,
      zIndex: 999,
      opacity,
      alignItems: 'center',
    }}>
      <Text style={{
        color: 'white',
        fontFamily: 'serif',
        fontSize: 15,
        fontStyle: 'italic',
        textAlign: 'center',
      }}>
        {message}
      </Text>
    </Animated.View>
  );
}
