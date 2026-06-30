import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useGroupStore } from '@/store/groupStore';
import { DayActivityContent } from '@/components/features/DayActivityContent';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

export default function NotificationsScreen() {
  const [isFocused, setIsFocused] = useState(false);
  const groups = useGroupStore((s) => s.groups);
  const activeGroupId = useGroupStore((s) => s.activeGroupId);
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const isCaptain = activeGroup?.role === 'captain';
  const isDark = useColorScheme() === 'dark';

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? Colors.neutral[0] : Colors.text.primary }]}>
          {STRINGS.NOTIFICATIONS_SCREEN.TITLE}
        </Text>
        <Text style={styles.subtitle}>{STRINGS.ACTIVITY_SHEET.TITLE}</Text>
      </View>

      {!activeGroupId ? (
        <EmptyState
          icon="notifications-outline"
          title={STRINGS.NOTIFICATIONS_SCREEN.EMPTY_TITLE}
          description={STRINGS.NOTIFICATIONS_SCREEN.EMPTY_DESC}
        />
      ) : (
        <View style={styles.content}>
          <DayActivityContent groupId={activeGroupId} isCaptain={isCaptain ?? false} isActive={isFocused} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
  },
});
