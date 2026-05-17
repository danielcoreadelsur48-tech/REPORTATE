import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail } from '@/utils/validateEmail';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.trim()) e.email = STRINGS.ERRORS.REQUIRED;
    else if (!validateEmail(email)) e.email = STRINGS.ERRORS.INVALID_EMAIL;
    if (!password) e.password = STRINGS.ERRORS.REQUIRED;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(app)/(tabs)/home');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : STRINGS.ERRORS.GENERIC);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.appName}>REPÓRTATE</Text>
          <Text style={styles.title}>{STRINGS.AUTH.LOGIN_TITLE}</Text>
          <Text style={styles.subtitle}>{STRINGS.AUTH.LOGIN_SUBTITLE}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={STRINGS.AUTH.EMAIL_LABEL}
            placeholder={STRINGS.AUTH.EMAIL_PLACEHOLDER}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label={STRINGS.AUTH.PASSWORD_LABEL}
            placeholder={STRINGS.AUTH.PASSWORD_PLACEHOLDER}
            value={password}
            onChangeText={setPassword}
            secureEntry
            error={errors.password}
            autoComplete="password"
          />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            accessibilityRole="link"
          >
            <Text style={styles.forgotLink}>{STRINGS.AUTH.FORGOT_PASSWORD_LINK}</Text>
          </TouchableOpacity>
          <Button
            label={STRINGS.AUTH.LOGIN_BUTTON}
            onPress={handleLogin}
            loading={isLoading}
            style={styles.mainBtn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{STRINGS.AUTH.NO_ACCOUNT}</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} accessibilityRole="link">
            <Text style={styles.link}>{STRINGS.AUTH.REGISTER_LINK}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>© Todos los derechos reservados. Leonardo Ramos.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing[6],
    justifyContent: 'center',
  },
  header: { marginBottom: Spacing[8], alignItems: 'center' },
  appName: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.primary[500],
    letterSpacing: 2,
    marginBottom: Spacing[2],
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    marginTop: Spacing[1],
  },
  form: { gap: Spacing[1] },
  forgotLink: {
    color: Colors.primary[500],
    fontSize: Typography.size.sm,
    textAlign: 'right',
    marginBottom: Spacing[4],
  },
  mainBtn: { marginTop: Spacing[2] },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing[8],
  },
  footerText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  link: {
    color: Colors.primary[500],
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  copyright: {
    marginTop: Spacing[6],
    textAlign: 'center',
    fontSize: 11,
    color: Colors.neutral[400],
  },
});
