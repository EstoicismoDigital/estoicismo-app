# RevenueCat Webhook Edge Function

Receives RevenueCat server-side webhook events and updates `profiles.plan` in Supabase.

## Deploy

```bash
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

The `--no-verify-jwt` flag is required because RevenueCat authenticates via a shared bearer secret, not a Supabase JWT. The function implements its own `Authorization: Bearer <secret>` check.

## Required environment variables

Set via `supabase secrets set`:

- `REVENUECAT_WEBHOOK_SECRET` — shared secret configured in the RevenueCat dashboard. Must match the value in the `Authorization` header that RevenueCat sends.
- `SUPABASE_URL` — auto-populated by Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — auto-populated by Supabase.

Example:

```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET='your-long-random-secret'
```

## RevenueCat dashboard configuration

In the RevenueCat dashboard, add a webhook with:

- **URL:** `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`
- **Authorization header:** `Bearer <same secret as REVENUECAT_WEBHOOK_SECRET>`

## Event handling

| Event type | Action |
|---|---|
| `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION`, `PRODUCT_CHANGE` | Set `plan='premium'`, `plan_expires_at` from `event.expiration_at_ms` (ISO). |
| `CANCELLATION`, `EXPIRATION` | Set `plan='free'`, `plan_expires_at=null`. |
| Any other type | Ignored (returns 200). |

## User matching

`event.app_user_id` must equal the Supabase user ID (`profiles.id`). The mobile client passes this as `appUserID` when initializing the Purchases SDK.

## Responses

- `200 { ok: true }` — event processed (or ignored).
- `400` — malformed body / missing fields.
- `401` — missing or mismatched `Authorization` header.
- `405` — non-POST request.
- `500` — Supabase update error (details in function logs).
