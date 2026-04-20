// Supabase Edge Function: Stripe webhook handler
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
import Stripe from 'https://esm.sh/stripe@22.0.2?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2026-03-25.dahlia',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const PREMIUM_STATUSES = new Set(['active', 'trialing']);
const FREE_STATUSES = new Set(['canceled', 'unpaid', 'incomplete_expired']);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!sig || !secret) {
    return new Response('Missing signature or secret', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret, undefined, cryptoProvider);
  } catch (err) {
    console.error('Stripe signature verification failed:', err);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) {
        console.warn('checkout.session.completed missing supabase_user_id metadata');
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

      // Fetch subscription to get current_period_end for plan_expires_at
      let expiresAt: string | null = null;
      if (session.subscription) {
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        // @ts-expect-error current_period_end is on Subscription but SDK types may vary
        if (sub.current_period_end) {
          // @ts-expect-error
          expiresAt = new Date(sub.current_period_end * 1000).toISOString();
        }
      }

      const update: Record<string, unknown> = { plan: 'premium', plan_expires_at: expiresAt };
      if (customerId) update.stripe_customer_id = customerId;

      const { error } = await supabase.from('profiles').update(update).eq('id', userId);
      if (error) throw error;
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) {
        console.warn('subscription.updated missing supabase_user_id metadata');
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (PREMIUM_STATUSES.has(sub.status)) {
        // @ts-expect-error
        const expires = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'premium', plan_expires_at: expires })
          .eq('id', userId);
        if (error) throw error;
      } else if (FREE_STATUSES.has(sub.status)) {
        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'free', plan_expires_at: null })
          .eq('id', userId);
        if (error) throw error;
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) {
        console.warn('subscription.deleted missing supabase_user_id metadata');
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'free', plan_expires_at: null })
        .eq('id', userId);
      if (error) throw error;
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
