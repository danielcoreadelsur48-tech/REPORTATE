import React from 'react';
import { View, ViewProps, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
}

export function Card({ children, padding = Spacing[4], style, ...rest }: CardProps) {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? Colors.surface.dark : Colors.surface.light;

  return (
    <View style={[styles.card, { backgroundColor: bg, padding }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    ...Shadow.md,
  },
});
