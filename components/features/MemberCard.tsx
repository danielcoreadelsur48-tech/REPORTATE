import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MemberWithStatus } from '@/types';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';
import { formatTime } from '@/utils/formatDate';

interface MemberCardProps {
  member: MemberWithStatus;
  isGroupCreator?: boolean;
  onPromote?: () => void;
  onRevoke?: () => void;
}

export function MemberCard({ member, isGroupCreator, onPromote, onRevoke }: MemberCardProps) {
  const statusConfig = {
    ended: { label: STRINGS.GROUP.STATUS_ENDED, variant: 'success' as const },
    started: { label: STRINGS.GROUP.STATUS_ACTIVE, variant: 'primary' as const },
    none: { label: STRINGS.GROUP.STATUS_NONE, variant: 'neutral' as const },
  }[member.journeyStatus];

  return (
    <Card style={styles.card}>
      <Avatar uri={member.avatar_url} name={member.full_name} size={44} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{member.full_name}</Text>
          {member.role === 'captain' && (
            <Badge label={STRINGS.GROUP.CAPTAIN_BADGE} variant="primary" />
          )}
          {member.role === 'captain' && isGroupCreator && (
            <Ionicons name="star" size={14} color={Colors.warning.DEFAULT} />
          )}
          {onPromote && (
            <TouchableOpacity onPress={onPromote} accessibilityLabel="Promover a Admin" hitSlop={8}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary[500]} />
            </TouchableOpacity>
          )}
          {onRevoke && (
            <TouchableOpacity onPress={onRevoke} accessibilityLabel="Quitar rol Admin" hitSlop={8}>
              <Ionicons name="shield-remove-outline" size={20} color={Colors.danger.DEFAULT} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.statusRow}>
          <Badge label={statusConfig.label} variant={statusConfig.variant} />
          {member.journeyStatus === 'ended' && member.endedAt && (
            <Text style={styles.time}>{formatTime(member.endedAt)}</Text>
          )}
          {member.journeyStatus === 'started' && member.startedAt && (
            <Text style={styles.time}>{formatTime(member.startedAt)}</Text>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[2],
  },
  info: { flex: 1, gap: Spacing[1] },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  name: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  time: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
  },
});
