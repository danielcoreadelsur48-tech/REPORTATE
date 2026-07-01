import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { useAuth } from '@/hooks/useAuth';
import { signOut, resetPassword } from '@/services/supabase/auth';

type Status = 'form' | 'success';

export default function VerifyResetCodeScreen() {
  const { verifyResetCode, resetPasswordConfirm } = useAuth();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [status, setStatus] = useState<Status>('form');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify() {
    setCodeError('');
    setPasswordError('');
    setConfirmError('');

    if (!email) {
      setCodeError(STRINGS.ERRORS.GENERIC);
      return;
    }
    if (code.trim().length !== 8) {
      setCodeError(STRINGS.ERRORS.INVALID_RECOVERY_CODE);
      return;
    }
    if (password.length < 8) {
      setPasswordError(STRINGS.ERRORS.WEAK_PASSWORD);
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError(STRINGS.ERRORS.PASSWORD_MISMATCH);
      return;
    }

    setIsSaving(true);
    try {
      await verifyResetCode(email, code.trim());
      await resetPasswordConfirm(password);
      await signOut();
      setStatus('success');
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : STRINGS.ERRORS.INVALID_RECOVERY_CODE);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setIsResending(true);
    try {
      await resetPassword(email);
      setCodeError('');
    } catch {
      // Silencioso: no revelar si el correo existe o no.
    } finally {
      setIsResending(false);
    }
  }

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <Text style={styles.appName}>REPÓRTATE</Text>
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle" size={96} color={Colors.success.DEFAULT} />
        </View>
        <Text style={styles.title}>{STRINGS.AUTH.RESET_PASSWORD_SUCCESS_TITLE}</Text>
        <Text style={styles.subtitle}>{STRINGS.AUTH.RESET_PASSWORD_SUCCESS_BODY}</Text>
        <Button
          label={STRINGS.AUTH.LOGIN_LINK}
          onPress={() => router.replace('/(auth)/login')}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.formTitle}>{STRINGS.AUTH.VERIFY_CODE_TITLE}</Text>
          <Text style={styles.formSubtitle}>{STRINGS.AUTH.VERIFY_CODE_SUBTITLE}</Text>
        </View>
        <Input
          label={STRINGS.AUTH.CODE_LABEL}
          placeholder={STRINGS.AUTH.CODE_PLACEHOLDER}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={8}
          error={codeError}
        />
        <Input
          label={STRINGS.AUTH.PASSWORD_LABEL}
          placeholder={STRINGS.AUTH.PASSWORD_PLACEHOLDER}
          value={password}
          onChangeText={setPassword}
          secureEntry
          error={passwordError}
        />
        <Input
          label={STRINGS.AUTH.CONFIRM_PASSWORD_LABEL}
          placeholder={STRINGS.AUTH.CONFIRM_PASSWORD_PLACEHOLDER}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureEntry
          error={confirmError}
        />
        <Button
          label={STRINGS.AUTH.VERIFY_CODE_BUTTON}
          onPress={handleVerify}
          loading={isSaving}
          style={styles.btn}
        />
        <TouchableOpacity onPress={handleResend} disabled={isResending} style={styles.back} accessibilityRole="link">
          <Text style={styles.backText}>{STRINGS.AUTH.RESEND_CODE_LINK}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  formContainer: { flexGrow: 1, padding: Spacing[6], justifyContent: 'center' },
  header: { marginBottom: Spacing[8] },
  formTitle: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary },
  formSubtitle: { fontSize: Typography.size.base, color: Colors.text.secondary, marginTop: Spacing[1] },
  btn: { marginTop: Spacing[4] },
  back: { marginTop: Spacing[5], alignItems: 'center' },
  backText: { color: Colors.primary[500], fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
});
