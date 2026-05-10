import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase/client';
import { getUserProfile, signIn, signOut, signUp, resetPassword } from '@/services/supabase/auth';
import { registerForPushNotifications } from '@/services/notifications/registerToken';

export function useAuth() {
  const { session, user, isLoading, setSession, setUser, setLoading, clear } = useAuthStore();

  useEffect(() => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('session_timeout')), 5000)
    );

    Promise.race([supabase.auth.getSession(), timeout])
      .then(({ data }) => {
        setSession(data.session);
        if (data.session?.user) {
          getUserProfile(data.session.user.id).then(setUser);
        }
      })
      .catch(() => {
        setSession(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'TOKEN_REFRESHED' && !newSession) {
        clear();
        setLoading(false);
        return;
      }
      setSession(newSession);
      if (newSession?.user) {
        const profile = await getUserProfile(newSession.user.id);
        setUser(profile);
        if (profile) {
          registerForPushNotifications(profile.id).catch(() => {});
        }
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    await signIn(email, password);
  }

  async function register(email: string, password: string, fullName: string) {
    await signUp(email, password, fullName);
  }

  async function logout() {
    await signOut();
    clear();
  }

  async function forgotPassword(email: string) {
    await resetPassword(email);
  }

  return { session, user, isLoading, login, register, logout, forgotPassword };
}
