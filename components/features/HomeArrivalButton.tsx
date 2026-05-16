import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

interface HomeArrivalButtonProps {
  onPress: () => void;
}

export function HomeArrivalButton({ onPress }: HomeArrivalButtonProps) {
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
      accessibilityLabel={STRINGS.HOME_BUTTON.LABEL}
    >
      <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
        <View style={styles.inner}>
          <Ionicons name="home" size={36} color="#FFFFFF" />
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success.DEFAULT,
    ...Shadow.lg,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
