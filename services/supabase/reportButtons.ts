import { supabase } from './client';
import { DBReportButton, DBCustomReport } from '@/types/database';
import type { DayActivityItem, PendingMember } from '@/types';
import { parseWKBPoint } from '@/utils/parseWKB';
import {
  requestLocationPermission,
  getCurrentLocation,
} from '@/services/location/getCurrentLocation';

export async function getGroupButtons(groupId: string): Promise<DBReportButton[]> {
  const { data, error } = await supabase
    .from('report_buttons')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DBReportButton[];
}

type ButtonPayload = Pick<
  DBReportButton,
  'name' | 'icon' | 'activation_time' | 'window_minutes' | 'is_home_button' | 'sort_order' | 'active_days'
>;

export async function createButton(
  groupId: string,
  payload: ButtonPayload,
): Promise<DBReportButton> {
  const { data, error } = await supabase
    .from('report_buttons')
    .insert({ group_id: groupId, is_active: true, ...payload })
    .select()
    .single();

  if (error) {
    if (error.code === 'P0001') throw new Error('Máximo 5 botones activos por grupo');
    throw error;
  }
  return data as DBReportButton;
}

export async function updateButton(
  buttonId: string,
  updates: Partial<ButtonPayload>,
): Promise<DBReportButton> {
  const { data, error } = await supabase
    .from('report_buttons')
    .update(updates)
    .eq('id', buttonId)
    .select()
    .single();

  if (error) throw error;
  return data as DBReportButton;
}

export async function deactivateButton(buttonId: string): Promise<void> {
  const { error } = await supabase
    .from('report_buttons')
    .update({ is_active: false })
    .eq('id', buttonId);

  if (error) throw error;
}

export async function getTodayCustomReports(
  userId: string,
  groupId: string,
  isCaptain: boolean,
): Promise<DBCustomReport[]> {
  const windowDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

  const { data, error } = await supabase
    .from('custom_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .eq('window_date', windowDate);

  if (error) throw error;
  const rows = (data ?? []) as DBCustomReport[];

  if (!isCaptain) {
    return rows.map((r) => ({ ...r, location: null }));
  }
  return rows;
}


export async function insertHomeArrival(params: {
  userId: string;
  groupId: string;
  location?: { lat: number; lng: number };
}): Promise<void> {
  const payload: Record<string, unknown> = {
    user_id: params.userId,
    group_id: params.groupId,
  };
  if (params.location) {
    payload.location = `POINT(${params.location.lng} ${params.location.lat})`;
  }
  payload.report_date = new Date().toLocaleDateString('en-CA');
  const { error } = await supabase.from('home_arrivals').insert(payload);
  if (error) throw error;
}

export async function getTodayGroupActivity(groupId: string): Promise<DayActivityItem[]> {
  const today = new Date().toLocaleDateString('en-CA');
  const [{ data: reports, error: e1 }, { data: arrivals, error: e2 }] = await Promise.all([
    supabase
      .from('custom_reports')
      .select('id, created_at, user_id, location, users(full_name, avatar_url), report_buttons(name, icon)')
      .eq('group_id', groupId)
      .eq('window_date', today)
      .order('created_at', { ascending: false }),
    supabase
      .from('home_arrivals')
      .select('id, created_at, user_id, location, users(full_name, avatar_url)')
      .eq('group_id', groupId)
      .eq('report_date', today)
      .order('created_at', { ascending: false }),
  ]);

  if (e1) throw e1;
  if (e2) throw e2;

  const reportItems: DayActivityItem[] = (reports ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userFullName: row.users?.full_name ?? '',
    userAvatarUrl: row.users?.avatar_url ?? null,
    buttonName: row.report_buttons?.name ?? '',
    buttonIcon: row.report_buttons?.icon ?? '',
    createdAt: row.created_at,
    location: typeof row.location === 'string' ? parseWKBPoint(row.location) : null,
  }));

  const arrivalItems: DayActivityItem[] = (arrivals ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userFullName: row.users?.full_name ?? '',
    userAvatarUrl: row.users?.avatar_url ?? null,
    buttonName: 'Llegada a casa',
    buttonIcon: 'home',
    createdAt: row.created_at,
    location: typeof row.location === 'string' ? parseWKBPoint(row.location) : null,
  }));

  return [...reportItems, ...arrivalItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getMembersWithoutCustomReport(groupId: string): Promise<PendingMember[]> {
  const today = new Date().toLocaleDateString('en-CA');
  const [membersResult, reportersResult] = await Promise.all([
    supabase
      .from('group_members')
      .select('user_id, role, users(full_name, avatar_url)')
      .eq('group_id', groupId),
    supabase
      .from('custom_reports')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('window_date', today),
  ]);

  if (membersResult.error) throw membersResult.error;
  const reportedSet = new Set((reportersResult.data ?? []).map((r) => r.user_id));
  return (membersResult.data ?? [])
    .filter((m: any) => !reportedSet.has(m.user_id))
    .map((m: any) => ({
      userId: m.user_id,
      fullName: m.users?.full_name ?? '',
      avatarUrl: m.users?.avatar_url ?? null,
      role: m.role as 'captain' | 'member',
    }));
}

interface PressButtonParams {
  buttonId: string;
  userId: string;
  groupId: string;
  isHomeButton: boolean;
  windowDate: string;
  activationTime: string;
  windowMinutes: number;
}

export async function pressButton(params: PressButtonParams): Promise<DBCustomReport> {
  const { buttonId, userId, groupId, isHomeButton, windowDate, activationTime, windowMinutes } =
    params;

  let locationStr: string | undefined;

  if (isHomeButton) {
    const granted = await requestLocationPermission();
    if (granted) {
      try {
        const loc = await getCurrentLocation();
        locationStr = `POINT(${loc.lng} ${loc.lat})`;
      } catch {
        // Graceful degradation: proceed without location if GPS fails
      }
    }
  }

  const payload: Record<string, unknown> = {
    button_id: buttonId,
    user_id: userId,
    group_id: groupId,
    window_date: windowDate,
    activation_time: activationTime,
    window_minutes: windowMinutes,
  };

  if (locationStr) {
    payload.location = locationStr;
  }

  const { data, error } = await supabase
    .from('custom_reports')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as DBCustomReport;
}
