import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

export default function VerifyEmailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.appName}>REPÓRTATE</Text>

      <View style={styles.iconWrapper}>
        <Ionicons name="checkmark-circle" size={96} color={Colors.success.DEFAULT} />
      </View>

      <Text style={styles.title}>{STRINGS.AUTH.VERIFY_EMAIL_TITLE}</Text>
      <Text style={styles.subtitle}>{STRINGS.AUTH.VERIFY_EMAIL_SUBTITLE}</Text>

      <Button
        label={STRINGS.AUTH.VERIFY_EMAIL_BUTTON}
        onPress={() => router.replace('/(auth)/login')}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    backgroundColor: Colors.background.light,
  },
  appName: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.primary[500],
    letterSpacing: 2,
    marginBottom: Spacing[10],
  },
  iconWrapper: {
    marginBottom: Spacing[6],
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.5,
    marginBottom: Spacing[10],
  },
  button: {
    width: '100%',
  },
});
