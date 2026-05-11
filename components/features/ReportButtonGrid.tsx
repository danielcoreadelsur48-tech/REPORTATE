import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReportButtonWithState } from '@/types';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

interface ReportButtonGridProps {
  buttons: ReportButtonWithState[];
  onPress: (button: ReportButtonWithState) => void;
  isLoading?: boolean;
}

const BUTTON_SIZE = 140;

export function ReportButtonGrid({ buttons, onPress, isLoading }: ReportButtonGridProps) {
  if (isLoading) {
    return (
      <View style={styles.row}>
        {[...Array(2)].map((_, i) => (
          <View key={i} style={[styles.button, styles.skeleton]} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {buttons.map((btn) => {
        const isActive = btn.status === 'active';
        const isCompleted = btn.status === 'completed';
        const isUpcoming = btn.status === 'upcoming';

        return (
          <TouchableOpacity
            key={btn.id}
            style={[
              styles.button,
              isActive && styles.buttonActive,
              isCompleted && styles.buttonCompleted,
              (isUpcoming || btn.status === 'expired') && styles.buttonDisabled,
            ]}
            onPress={() => onPress(btn)}
            disabled={!isActive}
            accessibilityLabel={btn.name}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isActive }}
          >
            {/* Home badge */}
            {btn.is_home_button && (
              <View style={styles.homeBadge}>
                <Ionicons
                  name="home"
                  size={10}
                  color={isActive ? Colors.text.inverse : Colors.neutral[400]}
                />
              </View>
            )}

            {/* Completed checkmark */}
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success.DEFAULT} />
              </View>
            )}

            <Ionicons
              name={btn.icon as keyof typeof Ionicons.glyphMap}
              size={32}
              color={isActive ? Colors.text.inverse : Colors.neutral[400]}
              style={styles.icon}
            />

            <Text
              style={[styles.name, isActive && styles.nameActive]}
              numberOfLines={2}
            >
              {btn.name}
            </Text>

            {isCompleted && (
              <Text style={styles.completedLabel}>{STRINGS.REPORT_BUTTONS.REPORTED}</Text>
            )}

            {isUpcoming && (
              <Text style={styles.timeLabel}>
                {`${STRINGS.REPORT_BUTTONS.AVAILABLE_AT} ${btn.activation_time.slice(0, 5)}`}
              </Text>
            )}

            {btn.status === 'expired' && (
              <Text style={styles.timeLabel}>{STRINGS.REPORT_BUTTONS.WINDOW_CLOSED}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  button: {
    width: BUTTON_SIZE,
    minHeight: BUTTON_SIZE,
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[3],
    gap: Spacing[2],
    position: 'relative',
  },
  buttonActive: {
    backgroundColor: Colors.primary[500],
    ...Shadow.md,
  },
  buttonCompleted: {
    backgroundColor: Colors.success.light,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  skeleton: {
    backgroundColor: Colors.neutral[200],
    opacity: 0.5,
  },
  icon: {
    marginTop: Spacing[1],
  },
  name: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  nameActive: {
    color: Colors.text.inverse,
  },
  completedLabel: {
    fontSize: Typography.size.xs,
    color: Colors.success.dark,
    fontWeight: Typography.weight.medium,
  },
  timeLabel: {
    fontSize: Typography.size.xs,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
  homeBadge: {
    position: 'absolute',
    bottom: Spacing[2],
    right: Spacing[2],
    backgroundColor: Colors.neutral[200],
    borderRadius: Radius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
  },
});
