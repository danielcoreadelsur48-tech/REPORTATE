import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface Payload {
  groupId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  recipientRole?: 'captain' | 'member';
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const payload: Payload = await req.json();
  const { groupId, title, body, data } = payload;

  let query = supabase
    .from('group_members')
    .select('users!user_id(expo_push_token)')
    .eq('group_id', groupId);

  if (payload.recipientRole) {
    query = query.eq('role', payload.recipientRole);
  }

  const { data: members, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tokens: string[] = [];
  for (const m of members ?? []) {
    const token = (m.users as { expo_push_token: string | null } | null)?.expo_push_token;
    if (token) tokens.push(token);
  }

  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = tokens.map((to) => ({ to, title, body, data: data ?? {}, sound: 'default' }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });

  const result = await response.json();

  return new Response(JSON.stringify({ sent: tokens.length, result }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
