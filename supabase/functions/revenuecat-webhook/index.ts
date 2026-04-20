// Supabase Edge Function: RevenueCat webhook handler
// Deno runtime. Deployed via `supabase functions deploy revenuecat-webhook --no-verify-jwt`.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

type RCEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'UNCANCELLATION'
  | 'PRODUCT_CHANGE'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | string;

interface RCWebhookBody {
  event: {
    type: RCEventType;
    app_user_id: string;
    expiration_at_ms?: number | null;
  };
}

const PREMIUM_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']);
const FREE_EVENTS = new Set(['CANCELLATION', 'EXPIRATION']);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Auth check
  const auth = req.headers.get('Authorization') ?? '';
  const expected = `Bearer ${Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? ''}`;
  if (!auth || auth !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: RCWebhookBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const ev = body?.event;
  if (!ev?.app_user_id || !ev?.type) {
    return new Response('Malformed event', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  if (PREMIUM_EVENTS.has(ev.type)) {
    const expires = ev.expiration_at_ms ? new Date(ev.expiration_at_ms).toISOString() : null;
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'premium', plan_expires_at: expires })
      .eq('id', ev.app_user_id);
    if (error) {
      console.error('RC webhook DB error (premium):', error);
      return new Response('DB error', { status: 500 });
    }
  } else if (FREE_EVENTS.has(ev.type)) {
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'free', plan_expires_at: null })
      .eq('id', ev.app_user_id);
    if (error) {
      console.error('RC webhook DB error (free):', error);
      return new Response('DB error', { status: 500 });
    }
  }
  // Other event types: acknowledge with 200.

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
