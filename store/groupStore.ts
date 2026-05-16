import { create } from 'zustand';
import { GroupWithRole, MemberWithStatus } from '@/types';

interface GroupState {
  groups: GroupWithRole[];
  activeGroupId: string | null;
  members: MemberWithStatus[];
  isLoadingGroups: boolean;
  isLoadingMembers: boolean;
  setGroups: (groups: GroupWithRole[]) => void;
  setActiveGroupId: (id: string | null) => void;
  setMembers: (members: MemberWithStatus[]) => void;
  setLoadingGroups: (v: boolean) => void;
  setLoadingMembers: (v: boolean) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  activeGroupId: null,
  members: [],
  isLoadingGroups: true,
  isLoadingMembers: false,
  setGroups: (groups) => set({ groups }),
  setActiveGroupId: (activeGroupId) => set({ activeGroupId }),
  setMembers: (members) => set({ members }),
  setLoadingGroups: (isLoadingGroups) => set({ isLoadingGroups }),
  setLoadingMembers: (isLoadingMembers) => set({ isLoadingMembers }),
}));
