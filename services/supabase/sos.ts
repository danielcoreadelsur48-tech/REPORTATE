import { supabase } from './client';
import { DBSOSEvent } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { DaySOSItem } from '@/types';
import { parseWKBPoint } from '@/utils/parseWKB';

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

export async function getTodayGroupSOSEvents(groupId: string): Promise<DaySOSItem[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('sos_events')
    .select('id, status, activated_at, resolved_at, user_id, location, users(full_name, avatar_url)')
    .eq('group_id', groupId)
    .gte('activated_at', `${today}T00:00:00.000Z`)
    .order('activated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userFullName: row.users?.full_name ?? '',
    userAvatarUrl: row.users?.avatar_url ?? null,
    status: row.status,
    activatedAt: row.activated_at,
    resolvedAt: row.resolved_at,
    location: typeof row.location === 'string' ? parseWKBPoint(row.location) : null,
  }));
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
