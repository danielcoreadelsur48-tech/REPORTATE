import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase/client';
import { getUserProfile, signIn, signOut, signUp, resetPassword } from '@/services/supabase/auth';
import { registerForPushNotifications } from '@/services/notifications/registerToken';

async function fetchUserProfile(userId: string, retries = 2) {
  for (let i = 0; i < retries; i++) {
    const profile = await Promise.race([
      getUserProfile(userId),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    if (profile) return profile;
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

export function useAuth() {
  const { session, user, isLoading, setSession, setUser, setLoading, setLoadingUser, clear } = useAuthStore();

  useEffect(() => {
    let resolved = false;

    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setLoadingUser(false);
    }, 10000);

    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimer);
        }
        setSession(data.session);
        setLoading(false);
        if (data.session?.user) {
          const profile = await fetchUserProfile(data.session.user.id);
          if (profile) setUser(profile);
        }
        setLoadingUser(false);
      })
      .catch(() => {
        setLoadingUser(false);
      })
      .finally(() => {
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimer);
        }
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'INITIAL_SESSION') return;
      if (event === 'TOKEN_REFRESHED' && !newSession) {
        clear();
        setLoading(false);
        return;
      }
      setSession(newSession);
      if (newSession?.user) {
        const profile = await fetchUserProfile(newSession.user.id);
        if (profile) setUser(profile);
        setLoadingUser(false);
        setLoading(false);
        if (profile) {
          registerForPushNotifications(profile.id).catch((e) => console.warn('[Push] Token registration failed:', e));
        }
      } else {
        setUser(null);
        setLoadingUser(false);
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
    const data = await signUp(email, password, fullName);
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

  async function logout() {
    await signOut();
    clear();
  }

  async function forgotPassword(email: string) {
    await resetPassword(email);
  }

  return { session, user, isLoading, login, register, logout, forgotPassword };
}
