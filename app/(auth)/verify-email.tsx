import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { supabase } from '@/services/supabase/client';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const { code, error_description } = useLocalSearchParams<{
    code?: string;
    error_description?: string;
  }>();

  const [status, setStatus] = useState<Status>(
    error_description ? 'error' : code ? 'loading' : 'success'
  );
  const [errorMsg, setErrorMsg] = useState(error_description ?? '');

  useEffect(() => {
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setErrorMsg(error.message);
        setStatus('error');
      } else {
        setStatus('success');
      }
    });
  }, [code]);

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.appName}>REPÓRTATE</Text>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={[styles.subtitle, { marginTop: Spacing[4] }]}>Verificando tu email…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.appName}>REPÓRTATE</Text>
        <View style={styles.iconWrapper}>
          <Ionicons name="close-circle" size={96} color={Colors.danger.DEFAULT} />
        </View>
        <Text style={styles.title}>No se pudo verificar</Text>
        <Text style={styles.subtitle}>
          {errorMsg || 'El enlace expiró o ya fue utilizado. Intentá registrarte de nuevo.'}
        </Text>
        <Button
          label="Volver al registro"
          onPress={() => router.replace('/(auth)/register')}
          style={styles.button}
        />
      </View>
    );
  }

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
