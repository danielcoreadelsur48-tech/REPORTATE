import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase/client';
import { getUserProfile, signIn, signOut, signUp, resetPassword } from '@/services/supabase/auth';
import { registerForPushNotifications } from '@/services/notifications/registerToken';

export function useAuth() {
  const { session, user, isLoading, setSession, setUser, setLoading, clear } = useAuthStore();

  useEffect(() => {
    let resolved = false;

    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 10000);

    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimer);
        }
        setSession(data.session);
        if (data.session?.user) {
          const profile = await getUserProfile(data.session.user.id);
          setUser(profile);
        }
      })
      .catch(() => {
        // silent — onAuthStateChange maneja la recuperación
      })
      .finally(() => {
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimer);
        }
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
        setLoading(false);
        if (profile) {
          registerForPushNotifications(profile.id).catch((e) => console.warn('[Push] Token registration failed:', e));
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    const data = await signIn(email, password);
    if (data?.session) {
      setLoading(true);
      setSession(data.session);
      const profile = await getUserProfile(data.session.user.id);
      setUser(profile);
      setLoading(false);
      if (profile) {
        registerForPushNotifications(profile.id).catch((e) =>
          console.warn('[Push] Token registration failed:', e)
        );
      }
    }
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
