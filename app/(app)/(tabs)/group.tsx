import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MemberCard } from '@/components/features/MemberCard';
import { AbsenceAlertModal } from '@/components/features/AbsenceAlertModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useGroup } from '@/hooks/useGroup';
import { useAuthStore } from '@/store/authStore';
import { getMembersWithoutEndReport } from '@/services/supabase/reports';
import { sendGroupNotification } from '@/services/notifications/sendNotification';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

export default function GroupScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { user } = useAuthStore();
  const { activeGroup, activeGroupId, members, isLoadingMembers, loadGroups, loadMembers, remove } = useGroup();
  const [showAbsence, setShowAbsence] = useState(false);
  const [absentNames, setAbsentNames] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const isCaptain = activeGroup?.role === 'captain';

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (activeGroupId) loadMembers(activeGroupId);
  }, [activeGroupId]);

  async function handleRefresh() {
    setRefreshing(true);
    if (activeGroupId) await loadMembers(activeGroupId);
    setRefreshing(false);
  }

  async function handleAbsenceAlert() {
    if (!activeGroupId) return;
    const absentIds = await getMembersWithoutEndReport(activeGroupId);
    const absentMemberNames = members
      .filter((m) => absentIds.includes(m.user_id))
      .map((m) => m.full_name);
    setAbsentNames(absentMemberNames);
    setShowAbsence(true);
  }

  function handleDeleteGroup() {
    if (!activeGroup || !activeGroupId) return;
    Alert.alert(
      'Eliminar grupo',
      `¿Estás seguro de que quieres eliminar "${activeGroup.name}"? Esta acción no se puede deshacer y eliminará todos los datos del grupo.`,
      [
        { text: STRINGS.COMMON.CANCEL, style: 'cancel' },
        {
          text: STRINGS.COMMON.DELETE,
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(activeGroupId);
            } catch {
              Alert.alert('Error', STRINGS.ERRORS.GENERIC);
            }
          },
        },
      ],
    );
  }

  async function handleSendAbsenceAlert(message: string) {
    if (!activeGroupId) return;
    await sendGroupNotification({
      groupId: activeGroupId,
      type: 'ABSENCE_ALERT',
      title: STRINGS.GROUP.ABSENCE_ALERT_TITLE,
      body: message,
    });
    Alert.alert('Enviado', 'La alerta de ausencia fue enviada al grupo.');
  }

  if (!activeGroup) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
        <EmptyState
          icon="people-outline"
          title={STRINGS.HOME.NO_GROUP}
          description={STRINGS.HOME.NO_GROUP_ACTION}
          actionLabel="Crear o unirse a un grupo"
          onAction={() => router.push('/(app)/group/create')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.groupName, { color: textColor }]} numberOfLines={1}>{activeGroup.name}</Text>
          <View style={styles.meta}>
            <Badge label={isCaptain ? STRINGS.GROUP.CAPTAIN_BADGE : 'Miembro'} variant={isCaptain ? 'primary' : 'neutral'} />
            <Text style={styles.memberCount}>{activeGroup.memberCount} miembros</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {isCaptain && (
            <>
              <TouchableOpacity
                onPress={handleAbsenceAlert}
                accessibilityRole="button"
                accessibilityLabel="Enviar alerta de ausencia"
                style={styles.iconBtn}
              >
                <Ionicons name="notifications" size={24} color={Colors.warning.DEFAULT} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/(app)/group/invite`)}
                accessibilityRole="button"
                accessibilityLabel="Invitar miembros"
                style={styles.iconBtn}
              >
                <Ionicons name="person-add" size={24} color={Colors.primary[500]} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(app)/group/buttons')}
                accessibilityRole="button"
                accessibilityLabel={STRINGS.REPORT_BUTTONS.MANAGE_TITLE}
                style={styles.iconBtn}
              >
                <Ionicons name="options-outline" size={24} color={Colors.primary[500]} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteGroup}
                accessibilityRole="button"
                accessibilityLabel="Eliminar grupo"
                style={styles.iconBtn}
              >
                <Ionicons name="trash-outline" size={24} color={Colors.danger.DEFAULT} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={() => router.push('/(app)/group/create')}
            accessibilityRole="button"
            accessibilityLabel="Crear grupo"
            style={styles.iconBtn}
          >
            <Ionicons name="add-circle" size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoadingMembers && !refreshing ? (
        <View>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.user_id}
          renderItem={({ item }) => <MemberCard member={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title={STRINGS.GROUP.NO_MEMBERS} />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}

      <AbsenceAlertModal
        visible={showAbsence}
        absentNames={absentNames}
        onSend={handleSendAbsenceAlert}
        onCancel={() => setShowAbsence(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing[5],
    paddingBottom: Spacing[3],
  },
  groupName: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, maxWidth: 200 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: Spacing[1] },
  memberCount: { fontSize: Typography.size.xs, color: Colors.text.secondary },
  headerActions: { flexDirection: 'row', gap: Spacing[1] },
  iconBtn: { padding: Spacing[2] },
  list: { padding: Spacing[5], paddingTop: 0, gap: Spacing[2] },
});
