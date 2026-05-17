export interface DBUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  expo_push_token: string | null;
  created_at: string;
}

export interface DBGroup {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
}

export type GroupRole = 'captain' | 'member';

export interface DBGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  promoted_by: string | null;
  promoted_at: string | null;
}

export interface DBInvitation {
  id: string;
  group_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}

export type ReportType = 'start' | 'end';

export interface DBReport {
  id: string;
  user_id: string;
  group_id: string;
  type: ReportType;
  location: { lat: number; lng: number } | null;
  created_at: string;
}

export type SOSStatus = 'active' | 'resolved';

export interface DBSOSEvent {
  id: string;
  user_id: string;
  group_id: string;
  location: { lat: number; lng: number } | null;
  status: SOSStatus;
  activated_at: string;
  resolved_at: string | null;
}

export type NotificationType =
  | 'JOURNEY_START'
  | 'JOURNEY_END'
  | 'ABSENCE_ALERT'
  | 'SOS_ACTIVATED'
  | 'SOS_RESOLVED'
  | 'CUSTOM_REPORT'
  | 'HOME_ARRIVAL';

// ── Report Buttons ───────────────────────────────────────────────────────────

export interface DBReportButton {
  id: string;
  group_id: string;
  name: string;
  icon: string;
  activation_time: string;   // "HH:MM:SS" as returned by Postgres time column
  window_minutes: number;
  is_home_button: boolean;
  sort_order: number;
  is_active: boolean;
  active_days: number[];     // JS day-of-week numbers: 0=Sun … 6=Sat
  created_at: string;
}

export interface DBCustomReport {
  id: string;
  button_id: string;
  user_id: string;
  group_id: string;
  location: { lat: number; lng: number } | null;
  window_date: string;       // "YYYY-MM-DD"
  activation_time: string;   // "HH:MM:SS"
  window_minutes: number;
  created_at: string;
}

export interface DBHomeArrival {
  id: string;
  user_id: string;
  group_id: string;
  location: string | null;
  created_at: string;
}
