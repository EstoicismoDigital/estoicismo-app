# stripe-webhook

Supabase Edge Function that receives Stripe webhooks and updates `profiles.plan`.

## Deploy

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

The `--no-verify-jwt` flag is required because Stripe calls this endpoint without a Supabase JWT; request authenticity is verified via the `stripe-signature` header.

## Secrets

Set these in the Supabase project (Project Settings → Edge Functions → Secrets):

- `STRIPE_SECRET_KEY` — Stripe secret API key (`sk_live_...` or `sk_test_...`).
- `STRIPE_WEBHOOK_SECRET` — Signing secret of the webhook endpoint (`whsec_...`), shown in Stripe dashboard after creating the endpoint.

These are auto-injected by the platform:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Stripe dashboard setup

1. Dashboard → Developers → Webhooks → **Add endpoint**.
2. Endpoint URL: `https://tezcxsgpqcsuopyajptl.supabase.co/functions/v1/stripe-webhook`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Event handling

| Event | Action |
| --- | --- |
| `checkout.session.completed` | `plan='premium'`, set `plan_expires_at` from subscription `current_period_end`, persist `stripe_customer_id`. User id read from `session.metadata.supabase_user_id`. |
| `customer.subscription.updated` | If status is `active` or `trialing` → premium with new expiry. If `canceled`, `unpaid`, `incomplete_expired` → free. |
| `customer.subscription.deleted` | `plan='free'`, clear `plan_expires_at`. |

User id for subscription events comes from `subscription.metadata.supabase_user_id` (set by `create-checkout`). If missing, the handler logs a warning and returns 200 to avoid Stripe retries.

## Signature verification

Uses `stripe.webhooks.constructEventAsync` with `Stripe.createSubtleCryptoProvider()` because Deno has no Node `crypto` module; the sync `constructEvent` would fail.
