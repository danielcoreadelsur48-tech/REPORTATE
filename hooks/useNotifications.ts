import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationType } from '@/types/database';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1A56DB',
  });
}

export function useNotifications(onReceive?: (notification: Notifications.Notification) => void) {
  const receivedSub = useRef<Subscription>();

  useEffect(() => {
    receivedSub.current = Notifications.addNotificationReceivedListener((notification) => {
      const { content, identifier } = notification.request;
      if (!content.title && !content.body) return;
      useNotificationStore.getState().add({
        id: identifier,
        type: (content.data?.type as NotificationType) ?? 'UNKNOWN',
        title: content.title ?? '',
        body: content.body ?? '',
        receivedAt: new Date().toISOString(),
        isRead: false,
        data: (content.data as Record<string, unknown>) ?? {},
      });
      onReceive?.(notification);
    });
    return () => {
      receivedSub.current?.remove();
    };
  }, [onReceive]);
}
