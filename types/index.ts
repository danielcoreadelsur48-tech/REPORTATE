export * from './database';
import type { DBReportButton } from './database';

export interface MemberWithStatus {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: 'captain' | 'member';
  journeyStatus: 'started' | 'ended' | 'none';
  startedAt: string | null;
  endedAt: string | null;
}

export interface GroupWithRole {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  role: 'captain' | 'member';
  memberCount: number;
}

export interface ActiveSOS {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  lat: number;
  lng: number;
  activated_at: string;
}

export interface ReportButtonWithState extends DBReportButton {
  status: 'upcoming' | 'active' | 'completed' | 'expired';
  windowStart: Date;
  windowEnd: Date;
  pressedAt: string | null;   // ISO string if pressed in this window, else null
}
