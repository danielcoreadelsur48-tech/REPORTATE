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

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleReset() {
    if (!email.trim()) { setEmailError(STRINGS.ERRORS.REQUIRED); return; }
    if (!validateEmail(email)) { setEmailError(STRINGS.ERRORS.INVALID_EMAIL); return; }
    setEmailError('');
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      Alert.alert('Correo enviado', STRINGS.AUTH.RESET_SENT, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : STRINGS.ERRORS.GENERIC);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{STRINGS.AUTH.FORGOT_PASSWORD_TITLE}</Text>
          <Text style={styles.subtitle}>{STRINGS.AUTH.FORGOT_PASSWORD_SUBTITLE}</Text>
        </View>
        <Input
          label={STRINGS.AUTH.EMAIL_LABEL}
          placeholder={STRINGS.AUTH.EMAIL_PLACEHOLDER}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={emailError}
          autoComplete="email"
        />
        <Button label={STRINGS.AUTH.RESET_BUTTON} onPress={handleReset} loading={isLoading} style={styles.btn} />
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="link">
          <Text style={styles.backText}>{STRINGS.AUTH.BACK_TO_LOGIN}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: Spacing[6], justifyContent: 'center' },
  header: { marginBottom: Spacing[8] },
  title: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary },
  subtitle: { fontSize: Typography.size.base, color: Colors.text.secondary, marginTop: Spacing[1] },
  btn: { marginTop: Spacing[4] },
  back: { marginTop: Spacing[5], alignItems: 'center' },
  backText: { color: Colors.primary[500], fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
});
