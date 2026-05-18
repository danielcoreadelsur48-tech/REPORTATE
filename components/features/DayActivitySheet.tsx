import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
  useColorScheme,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { getTodayGroupActivity, getMembersWithoutCustomReport } from '@/services/supabase/reportButtons';
import { getTodayGroupSOSEvents } from '@/services/supabase/sos';
import { supabase } from '@/services/supabase/client';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import type { DayActivityItem, DaySOSItem, PendingMember } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Tab = 'reports' | 'sos' | 'pending';

function lastSeenKey(groupId: string) {
  return `activity_last_seen_${groupId}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isUnread(createdAt: string, lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return true;
  return new Date(createdAt) > new Date(lastSeenAt);
}

interface DayActivitySheetProps {
  visible: boolean;
  groupId: string | null;
  isCaptain: boolean;
  onClose: () => void;
}

export function DayActivitySheet({ visible, groupId, isCaptain, onClose }: DayActivitySheetProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<DayActivityItem[]>([]);
  const [sosEvents, setSOSEvents] = useState<DaySOSItem[]>([]);
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const bg = isDark ? Colors.surface.dark : Colors.surface.light;
  const textColor = isDark ? Colors.neutral[0] : Colors.text.primary;
  const borderColor = isDark ? Colors.neutral[800] : Colors.neutral[200];
  const tabBg = isDark ? Colors.neutral[800] : Colors.neutral[100];

  const loadData = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const [seen, acts, sos, pend] = await Promise.all([
        AsyncStorage.getItem(lastSeenKey(groupId)),
        getTodayGroupActivity(groupId, isCaptain),
        getTodayGroupSOSEvents(groupId),
        getMembersWithoutCustomReport(groupId),
      ]);
      setLastSeenAt(seen);
      setReports(acts);
      setSOSEvents(sos);
      setPending(pend);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!visible || !groupId) return;

    loadData();

    channelRef.current = supabase
      .channel(`activity_sheet_${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'custom_reports', filter: `group_id=eq.${groupId}` },
        () => {
          getTodayGroupActivity(groupId, isCaptain).then(setReports).catch(() => {});
          getMembersWithoutCustomReport(groupId).then(setPending).catch(() => {});
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'home_arrivals', filter: `group_id=eq.${groupId}` },
        () => { getTodayGroupActivity(groupId, isCaptain).then(setReports).catch(() => {}); },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sos_events', filter: `group_id=eq.${groupId}` },
        () => { getTodayGroupSOSEvents(groupId).then(setSOSEvents).catch(() => {}); },
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [visible, groupId, loadData]);

  function handleClose() {
    if (groupId) {
      AsyncStorage.setItem(lastSeenKey(groupId), new Date().toISOString());
    }
    onClose();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'reports', label: STRINGS.ACTIVITY_SHEET.TAB_REPORTS },
    { key: 'sos', label: STRINGS.ACTIVITY_SHEET.TAB_EMERGENCIES },
    { key: 'pending', label: STRINGS.ACTIVITY_SHEET.TAB_PENDING },
  ];

  function openMap(location: { lat: number; lng: number }) {
    const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    Linking.openURL(url).catch(() => {});
  }

  function renderActivityItem({ item }: { item: DayActivityItem }) {
    const unread = isUnread(item.createdAt, lastSeenAt);
    return (
      <View style={[styles.row, { borderBottomColor: borderColor }]}>
        <View style={styles.unreadDotWrap}>
          {unread && <View style={styles.unreadDot} />}
        </View>
        <Avatar uri={item.userAvatarUrl} name={item.userFullName} size={36} />
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text
              style={[
                styles.rowName,
                { color: textColor, fontWeight: unread ? Typography.weight.bold : Typography.weight.regular },
              ]}
              numberOfLines={1}
            >
              {item.userFullName}
            </Text>
            <Text style={styles.rowTime}>{formatTime(item.createdAt)}</Text>
          </View>
          <View style={styles.rowSub}>
            <Ionicons name={item.buttonIcon as any} size={13} color={Colors.text.secondary} />
            <Text style={styles.rowSubText} numberOfLines={1}>{item.buttonName}</Text>
          </View>
        </View>
        {item.location && (
          <TouchableOpacity
            onPress={() => openMap(item.location!)}
            accessibilityRole="button"
            accessibilityLabel="Ver ubicación en mapa"
            style={styles.mapBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={18} color={Colors.primary[500]} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderSOSItem({ item }: { item: DaySOSItem }) {
    const unread = isUnread(item.activatedAt, lastSeenAt);
    const isActive = item.status === 'active';
    return (
      <View style={[styles.row, { borderBottomColor: borderColor }]}>
        <View style={styles.unreadDotWrap}>
          {unread && <View style={styles.unreadDot} />}
        </View>
        <Avatar uri={item.userAvatarUrl} name={item.userFullName} size={36} />
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text
              style={[
                styles.rowName,
                { color: textColor, fontWeight: unread ? Typography.weight.bold : Typography.weight.regular },
              ]}
              numberOfLines={1}
            >
              {item.userFullName}
            </Text>
            <Text style={styles.rowTime}>{formatTime(item.activatedAt)}</Text>
          </View>
          <View style={styles.rowSub}>
            <Badge
              label={isActive ? STRINGS.ACTIVITY_SHEET.SOS_ACTIVE : STRINGS.ACTIVITY_SHEET.SOS_RESOLVED}
              variant={isActive ? 'danger' : 'neutral'}
            />
          </View>
        </View>
        {item.location && (
          <TouchableOpacity
            onPress={() => openMap(item.location!)}
            accessibilityRole="button"
            accessibilityLabel="Ver ubicación en mapa"
            style={styles.mapBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={18} color={Colors.danger.DEFAULT} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderPendingItem({ item }: { item: PendingMember }) {
    return (
      <View style={[styles.row, { borderBottomColor: borderColor }]}>
        <View style={styles.unreadDotWrap} />
        <Avatar uri={item.avatarUrl} name={item.fullName} size={36} />
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowName, { color: textColor, fontWeight: Typography.weight.medium }]} numberOfLines={1}>
              {item.fullName}
            </Text>
            <Badge
              label={item.role === 'captain' ? STRINGS.GROUP.CAPTAIN_BADGE : 'Miembro'}
              variant={item.role === 'captain' ? 'primary' : 'neutral'}
            />
          </View>
          <Text style={styles.rowSubText}>{STRINGS.ACTIVITY_SHEET.NO_REPORT_TODAY}</Text>
        </View>
      </View>
    );
  }

  function renderEmpty(message: string, icon: keyof typeof Ionicons.glyphMap = 'checkmark-circle-outline') {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name={icon} size={44} color={Colors.neutral[400]} />
        <Text style={[styles.emptyText, { color: Colors.text.secondary }]}>{message}</Text>
      </View>
    );
  }

  function renderSkeleton() {
    return (
      <View style={styles.skeletonWrap}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.skeletonRow}>
            <Skeleton width={36} height={36} borderRadius={18} />
            <View style={{ flex: 1, gap: Spacing[1] }}>
              <Skeleton height={14} width="60%" />
              <Skeleton height={11} width="38%" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  function renderContent() {
    if (isLoading) return renderSkeleton();

    if (activeTab === 'reports') {
      return reports.length === 0
        ? renderEmpty(STRINGS.ACTIVITY_SHEET.EMPTY_REPORTS, 'document-outline')
        : (
          <FlatList
            data={reports}
            keyExtractor={(i) => i.id}
            renderItem={renderActivityItem}
            bounces={false}
            showsVerticalScrollIndicator={false}
          />
        );
    }

    if (activeTab === 'sos') {
      return sosEvents.length === 0
        ? renderEmpty(STRINGS.ACTIVITY_SHEET.EMPTY_SOS, 'shield-checkmark-outline')
        : (
          <FlatList
            data={sosEvents}
            keyExtractor={(i) => i.id}
            renderItem={renderSOSItem}
            bounces={false}
            showsVerticalScrollIndicator={false}
          />
        );
    }

    return pending.length === 0
      ? renderEmpty(STRINGS.ACTIVITY_SHEET.EMPTY_PENDING)
      : (
        <FlatList
          data={pending}
          keyExtractor={(i) => i.userId}
          renderItem={renderPendingItem}
          bounces={false}
          showsVerticalScrollIndicator={false}
        />
      );
  }

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: bg }]}>
              <View style={[styles.handle, { backgroundColor: isDark ? Colors.neutral[600] : Colors.neutral[300] }]} />

              <Text style={[styles.title, { color: textColor }]}>{STRINGS.ACTIVITY_SHEET.TITLE}</Text>

              <View style={[styles.tabBar, { backgroundColor: tabBg }]}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => setActiveTab(tab.key)}
                      accessibilityRole="tab"
                      accessibilityLabel={tab.label}
                      style={[styles.tab, isActive && styles.tabActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.tabLabel, { color: isActive ? Colors.text.inverse : Colors.text.secondary }]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.content}>{renderContent()}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
    paddingHorizontal: Spacing[5],
    maxHeight: '82%',
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing[4],
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    padding: 3,
    marginBottom: Spacing[4],
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing[2],
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary[500],
  },
  tabLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  content: {
    minHeight: 180,
    maxHeight: 420,
  },
  skeletonWrap: { gap: Spacing[4] },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  unreadDotWrap: { width: 8, alignItems: 'center', alignSelf: 'center' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
  },
  rowContent: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  rowName: { flex: 1, fontSize: Typography.size.sm },
  rowTime: { fontSize: Typography.size.xs, color: Colors.text.secondary },
  rowSub: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  rowSubText: { fontSize: Typography.size.xs, color: Colors.text.secondary },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[10],
    gap: Spacing[3],
  },
  emptyText: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
  },
  mapBtn: {
    padding: Spacing[2],
  },
});
