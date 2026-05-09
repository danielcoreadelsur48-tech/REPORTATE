import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
