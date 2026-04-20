# Premium Billing — Design Spec

> **Para implementadores:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans` para ejecutar el plan de implementación que deriva de este spec.

**Goal:** Implementar el sistema de monetización completo — RevenueCat para IAP móvil (iOS/Android) y Stripe para pagos web — con ambos canales actualizando `profiles.plan` en Supabase vía Edge Functions.

**Plataforma:** Mobile (`apps/mobile`) + Web (`apps/web`) + Supabase Edge Functions.

**Plan anterior completado:** Plan 2 (Hábitos MVP) — hábitos CRUD, rachas, notificaciones, free-tier enforcement hardcodeado.

---

## Arquitectura general

```
iOS/Android  →  RevenueCat SDK  →  Edge Function: revenuecat-webhook  →  profiles.plan
Web (Next.js) →  Stripe Checkout →  Edge Function: stripe-webhook      →  profiles.plan
```

La tabla `profiles` ya tiene `plan TEXT DEFAULT 'free'` y `plan_expires_at`. Se añade solo `stripe_customer_id TEXT UNIQUE` via migración.

El hook `useProfile` (nuevo) es la fuente de verdad del plan en toda la app. El free-tier enforcement en `useHabits` se actualiza para leer de `useProfile` en lugar de estar hardcodeado.

---

## Precios y productos

| Canal | Plan | Precio | Identificador |
|---|---|---|---|
| RevenueCat (iOS/Android) | Mensual | $4.99/mes | `estoicismo_premium_monthly` |
| RevenueCat (iOS/Android) | Anual | $39.99/año | `estoicismo_premium_annual` |
| Stripe (Web) | Mensual | $4.99/mes | `STRIPE_PRICE_MONTHLY_ID` (env) |
| Stripe (Web) | Anual | $39.99/año | `STRIPE_PRICE_ANNUAL_ID` (env) |

El plan **anual** se destaca visualmente (ahorra 33%).

### ¿Qué desbloquea premium?

| Característica | Free | Premium |
|---|---|---|
| Hábitos activos | Máx. 3 | Ilimitados |
| Historial de rachas | 7 días | Completo |
| Módulos futuros (Finanzas, Mente, Emprende) | ❌ | ✅ |

---

## Estructura de archivos

```
apps/mobile/
├── hooks/
│   └── useProfile.ts                       ← NUEVO: TanStack Query → profiles
├── lib/
│   └── purchases.ts                        ← NUEVO: RevenueCat init + helpers
├── components/
│   └── premium/
│       └── PaywallModal.tsx                ← NUEVO: paywall on-brand
└── app/(tabs)/habitos/index.tsx            ← MODIFICAR: usar useProfile para gates

apps/web/
├── lib/
│   └── stripe.ts                          ← NUEVO: Stripe server client
├── app/
│   ├── api/
│   │   └── stripe/
│   │       └── create-checkout/
│   │           └── route.ts               ← NUEVO: crea Checkout Session
│   └── (dashboard)/
│       └── upgrade/
│           ├── page.tsx                   ← NUEVO: pricing page
│           └── success/
│               └── page.tsx              ← NUEVO: post-pago success

supabase/
├── migrations/
│   └── 20260420000000_add_stripe_customer_id.sql  ← NUEVO
└── functions/
    ├── revenuecat-webhook/
    │   └── index.ts                       ← NUEVO: maneja eventos RevCat
    └── stripe-webhook/
        └── index.ts                       ← NUEVO: maneja eventos Stripe
```

---

## Mobile — RevenueCat

### Setup manual (una vez, previo a desarrollo)

1. Crear proyecto en [app.revenuecat.com](https://app.revenuecat.com)
2. Crear Entitlement: `premium`
3. Crear Offering: `default` con dos packages:
   - `$rc_monthly` → producto `estoicismo_premium_monthly`
   - `$rc_annual` → producto `estoicismo_premium_annual`
4. Configurar webhook a: `https://[project-ref].functions.supabase.co/revenuecat-webhook`
5. Copiar API Key pública → `EXPO_PUBLIC_REVENUECAT_API_KEY` en `.env`
6. Copiar Webhook Signing Secret → Supabase Secret `REVENUECAT_WEBHOOK_SECRET`

### `lib/purchases.ts`

```typescript
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

export function initializePurchases(userId: string): void {
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
    appUserID: userId, // Supabase user ID = RevCat app_user_id
  });
}

export async function getPremiumOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo.entitlements.active['premium'] !== undefined;
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active['premium'] !== undefined;
}

export async function getCustomerInfo() {
  return Purchases.getCustomerInfo();
}
```

### `hooks/useProfile.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

async function fetchProfile(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, plan, plan_expires_at, streak_freeze_count')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
```

### Tipos `types/profile.ts`

```typescript
export interface Profile {
  id: string;
  plan: 'free' | 'premium';
  plan_expires_at: string | null;
  streak_freeze_count: number;
}
```

### `components/premium/PaywallModal.tsx`

Modal pantalla completa (`presentation: 'modal'`). Layout:

```
╔══════════════════════════════════╗
║  ✕ Cancelar                      ║  ← JetBrains Mono, color muted
║                                  ║
║   ⭐  Estoicismo Premium         ║  ← Lora italic 28px, color ink
║   Desbloquea tu potencial        ║  ← Lora regular 16px, color muted
║   completo                       ║
║                                  ║
║  ✓  Hábitos ilimitados           ║  ← Inter 15px, checkmark accent
║  ✓  Historial completo de rachas ║
║  ✓  Módulos futuros incluidos    ║
║  ✓  Sin publicidad               ║
║                                  ║
║  [$39.99/año  —  AHORRA 33%]     ║  ← botón accent (principal)
║  [$4.99 / mes]                   ║  ← botón outline (secundario)
║                                  ║
║  Restaurar compra                ║  ← JetBrains Mono 11px, underline
║  Términos · Privacidad           ║  ← JetBrains Mono 10px, muted
╚══════════════════════════════════╝
```

**Estados:**
- Loading: spinner mientras carga offerings de RevCat
- Error: si RevCat no responde → "Intenta de nuevo"
- Purchasing: botón en estado loading durante compra
- Success: `queryClient.invalidateQueries(['profile'])` → cierra modal

**Triggers del PaywallModal:**
1. `habitos/index.tsx`: free user toca FAB con 3+ hábitos
2. (Futuro) tabs Finanzas/Mente/Emprende verifican plan

### Actualizar `app/(tabs)/habitos/index.tsx`

El guard actual usa `plan: 'free'` hardcodeado. Reemplazar con:

```typescript
const { data: profile } = useProfile();
// ...
// En el handler del FAB:
if (habits.length >= 3 && profile?.plan === 'free') {
  setPaywallVisible(true);
  return;
}
```

---

## Web — Stripe

### Setup manual (una vez, previo a desarrollo)

1. Crear Product en [dashboard.stripe.com](https://dashboard.stripe.com) → "Estoicismo Premium"
2. Crear dos Prices:
   - Mensual: $4.99/mes recurrente → copiar Price ID → `STRIPE_PRICE_MONTHLY_ID`
   - Anual: $39.99/año recurrente → copiar Price ID → `STRIPE_PRICE_ANNUAL_ID`
3. Activar webhook en Stripe → URL: `https://[project-ref].functions.supabase.co/stripe-webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copiar Webhook Secret → Supabase Secret `STRIPE_WEBHOOK_SECRET`
5. Variables en `apps/web/.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PRICE_MONTHLY_ID=price_...
   STRIPE_PRICE_ANNUAL_ID=price_...
   NEXT_PUBLIC_APP_URL=https://tu-dominio.com
   ```

### `lib/stripe.ts`

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});
```

### `app/api/stripe/create-checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase-server';
import { stripe } from '../../../../lib/stripe';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { priceId } = await req.json() as { priceId: string };
  const allowedPrices = [
    process.env.STRIPE_PRICE_MONTHLY_ID!,
    process.env.STRIPE_PRICE_ANNUAL_ID!,
  ];
  if (!allowedPrices.includes(priceId)) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  }

  // Get or create stripe_customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
```

### `app/(dashboard)/upgrade/page.tsx`

Página de pricing web con diseño on-brand (Lora + Inter + JetBrains Mono). Muestra los dos planes con el anual destacado. El botón "Suscribirse" llama al API route y redirige a Stripe Checkout.

### `app/(dashboard)/upgrade/success/page.tsx`

Pantalla de éxito post-pago. Mensaje: "¡Bienvenido a Premium!" + CTA a dashboard. No necesita verificar el pago (el webhook lo hace; la UI solo confirma visualmente).

---

## Supabase Edge Functions

### `supabase/functions/revenuecat-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('REVENUECAT_WEBHOOK_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { event } = body;
  const supabaseUserId: string = event.app_user_id;
  const expiresAt: string | null = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const premiumEvents = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION'];
  const freeEvents = ['CANCELLATION', 'EXPIRATION'];

  if (premiumEvents.includes(event.type)) {
    await supabase.from('profiles').update({
      plan: 'premium',
      plan_expires_at: expiresAt,
    }).eq('id', supabaseUserId);
  } else if (freeEvents.includes(event.type)) {
    await supabase.from('profiles').update({
      plan: 'free',
      plan_expires_at: null,
    }).eq('id', supabaseUserId);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-01-27.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

    await supabase.from('profiles').update({
      plan: 'premium',
      plan_expires_at: expiresAt,
    }).eq('id', userId);
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.supabase_user_id;
    const expiresAt = new Date(sub.current_period_end * 1000).toISOString();
    await supabase.from('profiles').update({
      plan: 'premium',
      plan_expires_at: expiresAt,
    }).eq('id', userId);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.supabase_user_id;
    await supabase.from('profiles').update({
      plan: 'free',
      plan_expires_at: null,
    }).eq('id', userId);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## Migración DB

```sql
-- supabase/migrations/20260420000000_add_stripe_customer_id.sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
```

---

## Variables de entorno necesarias

### `apps/mobile/.env`
```
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_...
```

### `apps/web/.env.local`
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_ANNUAL_ID=price_...
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### Supabase Secrets (via `supabase secrets set`)
```
REVENUECAT_WEBHOOK_SECRET=<RevCat webhook auth header value>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## TypeScript types

```typescript
// apps/mobile/types/profile.ts  (stripe_customer_id solo existe en DB/servidor web)
export interface Profile {
  id: string;
  plan: 'free' | 'premium';
  plan_expires_at: string | null;
  streak_freeze_count: number;
}
```

---

## Tests

- `apps/mobile/__tests__/profile.test.ts`:
  - `useProfile` retorna `plan: 'free'` para usuario nuevo
  - `useProfile` retorna `plan: 'premium'` cuando DB tiene plan premium
- `apps/mobile/__tests__/paywall.test.tsx`:
  - Renderiza PaywallModal con los dos planes
  - Botón "Restaurar compra" llama a `restorePurchases()`

---

## Fuera de alcance (Plan 4+)

- Stripe Customer Portal (gestionar/cancelar desde web)
- Trial period
- Streak freeze coins
- Analytics de conversión (RevCat built-in dashboard es suficiente por ahora)
- Web: mostrar estado premium en dashboard header
