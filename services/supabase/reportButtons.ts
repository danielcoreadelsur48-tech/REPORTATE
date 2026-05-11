import { supabase } from './client';
import { DBReportButton, DBCustomReport } from '@/types/database';
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
  'name' | 'icon' | 'activation_time' | 'window_minutes' | 'is_home_button' | 'sort_order'
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
    if (error.code === '23505') throw new Error('Ya existe un botón de casa para este grupo');
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

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe un botón de casa para este grupo');
    throw error;
  }
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
