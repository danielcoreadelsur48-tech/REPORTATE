import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleSheet,
  View,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

type Variant = 'primary' | 'success' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const bg = {
    primary: Colors.primary[500],
    success: Colors.success.DEFAULT,
    danger: Colors.danger.DEFAULT,
    ghost: 'transparent',
    outline: 'transparent',
  }[variant];

  const textColor = variant === 'ghost' || variant === 'outline'
    ? Colors.primary[500]
    : Colors.text.inverse;

  const borderColor = variant === 'outline' ? Colors.primary[500] : 'transparent';

  const height = { sm: 36, md: 48, lg: 56 }[size];
  const fontSize = { sm: Typography.size.sm, md: Typography.size.base, lg: Typography.size.lg }[size];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: bg, height, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0 },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColor, fontSize, marginLeft: icon ? Spacing[2] : 0 }]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: Typography.weight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});
