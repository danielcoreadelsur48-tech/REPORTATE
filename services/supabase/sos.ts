import { supabase } from './client';
import { DBSOSEvent } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

export async function activateSOS(
  userId: string,
  groupId: string,
  location: { lat: number; lng: number },
): Promise<DBSOSEvent> {
  const { data, error } = await supabase
    .from('sos_events')
    .insert({
      user_id: userId,
      group_id: groupId,
      location: `POINT(${location.lng} ${location.lat})`,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data as DBSOSEvent;
}

export async function updateSOSLocation(
  sosId: string,
  location: { lat: number; lng: number },
): Promise<void> {
  const { error } = await supabase
    .from('sos_events')
    .update({ location: `POINT(${location.lng} ${location.lat})` })
    .eq('id', sosId);
  if (error) throw error;
}

export async function resolveSOS(sosId: string): Promise<void> {
  const { error } = await supabase
    .from('sos_events')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', sosId);
  if (error) throw error;
}

export async function getActiveSOSForGroup(groupId: string): Promise<DBSOSEvent[]> {
  const { data, error } = await supabase
    .from('sos_events')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'active');
  if (error) throw error;
  return (data ?? []) as DBSOSEvent[];
}

export function subscribeToGroupSOS(
  groupId: string,
  onUpdate: (event: DBSOSEvent) => void,
): RealtimeChannel {
  return supabase
    .channel(`sos_${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sos_events',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onUpdate(payload.new as DBSOSEvent),
    )
    .subscribe();
}
