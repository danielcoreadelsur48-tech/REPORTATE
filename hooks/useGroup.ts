import { useCallback } from 'react';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import {
  getUserGroups,
  createGroup,
  generateInvitation,
  joinGroupByToken,
  getGroupMembers,
} from '@/services/supabase/groups';

export function useGroup() {
  const { groups, activeGroupId, members, isLoadingGroups, isLoadingMembers,
    setGroups, setActiveGroupId, setMembers, setLoadingGroups, setLoadingMembers } = useGroupStore();
  const { user } = useAuthStore();

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

  const loadGroups = useCallback(async () => {
    if (!user) return;
    setLoadingGroups(true);
    try {
      const data = await getUserGroups(user.id);
      setGroups(data);
      if (data.length > 0 && !activeGroupId) {
        setActiveGroupId(data[0].id);
      }
    } finally {
      setLoadingGroups(false);
    }
  }, [user]);

  const loadMembers = useCallback(async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const data = await getGroupMembers(groupId);
      setMembers(data);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const create = useCallback(async (name: string, description?: string) => {
    if (!user) throw new Error('No autenticado');
    const group = await createGroup(user.id, name, description);
    await loadGroups();
    setActiveGroupId(group.id);
    return group;
  }, [user, loadGroups]);

  const invite = useCallback(async (groupId: string) => {
    if (!user) throw new Error('No autenticado');
    return generateInvitation(groupId, user.id);
  }, [user]);

  const joinByCode = useCallback(async (code: string) => {
    if (!user) throw new Error('No autenticado');
    await joinGroupByToken(user.id, code);
    await loadGroups();
  }, [user, loadGroups]);

  return {
    groups,
    activeGroup,
    activeGroupId,
    members,
    isLoadingGroups,
    isLoadingMembers,
    setActiveGroupId,
    loadGroups,
    loadMembers,
    create,
    invite,
    joinByCode,
  };
}
