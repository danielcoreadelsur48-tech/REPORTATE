import { supabase } from '@/services/supabase/client';
import { NotificationType } from '@/types/database';

interface SendNotificationPayload {
  groupId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendGroupNotification(payload: SendNotificationPayload): Promise<void> {
  const { error } = await supabase.functions.invoke('send-notification', {
    body: payload,
  });
  if (error) throw error;
}
