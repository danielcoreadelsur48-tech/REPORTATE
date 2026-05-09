import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Alert,
  Clipboard,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useGroup } from '@/hooks/useGroup';
import { useGroupStore } from '@/store/groupStore';
import { DBInvitation } from '@/types/database';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { formatDate } from '@/utils/formatDate';

export default function InviteScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { activeGroupId } = useGroupStore();
  const { invite, joinByCode } = useGroup();
  const [invitation, setInvitation] = useState<DBInvitation | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;

  async function handleGenerate() {
    if (!activeGroupId) return;
    setIsGenerating(true);
    try {
      const inv = await invite(activeGroupId);
      setInvitation(inv);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy() {
    if (!invitation) return;
    Clipboard.setString(invitation.token);
    Alert.alert(STRINGS.GROUP.INVITE_CODE_COPIED, `Código: ${invitation.token}`);
  }

  async function handleJoin() {
    if (!joinCode.trim()) { setJoinError(STRINGS.ERRORS.REQUIRED); return; }
    setJoinError('');
    setIsJoining(true);
    try {
      await joinByCode(joinCode.trim());
      Alert.alert('¡Unido!', 'Te uniste al grupo exitosamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : STRINGS.ERRORS.INVALID_CODE);
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>{STRINGS.GROUP.INVITE_TITLE}</Text>
          <View style={{ width: 24 }} />
        </View>

        {activeGroupId && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Generar código</Text>
            {invitation ? (
              <View style={styles.codeBox}>
                <Text style={styles.code}>{invitation.token}</Text>
                <Text style={styles.expiry}>
                  {STRINGS.GROUP.INVITE_EXPIRES}: {formatDate(invitation.expires_at)}
                </Text>
                <Button label={STRINGS.GROUP.INVITE_CODE_COPIED} variant="outline" onPress={handleCopy} />
              </View>
            ) : (
              <Button
                label={STRINGS.GROUP.GENERATE_INVITE}
                onPress={handleGenerate}
                loading={isGenerating}
              />
            )}
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{STRINGS.GROUP.JOIN_TITLE}</Text>
          <Input
            placeholder={STRINGS.GROUP.JOIN_CODE_PLACEHOLDER}
            value={joinCode}
            onChangeText={(t) => setJoinCode(t.toUpperCase())}
            error={joinError}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Button label={STRINGS.GROUP.JOIN_BUTTON} onPress={handleJoin} loading={isJoining} />
        </Card>
      </ScrollView>
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
  section: { gap: Spacing[3] },
  sectionTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
  codeBox: { alignItems: 'center', gap: Spacing[3] },
  code: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.primary[500],
    letterSpacing: 6,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  expiry: { fontSize: Typography.size.xs, color: Colors.text.secondary },
});
