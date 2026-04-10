import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  message: string;
  onHide: () => void;
}

export default function PointsToast({ message, onHide }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
      setTimeout(onHide, 300);
    }, 2300);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const displayMessage = message.startsWith('✦')
    ? message.slice(1).trim()
    : message;

  return (
    <Animated.View style={[styles.toast, animStyle]}>
      <Text style={styles.icon}>✦</Text>
      <Text style={styles.text}>{displayMessage}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    backgroundColor: '#3A2850',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 100,
  },
  icon: {
    fontSize: 12,
    color: '#FDE8B0',
  },
  text: {
    fontFamily: 'Jost',
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
});
