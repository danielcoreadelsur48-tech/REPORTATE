import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography, Spacing } from '@/constants/theme';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.success.light, text: Colors.success.dark },
  danger: { bg: Colors.danger.light, text: Colors.danger.dark },
  warning: { bg: Colors.warning.light, text: Colors.warning.dark },
  neutral: { bg: Colors.neutral[100], text: Colors.neutral[600] },
  primary: { bg: Colors.primary[50], text: Colors.primary[700] },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { bg, text } = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1] / 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
});
