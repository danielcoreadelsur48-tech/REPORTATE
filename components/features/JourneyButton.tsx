import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

type JourneyState = 'idle' | 'started' | 'ended';

interface JourneyButtonProps {
  state: JourneyState;
  startedAt?: string | null;
  isLoading?: boolean;
  onStartPress: () => void;
  onEndPress: () => void;
}

export function JourneyButton({
  state,
  startedAt,
  isLoading = false,
  onStartPress,
  onEndPress,
}: JourneyButtonProps) {
  function handleStart() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartPress();
  }

  function handleEnd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEndPress();
  }

  if (state === 'ended') {
    return (
      <View style={[styles.button, styles.endedButton]}>
        <Ionicons name="checkmark-circle" size={32} color={Colors.success.DEFAULT} />
        <Text style={[styles.label, { color: Colors.success.dark }]}>
          {STRINGS.HOME.JOURNEY_ENDED}
        </Text>
      </View>
    );
  }

  if (state === 'started') {
    return (
      <View style={styles.row}>
        <View style={[styles.statusPill]}>
          <Ionicons name="play-circle" size={20} color={Colors.success.DEFAULT} />
          <Text style={styles.statusText}>{STRINGS.HOME.JOURNEY_STARTED}</Text>
          {startedAt && (
            <Text style={styles.timeText}>
              {STRINGS.HOME.STARTED_AT} {new Date(startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={STRINGS.HOME.JOURNEY_END_BUTTON}
          style={[styles.button, styles.endButton]}
          onPress={handleEnd}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="stop-circle" size={32} color={Colors.text.inverse} />
              <Text style={[styles.label, { color: Colors.text.inverse }]}>
                {STRINGS.HOME.JOURNEY_END_BUTTON}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={STRINGS.HOME.JOURNEY_START_BUTTON}
      style={[styles.button, styles.startButton]}
      onPress={handleStart}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.text.inverse} />
      ) : (
        <>
          <Ionicons name="play-circle" size={32} color={Colors.text.inverse} />
          <Text style={[styles.label, { color: Colors.text.inverse }]}>
            {STRINGS.HOME.JOURNEY_START_BUTTON}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing[3] },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    height: 64,
    borderRadius: Radius.xl,
    ...Shadow.md,
  },
  startButton: { backgroundColor: Colors.success.DEFAULT },
  endButton: { backgroundColor: Colors.primary[500] },
  endedButton: { backgroundColor: Colors.success.light },
  label: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  statusPill: {
    backgroundColor: Colors.success.light,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  statusText: {
    color: Colors.success.dark,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.sm,
  },
  timeText: {
    color: Colors.success.dark,
    fontSize: Typography.size.xs,
  },
});
