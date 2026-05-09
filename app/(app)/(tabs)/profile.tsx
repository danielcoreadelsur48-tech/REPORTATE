import React from 'react';
import { View, Text, StyleSheet, useColorScheme, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { useGroupStore } from '@/store/groupStore';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { user } = useAuthStore();
  const { groups, setActiveGroupId } = useGroupStore();
  const { logout } = useAuth();

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;

  async function handleLogout() {
    Alert.alert(STRINGS.PROFILE.LOGOUT_CONFIRM, '', [
      { text: STRINGS.COMMON.CANCEL, style: 'cancel' },
      {
        text: STRINGS.PROFILE.LOGOUT,
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <Avatar uri={user?.avatar_url} name={user?.full_name ?? 'U'} size={80} />
          <Text style={[styles.name, { color: textColor }]}>{user?.full_name}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>{STRINGS.PROFILE.MY_GROUPS}</Text>
        {groups.map((g) => (
          <TouchableOpacity
            key={g.id}
            onPress={() => { setActiveGroupId(g.id); router.push('/(app)/(tabs)/group'); }}
            accessibilityRole="button"
            accessibilityLabel={`Ir al grupo ${g.name}`}
          >
            <Card style={styles.groupRow}>
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: textColor }]} numberOfLines={1}>{g.name}</Text>
                <Badge label={g.role === 'captain' ? STRINGS.GROUP.CAPTAIN_BADGE : 'Miembro'} variant={g.role === 'captain' ? 'primary' : 'neutral'} />
              </View>
              <Text style={styles.memberCount}>{g.memberCount} miembros</Text>
            </Card>
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.version}>
            {STRINGS.PROFILE.VERSION} {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
          <Button label={STRINGS.PROFILE.LOGOUT} variant="danger" onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing[5], gap: Spacing[4], flexGrow: 1 },
  avatarSection: { alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[4] },
  name: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  sectionTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold },
  groupRow: { gap: Spacing[1] },
  groupInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  groupName: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium, flex: 1 },
  memberCount: { fontSize: Typography.size.xs, color: Colors.text.secondary },
  footer: { marginTop: 'auto', gap: Spacing[3] },
  version: { textAlign: 'center', fontSize: Typography.size.xs, color: Colors.neutral[400] },
});
