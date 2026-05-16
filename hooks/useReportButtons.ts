import { useState, useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { getGroupButtons, getTodayCustomReports, pressButton } from '@/services/supabase/reportButtons';
import { sendGroupNotification } from '@/services/notifications/sendNotification';
import { useAuthStore } from '@/store/authStore';
import { STRINGS } from '@/constants/strings';
import { CONFIG } from '@/constants/config';
import { DBReportButton, DBCustomReport } from '@/types/database';
import { ReportButtonWithState } from '@/types/index';

function computeWindowBounds(button: DBReportButton, day: Date): { start: Date; end: Date } {
  const [h, m] = button.activation_time.split(':').map(Number);
  const start = new Date(day);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + button.window_minutes * 60_000);
  return { start, end };
}

function computeStatus(
  button: DBReportButton,
  now: Date,
  pressedReport: DBCustomReport | undefined,
): ReportButtonWithState['status'] {
  const activeDays = button.active_days ?? [0, 1, 2, 3, 4, 5, 6];
  if (!activeDays.includes(now.getDay())) return 'day_inactive';
  const { start, end } = computeWindowBounds(button, now);
  if (now < start) return 'upcoming';
  if (now > end) return pressedReport ? 'completed' : 'expired';
  return pressedReport ? 'completed' : 'active';
}

function buildButtonsWithState(
  rawButtons: DBReportButton[],
  pressedReports: DBCustomReport[],
  now: Date,
): ReportButtonWithState[] {
  return rawButtons.map((btn) => {
    const pressed = pressedReports.find((r) => r.button_id === btn.id);
    const { start, end } = computeWindowBounds(btn, now);
    return {
      ...btn,
      status: computeStatus(btn, now, pressed),
      windowStart: start,
      windowEnd: end,
      pressedAt: pressed?.created_at ?? null,
    };
  });
}

const NOTIF_ID_PREFIX = 'report-btn-';

async function scheduleButtonReminders(buttons: DBReportButton[]): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  for (const btn of buttons) {
    const [h, m] = btn.activation_time.split(':').map(Number);
    const activeDays = btn.active_days ?? [0, 1, 2, 3, 4, 5, 6];
    const content = {
      title: STRINGS.NOTIFICATIONS.BUTTON_REMINDER_TITLE,
      body: STRINGS.NOTIFICATIONS.BUTTON_REMINDER_BODY.replace('{buttonName}', btn.name),
      sound: true,
      data: { buttonId: btn.id },
    };

    try {
      if (activeDays.length === 7) {
        // All days — single daily trigger is sufficient
        await Notifications.scheduleNotificationAsync({
          identifier: `${NOTIF_ID_PREFIX}${btn.id}`,
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: h,
            minute: m,
            channelId: 'default',
          },
        });
      } else {
        // One weekly trigger per active day
        // Expo weekday: 1=Sun, 2=Mon, ..., 7=Sat  →  jsDay + 1
        for (const day of activeDays) {
          await Notifications.scheduleNotificationAsync({
            identifier: `${NOTIF_ID_PREFIX}${btn.id}-d${day}`,
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: day + 1,
              hour: h,
              minute: m,
              channelId: 'default',
            },
          });
        }
      }
    } catch (e) {
      console.warn(`[useReportButtons] Failed to schedule reminder for button ${btn.id}:`, e);
    }
  }
}

async function cancelButtonReminders(buttons: DBReportButton[]): Promise<void> {
  for (const btn of buttons) {
    try {
      // Cancel daily variant (used when all days are active)
      await Notifications.cancelScheduledNotificationAsync(`${NOTIF_ID_PREFIX}${btn.id}`);
      // Cancel all possible weekly variants regardless of current active_days
      for (let d = 0; d < 7; d++) {
        await Notifications.cancelScheduledNotificationAsync(`${NOTIF_ID_PREFIX}${btn.id}-d${d}`);
      }
    } catch {
      // Notifications may not exist — safe to ignore
    }
  }
}

export function useReportButtons(groupId: string | null, isCaptain: boolean) {
  const { user } = useAuthStore();
  const [rawButtons, setRawButtons] = useState<DBReportButton[]>([]);
  const rawButtonsRef = useRef<DBReportButton[]>([]);
  const [pressedReports, setPressedReports] = useState<DBCustomReport[]>([]);
  const [buttons, setButtons] = useState<ReportButtonWithState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  rawButtonsRef.current = rawButtons;
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recomputeStatuses = useCallback((raw: DBReportButton[], pressed: DBCustomReport[]) => {
    setButtons(buildButtonsWithState(raw, pressed, new Date()));
  }, []);

  const load = useCallback(async () => {
    if (!user || !groupId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedButtons, fetchedReports] = await Promise.all([
        getGroupButtons(groupId),
        getTodayCustomReports(user.id, groupId, isCaptain),
      ]);
      setRawButtons(fetchedButtons);
      setPressedReports(fetchedReports);
      setButtons(buildButtonsWithState(fetchedButtons, fetchedReports, new Date()));
      await cancelButtonReminders(rawButtons);
      await scheduleButtonReminders(fetchedButtons);
    } catch (e) {
      setError(e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
    } finally {
      setIsLoading(false);
    }
  }, [user, groupId, isCaptain]);

  // Cancel reminders when group changes or component unmounts
  useEffect(() => {
    return () => { cancelButtonReminders(rawButtonsRef.current); };
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start ticker after first successful load
  useEffect(() => {
    if (rawButtons.length === 0) return;

    tickerRef.current = setInterval(() => {
      recomputeStatuses(rawButtons, pressedReports);
    }, CONFIG.BUTTON_WINDOW_TICKER_MS);

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [rawButtons, pressedReports, recomputeStatuses]);

  const press = useCallback(
    async (button: ReportButtonWithState) => {
      if (!user || !groupId) return;
      if (button.status !== 'active') return;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setError(null);
      try {
        const windowDate = new Date().toLocaleDateString('en-CA');
        const report = await pressButton({
          buttonId: button.id,
          userId: user.id,
          groupId,
          isHomeButton: button.is_home_button,
          windowDate,
          activationTime: button.activation_time,
          windowMinutes: button.window_minutes,
        });

        // Optimistic update
        const updatedPressed = [...pressedReports, report];
        setPressedReports(updatedPressed);
        recomputeStatuses(rawButtons, updatedPressed);

        await sendGroupNotification({
          groupId,
          type: 'CUSTOM_REPORT',
          title: STRINGS.REPORT_BUTTONS.SECTION_TITLE,
          body: STRINGS.NOTIFICATIONS.CUSTOM_REPORT
            .replace('{name}', user.full_name)
            .replace('{buttonName}', button.name),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : STRINGS.ERRORS.GENERIC);
        throw e;
      }
    },
    [user, groupId, rawButtons, pressedReports, recomputeStatuses],
  );

  return { buttons, isLoading, error, load, press };
}
