# Premium Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar RevenueCat IAP móvil + Stripe web payments, con ambos canales actualizando `profiles.plan` en Supabase vía Edge Functions y un `useProfile` hook como fuente de verdad.

**Architecture:** RevenueCat SDK maneja iOS/Android IAP. Stripe Checkout maneja pagos web. Ambos disparan Supabase Edge Functions que actualizan `profiles.plan`. El hook `useProfile` (TanStack Query) lee el plan desde Supabase y lo inyecta en toda la UI. El `PaywallModal` es custom, on-brand, con precios hardcodeados en la UI y RevCat packages para el flujo de compra nativo.

**Tech Stack:** `react-native-purchases` v8 (RevCat), `stripe` Node SDK, Supabase Edge Functions (Deno), TanStack Query v5, Next.js 15 App Router.

---

## File Map

**Create:**
- `supabase/migrations/20260420000000_add_stripe_customer_id.sql`
- `apps/mobile/__mocks__/react-native-purchases.ts`
- `apps/mobile/types/profile.ts`
- `apps/mobile/lib/purchases.ts`
- `apps/mobile/hooks/useProfile.ts`
- `apps/mobile/components/premium/PaywallModal.tsx`
- `apps/mobile/__tests__/profile.test.ts`
- `apps/mobile/__tests__/paywall.test.tsx`
- `apps/web/lib/stripe.ts`
- `apps/web/app/api/stripe/create-checkout/route.ts`
- `apps/web/app/(dashboard)/upgrade/page.tsx`
- `apps/web/app/(dashboard)/upgrade/success/page.tsx`
- `apps/web/__tests__/create-checkout.test.ts`
- `supabase/functions/revenuecat-webhook/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

**Modify:**
- `apps/mobile/jest.config.js` — moduleNameMapper for react-native-purchases
- `apps/mobile/app.json` — add react-native-purchases Expo plugin
- `apps/mobile/app/_layout.tsx` — call initializePurchases on auth state change
- `apps/mobile/app/(tabs)/habitos/index.tsx` — swap Alert for PaywallModal, drive gate with useProfile

---

## Task 1: DB Migration — stripe_customer_id

**Files:**
- Create: `supabase/migrations/20260420000000_add_stripe_customer_id.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- supabase/migrations/20260420000000_add_stripe_customer_id.sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Call `mcp__apply_migration` with:
- `project_id`: `tezcxsgpqcsuopyajptl`
- `name`: `add_stripe_customer_id`
- `query`: the SQL above

Expected: migration applied without error. If MCP is not available, run:
```bash
cd /Users/macbookpro/Desktop/APP\ ESTOICISMO/estoicismo-app
pnpm supabase db push
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
git add supabase/migrations/20260420000000_add_stripe_customer_id.sql
git commit -m "feat(db): add stripe_customer_id to profiles"
```

---

## Task 2: Install react-native-purchases + jest mock

**Files:**
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/jest.config.js`
- Create: `apps/mobile/__mocks__/react-native-purchases.ts`

`react-native-purchases` is a native Expo module — requires a dev build, NOT Expo Go. In jest, it must be mocked because native code cannot run in Node.

- [ ] **Step 1: Install the package**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm add react-native-purchases --filter @estoicismo/mobile
```

Expected: package added to `apps/mobile/package.json` dependencies.

- [ ] **Step 2: Add Expo config plugin to app.json**

Read `apps/mobile/app.json`. In the `"plugins"` array, add `"react-native-purchases"` as the last entry:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#8B6F47"
        }
      ],
      "react-native-purchases"
    ]
  }
}
```

- [ ] **Step 3: Create jest manual mock**

Create `apps/mobile/__mocks__/react-native-purchases.ts`:

```typescript
// Manual mock for react-native-purchases — used in jest tests.
// This mock replaces the native RevenueCat module which cannot run in Node.

export const LOG_LEVEL = {
  VERBOSE: 'VERBOSE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export const PACKAGE_TYPE = {
  MONTHLY: '$rc_monthly',
  ANNUAL: '$rc_annual',
  WEEKLY: '$rc_weekly',
  LIFETIME: '$rc_lifetime',
  CUSTOM: '$rc_custom',
  UNKNOWN: '$rc_unknown',
} as const;

const Purchases = {
  setLogLevel: jest.fn(),
  configure: jest.fn(),
  getOfferings: jest.fn().mockResolvedValue({
    current: { availablePackages: [] },
  }),
  purchasePackage: jest.fn().mockResolvedValue({
    customerInfo: { entitlements: { active: {} } },
  }),
  restorePurchases: jest.fn().mockResolvedValue({
    entitlements: { active: {} },
  }),
  getCustomerInfo: jest.fn().mockResolvedValue({
    entitlements: { active: {} },
  }),
};

export default Purchases;
```

- [ ] **Step 4: Add moduleNameMapper to jest.config.js**

Read `apps/mobile/jest.config.js`. Add `moduleNameMapper` so jest uses the manual mock:

```javascript
// pnpm-compatible transformIgnorePatterns
const ALLOW_LIST = [
  "(jest-)?react-native",
  "@react-native(-community)?",
  "@react-native/",
  "expo(nent)?",
  "@expo(nent)?/",
  "@expo-google-fonts/",
  "react-navigation",
  "@react-navigation/",
  "@unimodules/",
  "unimodules",
  "sentry-expo",
  "native-base",
  "react-native-svg",
  "lucide-react-native",
  "@estoicismo/",
].join("|");

module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    `node_modules/\\.pnpm/.*?/node_modules/(?!(${ALLOW_LIST}))`,
    `node_modules/(?!(\\.pnpm/|${ALLOW_LIST}))`,
  ],
  moduleNameMapper: {
    "^react-native-purchases$": "<rootDir>/__mocks__/react-native-purchases.ts",
  },
};
```

- [ ] **Step 5: Verify tests still pass**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm --filter @estoicismo/mobile test
```

Expected: all existing tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.json apps/mobile/jest.config.js apps/mobile/__mocks__/react-native-purchases.ts pnpm-lock.yaml
git commit -m "feat(mobile): install react-native-purchases + jest mock"
```

---

## Task 3: Profile types + lib/purchases.ts + _layout.tsx init

**Files:**
- Create: `apps/mobile/types/profile.ts`
- Create: `apps/mobile/lib/purchases.ts`
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Create profile types**

Create `apps/mobile/types/profile.ts`:

```typescript
// Profile type read from Supabase profiles table.
// stripe_customer_id is not exposed to the mobile client — it lives only on the server.
export interface Profile {
  id: string;
  plan: 'free' | 'premium';
  plan_expires_at: string | null;
  streak_freeze_count: number;
}
```

- [ ] **Step 2: Create lib/purchases.ts**

Create `apps/mobile/lib/purchases.ts`:

```typescript
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';

/**
 * Call once when user session is established.
 * Uses Supabase user ID as RevenueCat app_user_id so webhook payloads
 * contain the Supabase user ID directly.
 */
export function initializePurchases(userId: string): void {
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '',
    appUserID: userId,
  });
}

/**
 * Returns available packages from the current RevenueCat offering.
 * Returns [] if RevenueCat is not configured or has no offerings.
 */
export async function getPremiumOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

/**
 * Purchase a package. Returns true if the 'premium' entitlement is now active.
 * Throws with { userCancelled: true } if user cancelled — caller should swallow this.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo.entitlements.active['premium'] !== undefined;
}

/**
 * Restore previous purchases. Returns true if 'premium' entitlement is active.
 */
export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active['premium'] !== undefined;
}
```

- [ ] **Step 3: Update _layout.tsx to init RevenueCat on auth**

Read `apps/mobile/app/_layout.tsx`. Add import and init call:

```typescript
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  useFonts,
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_600SemiBold,
  Lora_700Bold,
} from "@expo-google-fonts/lora";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "../lib/supabase";
import { initializePurchases } from "../lib/purchases";
import { colors } from "@estoicismo/ui";
import type { Session } from "@supabase/supabase-js";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
});

function AuthGuard({
  session,
  fontsLoaded,
}: {
  session: Session | null;
  fontsLoaded: boolean;
}) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!fontsLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";

    if (!session && !inAuthGroup && !inOnboarding) {
      router.replace("/(onboarding)");
    } else if (session && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)/habitos");
    }
  }, [session, segments, fontsLoaded, router]);

  return null;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);

  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
    Lora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Initialize RevenueCat as soon as we know the user's identity.
      // Safe to call multiple times — RevenueCat re-configures idempotently.
      if (session?.user) {
        initializePurchases(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGuard session={session} fontsLoaded={fontsLoaded} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 4: Verify tests still pass**

```bash
pnpm --filter @estoicismo/mobile test
```

Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/types/profile.ts apps/mobile/lib/purchases.ts apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): add Profile types, purchases lib, init RevenueCat on auth"
```

---

## Task 4: hooks/useProfile.ts (TDD)

**Files:**
- Create: `apps/mobile/__tests__/profile.test.ts`
- Create: `apps/mobile/hooks/useProfile.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/mobile/__tests__/profile.test.ts`:

```typescript
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfile } from '../hooks/useProfile';

// Mock supabase entirely — avoids network calls and SecureStore native issues
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'user-1',
          plan: 'free',
          plan_expires_at: null,
          streak_freeze_count: 0,
        },
        error: null,
      }),
    }),
  },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useProfile', () => {
  it('returns plan: free for a new user', async () => {
    const { result } = renderHook(() => useProfile(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.plan).toBe('free');
    expect(result.current.data?.streak_freeze_count).toBe(0);
  });

  it('returns plan: premium when DB row has premium', async () => {
    // Override the mock for this test only
    const { supabase } = require('../lib/supabase');
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'user-1',
          plan: 'premium',
          plan_expires_at: '2027-01-01T00:00:00Z',
          streak_freeze_count: 2,
        },
        error: null,
      }),
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.plan).toBe('premium');
    expect(result.current.data?.plan_expires_at).toBe('2027-01-01T00:00:00Z');
  });

  it('returns error state when not authenticated', async () => {
    const { supabase } = require('../lib/supabase');
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Not authenticated');
  });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm --filter @estoicismo/mobile test -- --testPathPattern="profile.test" --no-coverage
```

Expected: FAIL — `Cannot find module '../hooks/useProfile'`

- [ ] **Step 3: Create hooks/useProfile.ts**

Create `apps/mobile/hooks/useProfile.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

async function fetchProfile(): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, plan, plan_expires_at, streak_freeze_count')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data as Profile;
}

/**
 * Reads the authenticated user's profile from Supabase.
 * Cache: 5 minutes. Use queryClient.invalidateQueries(['profile'])
 * after a purchase to refresh the plan.
 */
export function useProfile() {
  return useQuery<Profile, Error>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
  });
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
pnpm --filter @estoicismo/mobile test -- --testPathPattern="profile.test" --no-coverage
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/__tests__/profile.test.ts apps/mobile/hooks/useProfile.ts
git commit -m "feat(mobile): add useProfile hook (TDD)"
```

---

## Task 5: PaywallModal component (TDD)

**Files:**
- Create: `apps/mobile/__tests__/paywall.test.tsx`
- Create: `apps/mobile/components/premium/PaywallModal.tsx`

- [ ] **Step 1: Write failing tests**

Create `apps/mobile/__tests__/paywall.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaywallModal } from '../components/premium/PaywallModal';

// Mock purchases lib
jest.mock('../lib/purchases', () => ({
  getPremiumOfferings: jest.fn().mockResolvedValue([
    {
      packageType: '$rc_annual',
      product: { priceString: '$39.99', identifier: 'estoicismo_premium_annual' },
    },
    {
      packageType: '$rc_monthly',
      product: { priceString: '$4.99', identifier: 'estoicismo_premium_monthly' },
    },
  ]),
  purchasePackage: jest.fn().mockResolvedValue(true),
  restorePurchases: jest.fn().mockResolvedValue(false),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('PaywallModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders annual and monthly pricing', async () => {
    const { findByText } = render(
      <PaywallModal visible={true} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    // Annual price from RevCat offering
    await findByText(/\$39\.99/);
    // Monthly price from RevCat offering
    await findByText(/\$4\.99/);
  });

  it('renders premium feature list', async () => {
    const { findByText } = render(
      <PaywallModal visible={true} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    await findByText('Hábitos ilimitados');
    await findByText('Historial completo de rachas');
  });

  it('calls restorePurchases when restore button is pressed', async () => {
    const { restorePurchases } = require('../lib/purchases');
    const { findByText } = render(
      <PaywallModal visible={true} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    const restoreBtn = await findByText('Restaurar compra');
    fireEvent.press(restoreBtn);
    await waitFor(() => expect(restorePurchases).toHaveBeenCalledTimes(1));
  });

  it('does not render when visible=false', () => {
    const { queryByText } = render(
      <PaywallModal visible={false} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    expect(queryByText('Estoicismo Premium')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
pnpm --filter @estoicismo/mobile test -- --testPathPattern="paywall.test" --no-coverage
```

Expected: FAIL — `Cannot find module '../components/premium/PaywallModal'`

- [ ] **Step 3: Create PaywallModal component**

Create `apps/mobile/components/premium/PaywallModal.tsx`:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Text, colors, spacing, fontFamilies, fontSizes } from '@estoicismo/ui';
import {
  getPremiumOfferings,
  purchasePackage,
  restorePurchases,
} from '../../lib/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

const FEATURES = [
  'Hábitos ilimitados',
  'Historial completo de rachas',
  'Módulos futuros incluidos',
  'Sin publicidad',
] as const;

const ANNUAL_TYPE = '$rc_annual';
const MONTHLY_TYPE = '$rc_monthly';

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const queryClient = useQueryClient();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getPremiumOfferings()
      .then((pkgs) => {
        if (mountedRef.current) setPackages(pkgs);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [visible]);

  async function handlePurchase(pkg: PurchasesPackage | undefined) {
    if (!pkg) {
      Alert.alert(
        'No disponible',
        'Los planes no están disponibles en este momento. Intenta más tarde.',
      );
      return;
    }
    setPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        onClose();
      }
    } catch (err: unknown) {
      // RevenueCat throws { userCancelled: true } when user cancels — don't show error
      const isCancelled =
        err !== null &&
        typeof err === 'object' &&
        'userCancelled' in err &&
        (err as { userCancelled: boolean }).userCancelled === true;
      if (!isCancelled) {
        Alert.alert('Error', 'No se pudo completar la compra. Intenta de nuevo.');
      }
    } finally {
      if (mountedRef.current) setPurchasing(false);
    }
  }

  async function handleRestore() {
    try {
      const isPremium = await restorePurchases();
      if (isPremium) {
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        onClose();
      } else {
        Alert.alert(
          'Sin compras',
          'No encontramos compras anteriores para restaurar.',
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo restaurar. Intenta de nuevo.');
    }
  }

  const annualPkg = packages.find((p) => p.packageType === ANNUAL_TYPE);
  const monthlyPkg = packages.find((p) => p.packageType === MONTHLY_TYPE);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Close button */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Text style={styles.closeText}>✕ Cancelar</Text>
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>⭐</Text>
          <Text style={styles.heroTitle}>Estoicismo Premium</Text>
          <Text style={styles.heroSub}>Desbloquea tu potencial completo</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        {loading ? (
          <ActivityIndicator
            color={colors.accent}
            style={styles.loader}
            testID="paywall-loading"
          />
        ) : (
          <View style={styles.pricing}>
            {/* Annual — primary, highlighted */}
            <Pressable
              onPress={() => handlePurchase(annualPkg)}
              disabled={purchasing}
              style={[styles.btnPrimary, purchasing && styles.btnDisabled]}
              accessibilityRole="button"
            >
              {purchasing ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {annualPkg?.product.priceString ?? '$39.99'}/año — AHORRA 33%
                </Text>
              )}
            </Pressable>

            {/* Monthly — secondary */}
            <Pressable
              onPress={() => handlePurchase(monthlyPkg)}
              disabled={purchasing}
              style={[styles.btnSecondary, purchasing && styles.btnDisabled]}
              accessibilityRole="button"
            >
              <Text style={styles.btnSecondaryText}>
                {monthlyPkg?.product.priceString ?? '$4.99'}/mes
              </Text>
            </Pressable>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={handleRestore} hitSlop={8} accessibilityRole="button">
            <Text style={styles.restore}>Restaurar compra</Text>
          </Pressable>
          <View style={styles.legalRow}>
            <Pressable
              onPress={() =>
                Linking.openURL('https://estoicismodigital.com/terminos')
              }
            >
              <Text style={styles.legal}>Términos</Text>
            </Pressable>
            <Text style={styles.legalDot}> · </Text>
            <Pressable
              onPress={() =>
                Linking.openURL('https://estoicismodigital.com/privacidad')
              }
            >
              <Text style={styles.legal}>Privacidad</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
    alignItems: 'flex-end',
  },
  closeText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroIcon: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontFamily: fontFamilies.quote,
    fontSize: fontSizes['2xl'],
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSub: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.muted,
    textAlign: 'center',
  },
  features: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  check: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.lg,
    color: colors.accent,
    width: 24,
  },
  featureText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm + 1,
    color: colors.ink,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  pricing: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnPrimaryText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs + 1,
    color: colors.bg,
    letterSpacing: 0.5,
  },
  btnSecondary: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  btnSecondaryText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs + 1,
    color: colors.ink,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  restore: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 1,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legal: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    color: colors.muted,
  },
  legalDot: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    color: colors.muted,
  },
});
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
pnpm --filter @estoicismo/mobile test -- --testPathPattern="paywall.test" --no-coverage
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Run full test suite**

```bash
pnpm --filter @estoicismo/mobile test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/__tests__/paywall.test.tsx apps/mobile/components/premium/PaywallModal.tsx
git commit -m "feat(mobile): add PaywallModal component (TDD)"
```

---

## Task 6: Wire PaywallModal into habitos/index.tsx

**Files:**
- Modify: `apps/mobile/app/(tabs)/habitos/index.tsx`

The current screen uses a static `Alert` and ignores the DB plan. Replace with `useProfile` + `PaywallModal`.

- [ ] **Step 1: Replace Alert gate with PaywallModal**

Replace the full contents of `apps/mobile/app/(tabs)/habitos/index.tsx`:

```typescript
// apps/mobile/app/(tabs)/habitos/index.tsx
import React, { useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ActionSheetIOS,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, colors, spacing, fontFamilies, fontSizes } from '@estoicismo/ui';
import { HabitCard } from '../../../components/habits/HabitCard';
import { EmptyHabits } from '../../../components/habits/EmptyHabits';
import { HabitModal } from '../../../components/habits/HabitModal';
import { PaywallModal } from '../../../components/premium/PaywallModal';
import {
  useHabits,
  useToggleHabit,
  useCreateHabit,
  useUpdateHabit,
  useArchiveHabit,
  useDailyQuote,
} from '../../../hooks/useHabits';
import { useProfile } from '../../../hooks/useProfile';
import { getHeaderDateStr, getTodayStr } from '../../../lib/dateUtils';
import type { Habit, CreateHabitInput } from '../../../types/habits';

const FREE_HABIT_LIMIT = 3;

export default function HabitosScreen() {
  const insets = useSafeAreaInsets();
  const { habits, logs, isLoading } = useHabits();
  const { data: quote } = useDailyQuote();
  const { data: profile } = useProfile();
  const { mutate: toggle } = useToggleHabit();
  const { mutate: createHabit, isPending: creating } = useCreateHabit();
  const { mutate: updateHabit, isPending: updating } = useUpdateHabit();
  const { mutate: archiveHabit } = useArchiveHabit();

  const [modalVisible, setModalVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  const today = getTodayStr();
  const completedToday = habits.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.completed_at === today),
  ).length;

  function handleFABPress() {
    // Gate: free users may have at most FREE_HABIT_LIMIT active habits.
    // Profile may still be loading on first render — default to free to be safe.
    const isPremium = profile?.plan === 'premium';
    if (!isPremium && habits.length >= FREE_HABIT_LIMIT) {
      setPaywallVisible(true);
      return;
    }
    setEditingHabit(undefined);
    setModalVisible(true);
  }

  function handleLongPress(habit: Habit) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Editar', 'Archivar'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (idx) => {
          if (idx === 1) {
            setEditingHabit(habit);
            setModalVisible(true);
          }
          if (idx === 2) handleArchive(habit);
        },
      );
    } else {
      Alert.alert(habit.name, undefined, [
        {
          text: 'Editar',
          onPress: () => {
            setEditingHabit(habit);
            setModalVisible(true);
          },
        },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: () => handleArchive(habit),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }

  function handleArchive(habit: Habit) {
    Alert.alert(
      'Archivar hábito',
      `¿Archivar "${habit.name}"? Ya no aparecerá en tu lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: () => archiveHabit(habit.id),
        },
      ],
    );
  }

  function handleSave(input: CreateHabitInput) {
    if (editingHabit) {
      updateHabit(
        { id: editingHabit.id, input },
        { onSuccess: () => setModalVisible(false) },
      );
    } else {
      createHabit(input, { onSuccess: () => setModalVisible(false) });
    }
  }

  return (
    <View style={styles.root}>
      {/* Dark header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerLabel}>{getHeaderDateStr()}</Text>
        <Text style={styles.headerQuote} numberOfLines={2}>
          {quote ? `"${quote.text}"` : '"El obstáculo es el camino."'}
        </Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressNum}>{completedToday}</Text>
          <Text style={styles.progressLabel}>
            {`DE ${habits.length} HÁBITO${habits.length !== 1 ? 'S' : ''} COMPLETADO${completedToday !== 1 ? 'S' : ''}`}
          </Text>
        </View>
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(h) => h.id}
          contentContainerStyle={[
            styles.list,
            habits.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={<EmptyHabits onCreate={handleFABPress} />}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              logs={logs}
              onToggle={(habitId, isCompleted) =>
                toggle({ habitId, isCompleted })
              }
              onLongPress={handleLongPress}
            />
          )}
        />
      )}

      {/* FAB */}
      {!isLoading && (
        <Pressable
          onPress={handleFABPress}
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo hábito"
          style={[
            styles.fab,
            { bottom: insets.bottom + 72, right: spacing.lg },
          ]}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      )}

      {/* Habit create/edit modal */}
      <HabitModal
        visible={modalVisible}
        habit={editingHabit}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        loading={creating || updating}
      />

      {/* Premium paywall */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.bgDeep,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  headerQuote: {
    fontFamily: fontFamilies.quote,
    fontSize: 22,
    color: '#F5F1EA',
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  progressNum: {
    fontFamily: fontFamilies.display,
    fontSize: 40,
    fontWeight: '700',
    color: colors.accent,
    lineHeight: 44,
  },
  progressLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.dark.muted,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  listEmpty: { flex: 1 },
  fab: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    color: colors.bg,
    fontSize: 28,
    lineHeight: 30,
    fontFamily: fontFamilies.body,
  },
});
```

- [ ] **Step 2: Run full mobile test suite**

```bash
pnpm --filter @estoicismo/mobile test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(tabs)/habitos/index.tsx
git commit -m "feat(mobile): wire PaywallModal + useProfile into habitos screen"
```

---

## Task 7: Install Stripe SDK + web lib/stripe.ts

**Files:**
- Modify: `apps/web/package.json` (via install)
- Create: `apps/web/lib/stripe.ts`

- [ ] **Step 1: Install Stripe**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm add stripe --filter web
```

Expected: `stripe` added to `apps/web/package.json` dependencies.

- [ ] **Step 2: Create lib/stripe.ts**

Create `apps/web/lib/stripe.ts`:

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

/**
 * Server-only Stripe client. Never import this in client components.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json apps/web/lib/stripe.ts pnpm-lock.yaml
git commit -m "feat(web): install Stripe SDK and create server client"
```

---

## Task 8: Web API route — create-checkout (TDD)

**Files:**
- Create: `apps/web/__tests__/create-checkout.test.ts`
- Create: `apps/web/app/api/stripe/create-checkout/route.ts`

The route:
1. Authenticates user via Supabase
2. Accepts `{ plan: 'monthly' | 'annual' }` — resolves price ID server-side (no price IDs exposed to client)
3. Gets or creates a Stripe customer linked to the user's Supabase profile
4. Creates a Stripe Checkout Session and returns the URL

- [ ] **Step 1: Write failing tests**

Create `apps/web/__tests__/create-checkout.test.ts`:

```typescript
import { POST } from '../app/api/stripe/create-checkout/route';
import { NextRequest } from 'next/server';

// --- Mock stripe lib ---
const mockCheckoutCreate = jest.fn().mockResolvedValue({
  url: 'https://checkout.stripe.com/pay/test_session',
});
const mockCustomerCreate = jest.fn().mockResolvedValue({ id: 'cus_test123' });

jest.mock('../lib/stripe', () => ({
  stripe: {
    customers: { create: mockCustomerCreate },
    checkout: { sessions: { create: mockCheckoutCreate } },
  },
}));

// --- Mock supabase-server ---
const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-1', email: 'test@example.com' } },
});
const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
const mockSingle = jest.fn().mockResolvedValue({
  data: { stripe_customer_id: null },
  error: null,
});
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: mockSingle,
  update: mockUpdate,
});

jest.mock('../lib/supabase-server', () => ({
  createSupabaseServer: jest.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/stripe/create-checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_PRICE_MONTHLY_ID = 'price_monthly_test';
    process.env.STRIPE_PRICE_ANNUAL_ID = 'price_annual_test';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    // Restore default mocks cleared by clearAllMocks
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    });
    mockSingle.mockResolvedValue({ data: { stripe_customer_id: null }, error: null });
    mockCustomerCreate.mockResolvedValue({ id: 'cus_test123' });
    mockCheckoutCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/test_session',
    });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: mockSingle,
      update: mockUpdate,
    });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
  });

  it('returns checkout URL for monthly plan', async () => {
    const res = await POST(makeRequest({ plan: 'monthly' }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/pay/test_session');
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_monthly_test', quantity: 1 }],
      }),
    );
  });

  it('returns checkout URL for annual plan', async () => {
    const res = await POST(makeRequest({ plan: 'annual' }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_annual_test', quantity: 1 }],
      }),
    );
  });

  it('returns 400 for invalid plan', async () => {
    const res = await POST(makeRequest({ plan: 'enterprise' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await POST(makeRequest({ plan: 'monthly' }));
    expect(res.status).toBe(401);
  });

  it('reuses existing stripe_customer_id', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { stripe_customer_id: 'cus_existing' },
      error: null,
    });
    await POST(makeRequest({ plan: 'monthly' }));
    // Should NOT create a new customer
    expect(mockCustomerCreate).not.toHaveBeenCalled();
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    );
  });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm --filter web test -- --testPathPattern="create-checkout" --no-coverage
```

Expected: FAIL — `Cannot find module '../app/api/stripe/create-checkout/route'`

- [ ] **Step 3: Create the API route**

Create `apps/web/app/api/stripe/create-checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '../../../../lib/supabase-server';
import { stripe } from '../../../../lib/stripe';

type Plan = 'monthly' | 'annual';

function getPriceId(plan: Plan): string | null {
  if (plan === 'monthly') return process.env.STRIPE_PRICE_MONTHLY_ID ?? null;
  if (plan === 'annual') return process.env.STRIPE_PRICE_ANNUAL_ID ?? null;
  return null;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { plan?: unknown };
  const plan = body.plan;

  if (plan !== 'monthly' && plan !== 'annual') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const priceId = getPriceId(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: 'Price not configured' },
      { status: 500 },
    );
  }

  // Get or create Stripe customer linked to this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let customerId: string = profile?.stripe_customer_id ?? '';

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    // Persist customer ID — non-blocking, failure won't break checkout
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/upgrade`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
pnpm --filter web test -- --testPathPattern="create-checkout" --no-coverage
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Run full web test suite**

```bash
pnpm --filter web test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/__tests__/create-checkout.test.ts apps/web/app/api/stripe/create-checkout/route.ts
git commit -m "feat(web): add Stripe create-checkout API route (TDD)"
```

---

## Task 9: Web upgrade page + success page

**Files:**
- Create: `apps/web/app/(dashboard)/upgrade/page.tsx`
- Create: `apps/web/app/(dashboard)/upgrade/success/page.tsx`

Both are Client Components (need interactivity / search params). They use the existing design system classes from Tailwind + CSS variables set up in `globals.css`.

- [ ] **Step 1: Create upgrade/page.tsx**

Create `apps/web/app/(dashboard)/upgrade/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FEATURES = [
  'Hábitos ilimitados (vs. 3 en el plan gratuito)',
  'Historial completo de rachas',
  'Módulos futuros: Finanzas, Mente, Emprende',
  'Sin publicidad',
] as const;

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(plan: 'monthly' | 'annual') {
    setError(null);
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'No se pudo iniciar el pago');
      }
      router.push(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        {/* Header */}
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
          ESTOICISMO PREMIUM
        </p>
        <h1 className="font-display text-4xl font-bold text-ink mb-2 italic">
          Desbloquea tu potencial completo
        </h1>
        <p className="font-body text-muted mb-8">
          Todo lo que necesitas para convertirte en la mejor versión de ti mismo.
        </p>

        {/* Feature list */}
        <ul className="space-y-3 mb-10">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span className="text-accent font-bold mt-0.5">✓</span>
              <span className="font-body text-ink">{f}</span>
            </li>
          ))}
        </ul>

        {/* Error */}
        {error && (
          <p className="font-mono text-xs text-danger mb-4">{error}</p>
        )}

        {/* Pricing buttons */}
        <div className="space-y-3">
          {/* Annual — primary */}
          <button
            onClick={() => handleSubscribe('annual')}
            disabled={loading !== null}
            className="w-full h-14 bg-accent text-bg rounded-xl font-mono text-sm tracking-wide disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading === 'annual'
              ? 'Redirigiendo...'
              : '$39.99 / año — AHORRA 33%'}
          </button>

          {/* Monthly — secondary */}
          <button
            onClick={() => handleSubscribe('monthly')}
            disabled={loading !== null}
            className="w-full h-14 border border-line text-ink rounded-xl font-mono text-sm tracking-wide disabled:opacity-50 hover:bg-bgAlt transition-colors"
          >
            {loading === 'monthly' ? 'Redirigiendo...' : '$4.99 / mes'}
          </button>
        </div>

        {/* Legal */}
        <p className="font-mono text-[10px] text-muted text-center mt-6">
          Cancela cuando quieras · Renovación automática
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create upgrade/success/page.tsx**

Create `apps/web/app/(dashboard)/upgrade/success/page.tsx`:

```tsx
import Link from 'next/link';

export default function UpgradeSuccessPage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-6">⭐</div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
          BIENVENIDO A PREMIUM
        </p>
        <h1 className="font-display text-3xl font-bold text-ink italic mb-4">
          Ya eres Premium
        </h1>
        <p className="font-body text-muted mb-8">
          Tu cuenta ha sido activada. Disfruta de hábitos ilimitados y todas las
          funciones premium.
        </p>
        <Link
          href="/"
          className="inline-block bg-accent text-bg font-mono text-sm px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Ir al dashboard
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify web build compiles**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm --filter web build 2>&1 | tail -20
```

Expected: build succeeds (may warn about missing env vars — that's OK).

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(dashboard\)/upgrade/
git commit -m "feat(web): add upgrade pricing page and success page"
```

---

## Task 10: Edge Function — revenuecat-webhook

**Files:**
- Create: `supabase/functions/revenuecat-webhook/index.ts`

Deno Edge Function that receives RevenueCat webhook events and updates `profiles.plan` in Supabase using the service role key (bypasses RLS).

**Before deploying:** set secrets via Supabase CLI:
```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET=<your-revcat-webhook-auth-header-value>
```
The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase.

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/revenuecat-webhook/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// RevenueCat event types that grant premium access
const PREMIUM_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
]);

// RevenueCat event types that revoke premium access
const FREE_EVENTS = new Set(['CANCELLATION', 'EXPIRATION']);

Deno.serve(async (req: Request) => {
  // RevenueCat authenticates webhooks with a static Authorization header
  const authHeader = req.headers.get('Authorization');
  const expectedSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: { event?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = body?.event;
  if (!event || typeof event !== 'object') {
    return new Response('Missing event', { status: 400 });
  }

  const eventType = event['type'] as string | undefined;
  const supabaseUserId = event['app_user_id'] as string | undefined;
  const expirationAtMs = event['expiration_at_ms'] as number | null | undefined;

  if (!supabaseUserId || !eventType) {
    return new Response('Missing required event fields', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  if (PREMIUM_EVENTS.has(eventType)) {
    const expiresAt = expirationAtMs
      ? new Date(expirationAtMs).toISOString()
      : null;

    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'premium', plan_expires_at: expiresAt })
      .eq('id', supabaseUserId);

    if (error) {
      console.error('Failed to update profile to premium:', error.message);
      return new Response('Database error', { status: 500 });
    }
  } else if (FREE_EVENTS.has(eventType)) {
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'free', plan_expires_at: null })
      .eq('id', supabaseUserId);

    if (error) {
      console.error('Failed to update profile to free:', error.message);
      return new Response('Database error', { status: 500 });
    }
  }
  // Other event types (BILLING_ISSUES, TRANSFER, etc.) — no action, just acknowledge

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Deploy Edge Function**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm supabase functions deploy revenuecat-webhook --project-ref tezcxsgpqcsuopyajptl
```

Expected: deployment succeeds. Note the function URL shown — it will be:
`https://tezcxsgpqcsuopyajptl.supabase.co/functions/v1/revenuecat-webhook`

Enter this URL in the RevenueCat dashboard under Project Settings > Integrations > Webhooks.

- [ ] **Step 3: Set the webhook secret**

```bash
pnpm supabase secrets set REVENUECAT_WEBHOOK_SECRET=<your-revcat-auth-header-value> --project-ref tezcxsgpqcsuopyajptl
```

The value should match what you set in RevenueCat's webhook Authorization header field.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/revenuecat-webhook/
git commit -m "feat(edge): add revenuecat-webhook Edge Function"
```

---

## Task 11: Edge Function — stripe-webhook

**Files:**
- Create: `supabase/functions/stripe-webhook/index.ts`

Deno Edge Function that receives Stripe webhook events, verifies the Stripe signature cryptographically, and updates `profiles.plan`.

**Before deploying:** set secrets:
```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  --project-ref tezcxsgpqcsuopyajptl
```

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/stripe-webhook/index.ts`:

```typescript
import Stripe from 'https://esm.sh/stripe@17?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // @ts-ignore — Deno-compatible httpClient
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2025-01-27.acacia',
});

async function getUserIdFromCustomer(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data?.id ?? null;
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', msg);
    return new Response(`Webhook error: ${msg}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Helper: resolve supabase user ID from event metadata or customer lookup
  async function resolveUserId(
    metadata: Record<string, string | null> | undefined,
    customerId: string | undefined,
  ): Promise<string | null> {
    if (metadata?.supabase_user_id) return metadata.supabase_user_id;
    if (customerId) return getUserIdFromCustomer(supabase, customerId);
    return null;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = await resolveUserId(
      session.metadata as Record<string, string>,
      session.customer as string | undefined,
    );
    if (userId && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      const expiresAt = new Date(sub.current_period_end * 1000).toISOString();
      await supabase
        .from('profiles')
        .update({ plan: 'premium', plan_expires_at: expiresAt })
        .eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const userId = await resolveUserId(
      sub.metadata as Record<string, string>,
      sub.customer as string,
    );
    if (userId) {
      const expiresAt = new Date(sub.current_period_end * 1000).toISOString();
      await supabase
        .from('profiles')
        .update({ plan: 'premium', plan_expires_at: expiresAt })
        .eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const userId = await resolveUserId(
      sub.metadata as Record<string, string>,
      sub.customer as string,
    );
    if (userId) {
      await supabase
        .from('profiles')
        .update({ plan: 'free', plan_expires_at: null })
        .eq('id', userId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Deploy Edge Function**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm supabase functions deploy stripe-webhook --project-ref tezcxsgpqcsuopyajptl
```

Expected: deployment succeeds. Function URL:
`https://tezcxsgpqcsuopyajptl.supabase.co/functions/v1/stripe-webhook`

**Set this URL in Stripe Dashboard → Developers → Webhooks.** Events to listen for:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

- [ ] **Step 3: Set secrets**

```bash
pnpm supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  --project-ref tezcxsgpqcsuopyajptl
```

- [ ] **Step 4: Run full test suites one final time**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm --filter @estoicismo/mobile test
pnpm --filter web test
```

Expected: all tests pass in both apps.

- [ ] **Step 5: Final commit**

```bash
git add supabase/functions/stripe-webhook/
git commit -m "feat(edge): add stripe-webhook Edge Function — Plan 3 complete"
```

---

## Manual Setup Checklist (Prerequisites)

Before the app goes live, complete these steps in the respective dashboards:

### RevenueCat
- [ ] Create project at app.revenuecat.com
- [ ] Create Entitlement: `premium`
- [ ] Create Offering: `default` with 2 packages:
  - `$rc_monthly` → Apple/Google product ID: `estoicismo_premium_monthly`
  - `$rc_annual` → Apple/Google product ID: `estoicismo_premium_annual`
- [ ] Set webhook URL: `https://tezcxsgpqcsuopyajptl.supabase.co/functions/v1/revenuecat-webhook`
- [ ] Copy API Key → add to `apps/mobile/.env` as `EXPO_PUBLIC_REVENUECAT_API_KEY`
- [ ] Copy webhook Authorization header value → `supabase secrets set REVENUECAT_WEBHOOK_SECRET=...`

### Stripe
- [ ] Create Product: "Estoicismo Premium"
- [ ] Create Price Monthly: $4.99/month recurring → copy Price ID
- [ ] Create Price Annual: $39.99/year recurring → copy Price ID
- [ ] Add Price IDs to `apps/web/.env.local`: `STRIPE_PRICE_MONTHLY_ID`, `STRIPE_PRICE_ANNUAL_ID`
- [ ] Set webhook URL: `https://tezcxsgpqcsuopyajptl.supabase.co/functions/v1/stripe-webhook`
- [ ] Copy Webhook Secret → `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] Add `STRIPE_SECRET_KEY=sk_live_...` to `apps/web/.env.local`
- [ ] Set `NEXT_PUBLIC_APP_URL=https://tu-dominio.com` in `apps/web/.env.local`
