import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { StoredNotification, NotificationType } from '@/types/database';

interface NotificationItemProps {
  item: StoredNotification;
}

type IconConfig = { name: keyof typeof Ionicons.glyphMap; color: string };

const ICON_MAP: Record<NotificationType | 'UNKNOWN', IconConfig> = {
  SOS_ACTIVATED: { name: 'alert-circle', color: Colors.danger.DEFAULT },
  SOS_RESOLVED: { name: 'shield-checkmark', color: Colors.success.DEFAULT },
  JOURNEY_START: { name: 'walk', color: Colors.success.DEFAULT },
  JOURNEY_END: { name: 'checkmark-circle', color: Colors.success.DEFAULT },
  ABSENCE_ALERT: { name: 'time', color: Colors.warning.DEFAULT },
  HOME_ARRIVAL: { name: 'home', color: Colors.primary[500] },
  CUSTOM_REPORT: { name: 'notifications', color: Colors.primary[500] },
  COE_ARRIVAL: { name: 'business', color: Colors.primary[500] },
  UNKNOWN: { name: 'notifications', color: Colors.neutral[400] },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} d`;
}

export function NotificationItem({ item }: NotificationItemProps) {
  const { name, color } = ICON_MAP[item.type] ?? ICON_MAP.UNKNOWN;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={name} size={24} color={color} />
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.time}>{relativeTime(item.receivedAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.light,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[2],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[500],
  },
  content: { flex: 1, gap: 2 },
  title: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
  },
  body: {
    fontSize: Typography.size.xs + 1,
    color: Colors.text.secondary,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  time: {
    fontSize: Typography.size.xs,
    color: Colors.neutral[400],
    marginTop: 2,
  },
});
