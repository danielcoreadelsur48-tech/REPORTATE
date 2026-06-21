import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationItem } from '@/components/features/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { STRINGS } from '@/constants/strings';

export default function NotificationsScreen() {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clearAll = useNotificationStore((s) => s.clearAll);

  useFocusEffect(
    useCallback(() => {
      markAllRead();
    }, [markAllRead]),
  );

  function handleClearAll() {
    Alert.alert(
      STRINGS.NOTIFICATIONS_SCREEN.CLEAR_CONFIRM_TITLE,
      undefined,
      [
        { text: STRINGS.NOTIFICATIONS_SCREEN.CLEAR_CONFIRM_CANCEL, style: 'cancel' },
        { text: STRINGS.NOTIFICATIONS_SCREEN.CLEAR_CONFIRM_OK, style: 'destructive', onPress: clearAll },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.NOTIFICATIONS_SCREEN.TITLE}</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} accessibilityLabel={STRINGS.NOTIFICATIONS_SCREEN.CLEAR_ALL}>
            <Text style={styles.clearBtn}>{STRINGS.NOTIFICATIONS_SCREEN.CLEAR_ALL}</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title={STRINGS.NOTIFICATIONS_SCREEN.EMPTY_TITLE}
          description={STRINGS.NOTIFICATIONS_SCREEN.EMPTY_DESC}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {notifications.map((n) => (
            <NotificationItem key={n.id} item={n} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.light },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
  },
  clearBtn: {
    fontSize: Typography.size.sm,
    color: Colors.danger.DEFAULT,
    fontWeight: Typography.weight.medium,
  },
  list: { paddingTop: Spacing[2], paddingBottom: Spacing[8] },
});
