import { create } from 'zustand';

interface SOSState {
  isActive: boolean;
  sosId: string | null;
  groupId: string | null;
  activate: (sosId: string, groupId: string) => void;
  deactivate: () => void;
}

export const useSOSStore = create<SOSState>((set) => ({
  isActive: false,
  sosId: null,
  groupId: null,
  activate: (sosId, groupId) => set({ isActive: true, sosId, groupId }),
  deactivate: () => set({ isActive: false, sosId: null, groupId: null }),
}));
