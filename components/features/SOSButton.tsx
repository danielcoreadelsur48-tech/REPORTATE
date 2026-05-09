import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

interface SOSButtonProps {
  isActive?: boolean;
  onPress: () => void;
}

export function SOSButton({ isActive = false, onPress }: SOSButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.97, duration: 600, useNativeDriver: true }),
      ]),
    );
    const ring = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 1.5, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    ring.start();
    return () => {
      pulse.stop();
      ring.stop();
    };
  }, []);

  const bg = isActive ? Colors.danger.dark : Colors.danger.DEFAULT;

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={STRINGS.SOS.BUTTON_LABEL}
          style={[styles.button, { backgroundColor: bg }]}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Ionicons name="alert-circle" size={48} color={Colors.text.inverse} />
          <Text style={styles.label}>{isActive ? STRINGS.SOS.DEACTIVATE_BUTTON : STRINGS.SOS.BUTTON_LABEL}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: Colors.danger.DEFAULT,
  },
  button: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    shadowColor: Colors.danger.DEFAULT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  label: {
    color: Colors.text.inverse,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1,
  },
});
