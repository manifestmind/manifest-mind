import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';

export default function CongratulationsToast({
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
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 60,
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
      }}>
        {message}
      </Text>
    </Animated.View>
  );
}
