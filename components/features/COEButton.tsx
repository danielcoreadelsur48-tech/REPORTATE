import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors, Shadow, Typography } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

interface COEButtonProps {
  onPress: () => void;
}

export function COEButton({ onPress }: COEButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={STRINGS.COE_BUTTON.LABEL}
    >
      <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
        <View style={styles.inner}>
          <Text style={styles.label}>COE</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[500],
    ...Shadow.lg,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1,
  },
});
