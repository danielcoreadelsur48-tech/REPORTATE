import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Session } from '@supabase/supabase-js';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { supabase } from '@/services/supabase/client';
import { signOut } from '@/services/supabase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useDeepLinkStore } from '@/store/deepLinkStore';

type Status = 'loading' | 'form' | 'success' | 'error';

const exchangedCodes = new Set<string>();

export default function ResetPasswordScreen() {
  const { resetPasswordConfirm } = useAuth();
  const code = useDeepLinkStore((s) => s.code);
  const error_description = useDeepLinkStore((s) => s.errorDescription);
  const rawLog = useDeepLinkStore((s) => s.rawLog);

  const [status, setStatus] = useState<Status>(error_description ? 'error' : 'loading');
  const [errorMsg, setErrorMsg] = useState(error_description ?? '');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recoverySession, setRecoverySession] = useState<Session | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const addDebug = (line: string) => setDebugInfo((prev) => [...prev, line]);
  const fullLog = [...rawLog, ...debugInfo];

  // Diagnóstico puro: qué ve la pantalla apenas monta, antes de cualquier lógica.
  useEffect(() => {
    addDebug(`[raw] deepLinkStore = code=${code ? code.slice(0, 8) + '…' : 'null'} error=${error_description ?? 'null'}`);
  }, []);

  useEffect(() => {
    if (!code) {
      // Sin code en el store del deep link: puede ser un remount posterior a que
      // ya se haya consumido el code. Revisar si ya hay sesión persistida.
      addDebug('[mount] sin code en el store, buscando sesión ya persistida…');
      supabase.auth.getSession().then(({ data, error }) => {
        addDebug(
          `[mount] getSession (sin code) -> session=${data.session ? 'YES exp=' + data.session.expires_at : 'NULL'} error=${error?.message ?? 'none'}`
        );
        setRecoverySession(data.session);
        setStatus('form');
      });
      return;
    }
    if (exchangedCodes.has(code)) {
      addDebug(`[mount B] dedup path, code=${code.slice(0, 8)}…`);
      supabase.auth.getSession().then(({ data, error }) => {
        addDebug(
          `[mount B] getSession -> session=${data.session ? 'YES exp=' + data.session.expires_at : 'NULL'} error=${error?.message ?? 'none'}`
        );
        setRecoverySession(data.session);
        setStatus('form');
      });
      return;
    }
    exchangedCodes.add(code);
    addDebug(`[mount A] fresh exchange, code=${code.slice(0, 8)}…`);
    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      addDebug(
        `[mount A] exchange -> session=${data.session ? 'YES exp=' + data.session.expires_at : 'NULL'} error=${error?.message ?? 'none'}`
      );
      useDeepLinkStore.getState().clear();
      if (error) {
        setErrorMsg(error.message);
        setStatus('error');
      } else {
        setRecoverySession(data.session);
        setStatus('form');
      }
    });
  }, [code]);

  // Evita que el ticker de auto-refresh intente renovar la sesión de recuperación
  // mientras el usuario escribe: un refresh rechazado por el servidor borra la
  // sesión del storage (auth-js._callRefreshToken -> _removeSession en error).
  useEffect(() => {
    if (!recoverySession) return;
    supabase.auth.stopAutoRefresh();
    return () => {
      supabase.auth.startAutoRefresh();
    };
  }, [recoverySession]);

  async function handleSave() {
    setPasswordError('');
    setConfirmError('');
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
      addDebug(`[save] recoverySession in state = ${recoverySession ? 'YES exp=' + recoverySession.expires_at : 'NULL'}`);

      const { data: preCheck } = await supabase.auth.getSession();
      addDebug(`[save] getSession right before setSession -> ${preCheck.session ? 'YES exp=' + preCheck.session.expires_at : 'NULL'}`);

      if (recoverySession) {
        const { data: setData, error: setError } = await supabase.auth.setSession({
          access_token: recoverySession.access_token,
          refresh_token: recoverySession.refresh_token,
        });
        addDebug(
          `[save] setSession -> session=${setData.session ? 'YES exp=' + setData.session.expires_at : 'NULL'} error=${setError?.message ?? 'none'}`
        );
      }

      const { data: postCheck } = await supabase.auth.getSession();
      addDebug(`[save] getSession right before updateUser -> ${postCheck.session ? 'YES exp=' + postCheck.session.expires_at : 'NULL'}`);

      await resetPasswordConfirm(password);
      await signOut();
      setStatus('success');
    } catch (err) {
      addDebug(`[save] CATCH -> ${err instanceof Error ? err.message : String(err)}`);
      setPasswordError(err instanceof Error ? err.message : STRINGS.ERRORS.GENERIC);
    } finally {
      setIsSaving(false);
    }
  }

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.appName}>REPÓRTATE</Text>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={[styles.subtitle, { marginTop: Spacing[4] }]}>Procesando enlace…</Text>
        {fullLog.length > 0 && (
          <View style={styles.debugBox}>
            {fullLog.map((line, i) => (
              <Text key={i} selectable style={styles.debugText}>
                {line}
              </Text>
            ))}
          </View>
        )}
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
        <Text style={styles.title}>No se pudo procesar</Text>
        <Text style={styles.subtitle}>
          {errorMsg || 'El enlace expiró o ya fue utilizado. Solicitá uno nuevo.'}
        </Text>
        <Button
          label="Volver al inicio"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.button}
        />
        {fullLog.length > 0 && (
          <View style={styles.debugBox}>
            {fullLog.map((line, i) => (
              <Text key={i} selectable style={styles.debugText}>
                {line}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
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
          <Text style={styles.formTitle}>{STRINGS.AUTH.RESET_PASSWORD_TITLE}</Text>
          <Text style={styles.formSubtitle}>{STRINGS.AUTH.RESET_PASSWORD_SUBTITLE}</Text>
        </View>
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
          label={STRINGS.AUTH.RESET_PASSWORD_BUTTON}
          onPress={handleSave}
          loading={isSaving}
          style={styles.btn}
        />
        {fullLog.length > 0 && (
          <View style={styles.debugBox}>
            {fullLog.map((line, i) => (
              <Text key={i} selectable style={styles.debugText}>
                {line}
              </Text>
            ))}
          </View>
        )}
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
  debugBox: {
    marginTop: Spacing[6],
    padding: Spacing[3],
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  debugText: {
    color: '#FBBF24',
    fontSize: 10,
    fontFamily: Typography.family.mono,
    marginBottom: 2,
  },
});
