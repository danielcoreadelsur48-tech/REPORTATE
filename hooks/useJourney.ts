import { useState, useCallback } from 'react';
import { getTodayReports, insertReport } from '@/services/supabase/reports';
import { getCurrentLocation, requestLocationPermission } from '@/services/location/getCurrentLocation';
import { sendGroupNotification } from '@/services/notifications/sendNotification';
import { useAuthStore } from '@/store/authStore';
import { STRINGS } from '@/constants/strings';
import { DBReport } from '@/types/database';

export function useJourney(groupId: string | null) {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<DBReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStart = reports.find((r) => r.type === 'start');
  const todayEnd = reports.find((r) => r.type === 'end');
  const hasStarted = !!todayStart;
  const hasEnded = !!todayEnd;

  const loadReports = useCallback(async () => {
    if (!user || !groupId) return;
    const data = await getTodayReports(user.id, groupId);
    setReports(data);
  }, [user, groupId]);

  const startJourney = useCallback(async () => {
    if (!user || !groupId) return;
    if (hasStarted) throw new Error(STRINGS.ERRORS.JOURNEY_ALREADY_STARTED);

    setIsLoading(true);
    setError(null);
    try {
      const report = await insertReport(user.id, groupId, 'start');
      setReports((prev) => [...prev, report]);

      await sendGroupNotification({
        groupId,
        type: 'JOURNEY_START',
        title: 'Inicio de jornada',
        body: STRINGS.NOTIFICATIONS.JOURNEY_START.replace('{name}', user.full_name),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [user, groupId, hasStarted]);

  const endJourney = useCallback(async () => {
    if (!user || !groupId) return;
    if (!hasStarted) throw new Error(STRINGS.ERRORS.NO_ACTIVE_JOURNEY);
    if (hasEnded) return;

    setIsLoading(true);
    setError(null);
    try {
      const hasPermission = await requestLocationPermission();
      let location: { lat: number; lng: number } | undefined;
      if (hasPermission) {
        location = await getCurrentLocation();
      }

      const report = await insertReport(user.id, groupId, 'end', location);
      setReports((prev) => [...prev, report]);

      await sendGroupNotification({
        groupId,
        type: 'JOURNEY_END',
        title: 'Fin de jornada',
        body: STRINGS.NOTIFICATIONS.JOURNEY_END.replace('{name}', user.full_name),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [user, groupId, hasStarted, hasEnded]);

  return {
    hasStarted,
    hasEnded,
    todayStart,
    todayEnd,
    reports,
    isLoading,
    error,
    loadReports,
    startJourney,
    endJourney,
  };
}
