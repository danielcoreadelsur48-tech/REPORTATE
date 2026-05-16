import { supabase } from './client';
import { DBUser } from '@/types/database';
import { STRINGS } from '@/constants/strings';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('[Auth] signIn error:', error.message, error);
    if (error.message.includes('Invalid login credentials')) {
      throw new Error(STRINGS.ERRORS.INVALID_CREDENTIALS);
    }
    throw new Error(STRINGS.ERRORS.GENERIC);
  }
  return data;
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: 'reportate://verify-email',
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'reportate://reset-password',
  });
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUserProfile(userId: string): Promise<DBUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as DBUser;
}

export async function updateUserProfile(userId: string, updates: Partial<DBUser>) {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}

export async function updatePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('users')
    .update({ expo_push_token: token })
    .eq('id', userId);
  if (error) throw error;
}
