import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { DBUser } from '@/types/database';

interface AuthState {
  session: Session | null;
  user: DBUser | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: DBUser | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ session: null, user: null }),
}));
