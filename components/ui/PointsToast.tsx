import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';

export default function PointsToast({
  message,
  onHide,
}: {
  message: string;
  onHide: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onHide());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 60,
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
      }}>
        {message}
      </Text>
    </Animated.View>
  );
}
