import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '@/constants/theme';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const radius = size / 2;
  const fontSize = size * 0.36;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        accessibilityLabel={`Foto de ${name}`}
      />
    );
  }

  return (
    <View
      style={[styles.placeholder, { width: size, height: size, borderRadius: radius }]}
      accessibilityLabel={`Iniciales de ${name}`}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.text.inverse,
    fontWeight: Typography.weight.bold,
  },
});
