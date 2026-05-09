import { useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { LocationSubscription } from 'expo-location';
import { useSOSStore } from '@/store/sosStore';
import { useAuthStore } from '@/store/authStore';
import { activateSOS, resolveSOS, updateSOSLocation } from '@/services/supabase/sos';
import { getCurrentLocation, watchLocation, requestLocationPermission } from '@/services/location/getCurrentLocation';
import { sendGroupNotification } from '@/services/notifications/sendNotification';
import { STRINGS } from '@/constants/strings';

export function useSOS() {
  const { isActive, sosId, groupId, activate, deactivate } = useSOSStore();
  const { user } = useAuthStore();
  const locationWatcher = useRef<LocationSubscription | null>(null);

  const triggerSOS = useCallback(async (targetGroupId: string) => {
    if (!user) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) throw new Error(STRINGS.ERRORS.LOCATION_DENIED);

    const location = await getCurrentLocation();
    const sos = await activateSOS(user.id, targetGroupId, location);
    activate(sos.id, targetGroupId);

    locationWatcher.current = await watchLocation(
      async (coords) => {
        await updateSOSLocation(sos.id, coords).catch(() => {});
      },
      () => {},
    );

    await sendGroupNotification({
      groupId: targetGroupId,
      type: 'SOS_ACTIVATED',
      title: '🆘 Emergencia SOS',
      body: STRINGS.NOTIFICATIONS.SOS_ACTIVATED.replace('{name}', user.full_name),
      data: { sosId: sos.id },
    });
  }, [user]);

  const cancelSOS = useCallback(async () => {
    if (!sosId || !groupId || !user) return;

    locationWatcher.current?.remove();
    locationWatcher.current = null;

    await resolveSOS(sosId);
    deactivate();

    await sendGroupNotification({
      groupId,
      type: 'SOS_RESOLVED',
      title: 'SOS desactivado',
      body: STRINGS.NOTIFICATIONS.SOS_RESOLVED.replace('{name}', user.full_name),
    });
  }, [sosId, groupId, user]);

  return { isActive, triggerSOS, cancelSOS };
}
