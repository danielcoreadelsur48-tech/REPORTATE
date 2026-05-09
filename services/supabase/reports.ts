import { supabase } from './client';
import { DBReport, ReportType } from '@/types/database';

export async function getTodayReports(userId: string, groupId: string): Promise<DBReport[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DBReport[];
}

export async function insertReport(
  userId: string,
  groupId: string,
  type: ReportType,
  location?: { lat: number; lng: number },
): Promise<DBReport> {
  const payload: Record<string, unknown> = { user_id: userId, group_id: groupId, type };

  if (type === 'end' && location) {
    payload.location = `POINT(${location.lng} ${location.lat})`;
  }

  const { data, error } = await supabase
    .from('reports')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as DBReport;
}

export async function getMembersWithoutEndReport(groupId: string): Promise<string[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  const { data: endReports } = await supabase
    .from('reports')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('type', 'end')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`);

  const completedIds = new Set((endReports ?? []).map((r) => r.user_id));
  return (members ?? [])
    .map((m) => m.user_id)
    .filter((id) => !completedIds.has(id));
}
