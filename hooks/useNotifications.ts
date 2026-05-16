import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';

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
    if (onReceive) {
      receivedSub.current = Notifications.addNotificationReceivedListener(onReceive);
    }
    return () => {
      receivedSub.current?.remove();
    };
  }, [onReceive]);
}
