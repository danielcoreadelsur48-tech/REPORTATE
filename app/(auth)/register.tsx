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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = STRINGS.ERRORS.REQUIRED;
    if (!email.trim()) e.email = STRINGS.ERRORS.REQUIRED;
    else if (!validateEmail(email)) e.email = STRINGS.ERRORS.INVALID_EMAIL;
    if (!password) e.password = STRINGS.ERRORS.REQUIRED;
    else if (password.length < 8) e.password = STRINGS.ERRORS.WEAK_PASSWORD;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register(email.trim(), password, fullName.trim());
      Alert.alert('¡Cuenta creada!', 'Revisa tu correo para confirmar tu cuenta.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
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
          <Text style={styles.title}>{STRINGS.AUTH.REGISTER_TITLE}</Text>
          <Text style={styles.subtitle}>{STRINGS.AUTH.REGISTER_SUBTITLE}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={STRINGS.AUTH.FULL_NAME_LABEL}
            placeholder={STRINGS.AUTH.FULL_NAME_PLACEHOLDER}
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
            autoComplete="name"
          />
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
            autoComplete="new-password"
          />
          <Button
            label={STRINGS.AUTH.REGISTER_BUTTON}
            onPress={handleRegister}
            loading={isLoading}
            style={styles.mainBtn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{STRINGS.AUTH.HAVE_ACCOUNT}</Text>
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="link">
            <Text style={styles.link}>{STRINGS.AUTH.LOGIN_LINK}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: Spacing[6], justifyContent: 'center' },
  header: { marginBottom: Spacing[8], alignItems: 'center' },
  appName: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.primary[500],
    letterSpacing: 2,
    marginBottom: Spacing[2],
  },
  title: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary },
  subtitle: { fontSize: Typography.size.base, color: Colors.text.secondary, marginTop: Spacing[1] },
  form: { gap: Spacing[1] },
  mainBtn: { marginTop: Spacing[4] },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[8] },
  footerText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  link: { color: Colors.primary[500], fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
});
