import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useGroup } from '@/hooks/useGroup';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

export default function JoinGroupScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { joinByCode } = useGroup();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setCodeError(STRINGS.ERRORS.REQUIRED); return; }
    if (trimmed.length !== 6) { setCodeError('El código debe tener 6 caracteres'); return; }
    setCodeError('');
    setIsLoading(true);
    try {
      await joinByCode(trimmed);
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC;
      if (msg.includes('inválido') || msg.includes('expirado')) {
        setCodeError(STRINGS.ERRORS.INVALID_CODE);
      } else if (msg.includes('miembro')) {
        Alert.alert('Aviso', msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={STRINGS.COMMON.BACK}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: textColor }]}>{STRINGS.GROUP.JOIN_TITLE}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary[50] }]}>
              <Ionicons name="key-outline" size={48} color={Colors.primary[500]} />
            </View>
            <Text style={[styles.subtitle, { color: Colors.text.secondary }]}>
              Ingresa el código de 6 caracteres que te compartió el capitán del grupo
            </Text>
          </View>

          <Input
            label={STRINGS.GROUP.INVITE_CODE}
            placeholder={STRINGS.GROUP.JOIN_CODE_PLACEHOLDER}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            error={codeError}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Button
            label={STRINGS.GROUP.JOIN_BUTTON}
            onPress={handleJoin}
            loading={isLoading}
            style={styles.btn}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing[5], gap: Spacing[4] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  title: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  iconContainer: { alignItems: 'center', gap: Spacing[4], marginBottom: Spacing[4] },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: { marginTop: Spacing[4] },
});
