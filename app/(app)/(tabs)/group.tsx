import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MemberCard } from '@/components/features/MemberCard';
import { DayActivitySheet } from '@/components/features/DayActivitySheet';
import { GroupPickerSheet } from '@/components/features/GroupPickerSheet';
import { GroupDeleteSheet } from '@/components/features/GroupDeleteSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useGroup } from '@/hooks/useGroup';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase/client';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function GroupScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { user } = useAuthStore();
  const { activeGroup, activeGroupId, members, isLoadingMembers, loadGroups, loadMembers, promoteMember, revokeMember } = useGroup();
  const [showActivity, setShowActivity] = useState(false);
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const activityOpenRef = useRef(false);
  const badgeChannelRef = useRef<RealtimeChannel | null>(null);

  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const isCaptain = activeGroup?.role === 'captain';
  const isCreator = activeGroup?.created_by === user?.id;

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (activeGroupId) loadMembers(activeGroupId);
  }, [activeGroupId]);

  // Badge: check for unseen activity and subscribe to new reports
  useEffect(() => {
    badgeChannelRef.current?.unsubscribe();
    badgeChannelRef.current = null;
    setHasNewActivity(false);

    if (!activeGroupId) return;

    const today = new Date().toLocaleDateString('en-CA');
    const key = `activity_last_seen_${activeGroupId}`;

    AsyncStorage.getItem(key).then((lastSeen) => {
      supabase
        .from('custom_reports')
        .select('created_at')
        .eq('group_id', activeGroupId)
        .eq('window_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          const newest = data?.[0]?.created_at;
          if (newest && (!lastSeen || new Date(newest) > new Date(lastSeen))) {
            setHasNewActivity(true);
          }
        });
    });

    badgeChannelRef.current = supabase
      .channel(`activity_badge_${activeGroupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'custom_reports', filter: `group_id=eq.${activeGroupId}` },
        () => { if (!activityOpenRef.current) setHasNewActivity(true); },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_events', filter: `group_id=eq.${activeGroupId}` },
        () => { if (!activityOpenRef.current) setHasNewActivity(true); },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'home_arrivals', filter: `group_id=eq.${activeGroupId}` },
        () => { if (!activityOpenRef.current) setHasNewActivity(true); },
      )
      .subscribe();

    return () => {
      badgeChannelRef.current?.unsubscribe();
      badgeChannelRef.current = null;
    };
  }, [activeGroupId]);

  function handleRevoke(member: (typeof members)[0]) {
    Alert.alert(
      'Quitar rol Admin',
      `¿Quitar el rol de Admin a ${member.full_name}? Pasará a ser Miembro.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeMember(activeGroupId!, member.user_id);
            } catch {
              Alert.alert('Error', STRINGS.ERRORS.GENERIC);
            }
          },
        },
      ],
    );
  }

  function handlePromote(member: (typeof members)[0]) {
    Alert.alert(
      'Promover a Admin',
      `¿Nombrar a ${member.full_name} como Admin del grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Promover',
          onPress: async () => {
            try {
              await promoteMember(activeGroupId!, member.user_id);
            } catch {
              Alert.alert('Error', STRINGS.ERRORS.GENERIC);
            }
          },
        },
      ],
    );
  }

  async function handleRefresh() {
    setRefreshing(true);
    if (activeGroupId) await loadMembers(activeGroupId);
    setRefreshing(false);
  }

  function handleOpenActivity() {
    activityOpenRef.current = true;
    setHasNewActivity(false);
    setShowActivity(true);
  }

  function handleCloseActivity() {
    activityOpenRef.current = false;
    setShowActivity(false);
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
      {/* Header */}
      <View style={styles.header}>
        {/* Grupo activo — tappable para cambiar */}
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Cambiar grupo"
          style={styles.groupSelector}
          activeOpacity={0.7}
        >
          <View style={styles.groupSelectorLeft}>
            <View style={styles.groupAvatarSmall}>
              <Text style={styles.groupAvatarText}>{activeGroup.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <View style={styles.groupNameRow}>
                <Text style={[styles.groupName, { color: textColor }]} numberOfLines={1}>
                  {activeGroup.name}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
              </View>
              <View style={styles.meta}>
                <Badge
                  label={isCaptain ? STRINGS.GROUP.CAPTAIN_BADGE : 'Miembro'}
                  variant={isCaptain ? 'primary' : 'neutral'}
                />
                <Text style={styles.memberCount}>{activeGroup.memberCount} miembros</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Acciones del header */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleOpenActivity}
            accessibilityRole="button"
            accessibilityLabel="Ver actividad del día"
            style={styles.iconBtn}
          >
            <View>
              <Ionicons name="notifications" size={24} color={Colors.warning.DEFAULT} />
              {hasNewActivity && <View style={styles.badge} />}
            </View>
          </TouchableOpacity>

          {isCaptain && (
            <>
              <TouchableOpacity
                onPress={() => router.push('/(app)/group/invite')}
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
                onPress={() => setShowDelete(true)}
                accessibilityRole="button"
                accessibilityLabel="Eliminar grupo"
                style={styles.iconBtn}
              >
                <Ionicons name="trash-outline" size={24} color={Colors.danger.DEFAULT} />
              </TouchableOpacity>
            </>
          )}
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
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              isGroupCreator={item.user_id === activeGroup?.created_by}
              onPromote={
                isCaptain && item.role !== 'captain'
                  ? () => handlePromote(item)
                  : undefined
              }
              onRevoke={
                isCreator && item.role === 'captain' && item.user_id !== user?.id
                  ? () => handleRevoke(item)
                  : undefined
              }
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title={STRINGS.GROUP.NO_MEMBERS} />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}

      <DayActivitySheet
        visible={showActivity}
        groupId={activeGroupId}
        onClose={handleCloseActivity}
      />

      <GroupPickerSheet visible={showPicker} onClose={() => setShowPicker(false)} />
      <GroupDeleteSheet visible={showDelete} onClose={() => setShowDelete(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[5],
    paddingBottom: Spacing[3],
  },
  groupSelector: { flex: 1 },
  groupSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  groupAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    color: Colors.text.inverse,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  groupName: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, maxWidth: 160 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: Spacing[1] },
  memberCount: { fontSize: Typography.size.xs, color: Colors.text.secondary },
  headerActions: { flexDirection: 'row', gap: Spacing[1] },
  iconBtn: { padding: Spacing[2] },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger.DEFAULT,
  },
  list: { padding: Spacing[5], paddingTop: 0, gap: Spacing[2] },
});
