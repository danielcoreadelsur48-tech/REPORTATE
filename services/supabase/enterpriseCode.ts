import { supabase } from './client';
import { updateUserProfile } from './auth';

export async function redeemEnterpriseCode(userId: string, code: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from('enterprise_codes')
    .select('id')
    .eq('code', normalized)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) throw new Error('Código inválido');

  await updateUserProfile(userId, { has_coe_access: true });
}
