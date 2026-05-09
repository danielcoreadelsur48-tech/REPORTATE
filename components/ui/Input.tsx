import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureEntry?: boolean;
}

export function Input({ label, error, secureEntry = false, style, ...rest }: InputProps) {
  const [hidden, setHidden] = useState(secureEntry);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const borderColor = error ? Colors.danger.DEFAULT : isDark ? Colors.neutral[600] : Colors.neutral[200];
  const bg = isDark ? Colors.neutral[800] : Colors.neutral[0];
  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const placeholderColor = Colors.neutral[400];

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
      <View style={[styles.inputRow, { borderColor, backgroundColor: bg }]}>
        <TextInput
          accessibilityLabel={label}
          style={[styles.input, { color: textColor }, style]}
          placeholderTextColor={placeholderColor}
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...rest}
        />
        {secureEntry && (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            style={styles.eye}
          >
            <Ionicons name={hidden ? 'eye-off' : 'eye'} size={20} color={placeholderColor} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing[4] },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing[1],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.base,
    height: '100%',
  },
  eye: { padding: Spacing[1] },
  error: {
    color: Colors.danger.DEFAULT,
    fontSize: Typography.size.xs,
    marginTop: Spacing[1],
  },
});
