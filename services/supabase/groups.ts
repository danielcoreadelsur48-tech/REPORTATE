import { supabase } from './client';
import { DBGroup, DBGroupMember, DBInvitation, GroupWithRole, MemberWithStatus } from '@/types';
import { CONFIG } from '@/constants/config';

export async function getUserGroups(userId: string): Promise<GroupWithRole[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      role,
      groups (id, name, description, avatar_url)
    `)
    .eq('user_id', userId);

  if (error) throw error;

  const result: GroupWithRole[] = [];
  for (const row of data ?? []) {
    const g = row.groups as unknown as DBGroup;
    if (!g) continue;
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', g.id);
    result.push({
      id: g.id,
      name: g.name,
      description: g.description,
      avatar_url: g.avatar_url,
      created_by: '',
      role: row.role as 'captain' | 'member',
      memberCount: count ?? 0,
    });
  }

  if (result.length > 0) {
    const ids = result.map((g) => g.id);
    const { data: groupRows } = await supabase
      .from('groups')
      .select('id, created_by')
      .in('id', ids);
    const creatorMap = new Map((groupRows ?? []).map((r) => [r.id, r.created_by as string]));
    for (const g of result) g.created_by = creatorMap.get(g.id) ?? '';
  }

  return result;
}

export async function createGroup(
  userId: string,
  name: string,
  description?: string,
): Promise<DBGroup> {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, description: description ?? null, created_by: userId })
    .select()
    .single();

  if (groupError) throw groupError;

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'captain' });

  if (memberError) throw memberError;

  return group as DBGroup;
}

export async function generateInvitation(groupId: string, createdBy: string): Promise<DBInvitation> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const token = Array.from({ length: CONFIG.INVITATION_CODE_LENGTH })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('');

  const expiresAt = new Date(
    Date.now() + CONFIG.INVITATION_EXPIRY_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('invitations')
    .insert({ group_id: groupId, token, created_by: createdBy, expires_at: expiresAt })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DBInvitation;
}

export async function joinGroupByToken(userId: string, token: string): Promise<void> {
  const { data: inv, error: invError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token.toUpperCase())
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (invError || !inv) throw new Error('Código inválido o expirado');

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: inv.group_id, user_id: userId, role: 'member' });

  if (memberError) {
    if (memberError.code === '23505') throw new Error('Ya eres miembro de este grupo');
    throw memberError;
  }

  await supabase
    .from('invitations')
    .update({ used_at: new Date().toISOString(), used_by: userId })
    .eq('id', inv.id);
}

export async function getGroupMembers(groupId: string): Promise<MemberWithStatus[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data: members, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      role,
      users (full_name, avatar_url)
    `)
    .eq('group_id', groupId);

  if (error) throw error;

  const { data: reports } = await supabase
    .from('reports')
    .select('user_id, type, created_at')
    .eq('group_id', groupId)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`);

  const reportMap = new Map<string, { start?: string; end?: string }>();
  for (const r of reports ?? []) {
    const entry = reportMap.get(r.user_id) ?? {};
    if (r.type === 'start') entry.start = r.created_at;
    if (r.type === 'end') entry.end = r.created_at;
    reportMap.set(r.user_id, entry);
  }

  return (members ?? []).map((m) => {
    const user = m.users as unknown as { full_name: string; avatar_url: string | null };
    const rep = reportMap.get(m.user_id) ?? {};
    return {
      user_id: m.user_id,
      full_name: user?.full_name ?? 'Desconocido',
      avatar_url: user?.avatar_url ?? null,
      role: m.role as 'captain' | 'member',
      journeyStatus: rep.end ? 'ended' : rep.start ? 'started' : 'none',
      startedAt: rep.start ?? null,
      endedAt: rep.end ?? null,
    } satisfies MemberWithStatus;
  });
}

export async function getMemberRole(groupId: string, userId: string): Promise<'captain' | 'member' | null> {
  const { data, error } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data.role as 'captain' | 'member';
}

export async function getGroupById(groupId: string): Promise<DBGroup | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();
  if (error) return null;
  return data as DBGroup;
}

export async function updateMemberRole(
  groupId: string,
  userId: string,
  role: 'captain' | 'member',
  promotedBy?: string,
): Promise<void> {
  const update = role === 'captain'
    ? { role, promoted_by: promotedBy ?? null, promoted_at: new Date().toISOString() }
    : { role, promoted_by: null, promoted_at: null };
  const { error } = await supabase
    .from('group_members')
    .update(update)
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function revokeMemberRole(groupId: string, userId: string): Promise<void> {
  await updateMemberRole(groupId, userId, 'member');
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);
  if (error) throw error;
}
