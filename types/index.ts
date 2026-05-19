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
  hasReportedToday: boolean;
  lastReportedAt: string | null;
}

export interface GroupWithRole {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  role: 'captain' | 'member';
  memberCount: number;
  created_by: string;
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
  status: 'upcoming' | 'active' | 'completed' | 'expired' | 'day_inactive';
  windowStart: Date;
  windowEnd: Date;
  pressedAt: string | null;   // ISO string if pressed in this window, else null
}

export interface DayActivityItem {
  id: string;
  userId: string;
  userFullName: string;
  userAvatarUrl: string | null;
  buttonName: string;
  buttonIcon: string;
  createdAt: string;
  location: { lat: number; lng: number } | null;
}

export interface DaySOSItem {
  id: string;
  userId: string;
  userFullName: string;
  userAvatarUrl: string | null;
  status: 'active' | 'resolved';
  activatedAt: string;
  resolvedAt: string | null;
  location: { lat: number; lng: number } | null;
}

export interface PendingMember {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: 'captain' | 'member';
}
