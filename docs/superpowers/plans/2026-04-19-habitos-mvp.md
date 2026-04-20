# Hábitos MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Habits module for the mobile app — create, complete, edit, and archive habits with streaks, weekly history, and local push notifications.

**Architecture:** TanStack Query for server state with optimistic mutations (instant UI feedback on habit toggle). Components are small and focused: pure data layer (`lib/habits.ts`), pure calculation (`hooks/useStreak.ts`), notification scheduling (`lib/notifications.ts`), and three UI components (`HabitCard`, `EmptyHabits`, `HabitModal`). The main screen (`habitos/index.tsx`) composes them all.

**Tech Stack:** Expo 52 · React Native 0.76 · Supabase · TanStack Query v5 · expo-notifications ~0.29 · @react-native-async-storage/async-storage · @react-native-community/datetimepicker · expo-haptics (already installed) · @estoicismo/ui tokens

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/mobile/types/habits.ts` | Create | Shared TypeScript types: `Habit`, `HabitLog`, `Frequency`, `CreateHabitInput` |
| `apps/mobile/lib/dateUtils.ts` | Create | Pure date helpers: `getTodayStr`, `subtractDays`, `getCurrentWeekDays`, `getHeaderDateStr` |
| `apps/mobile/lib/habits.ts` | Create | Supabase CRUD: fetchHabits, fetchHabitLogs, createHabit, updateHabit, archiveHabit, insertHabitLog, deleteHabitLog |
| `apps/mobile/lib/notifications.ts` | Create | expo-notifications: requestPermissions, scheduleHabitNotification, cancelHabitNotification, cancelAllHabitNotifications |
| `apps/mobile/hooks/useStreak.ts` | Create | Pure `calculateStreak` function used by HabitCard |
| `apps/mobile/hooks/useHabits.ts` | Create | TanStack Query hooks: useHabits, useToggleHabit, useCreateHabit, useUpdateHabit, useArchiveHabit, useDailyQuote |
| `apps/mobile/components/habits/HabitCard.tsx` | Create | Card UI: emoji, name, streak, check circle, 7-day week dots |
| `apps/mobile/components/habits/EmptyHabits.tsx` | Create | Empty state with Lora heading and "Crear primer hábito" CTA |
| `apps/mobile/components/habits/HabitModal.tsx` | Create | Full-screen RN Modal for create/edit: name, emoji grid, color grid, frequency, reminder |
| `apps/mobile/app/(tabs)/habitos/index.tsx` | Modify | Replace placeholder with real screen: dark header + FlatList + FAB |
| `apps/mobile/__tests__/habits.test.tsx` | Create | Smoke tests: HabitCard render, calculateStreak logic |

---

## Task 1: Install missing dependencies

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install packages**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app"
pnpm --filter @estoicismo/mobile add @react-native-async-storage/async-storage @react-native-community/datetimepicker
```

Expected output: packages added to `apps/mobile/package.json`

- [ ] **Step 2: Verify they appear in package.json**

```bash
cat apps/mobile/package.json | grep -E "async-storage|datetimepicker"
```

Expected: both packages listed under dependencies.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/package.json
git commit -m "feat(mobile): add async-storage and datetimepicker dependencies"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `apps/mobile/types/habits.ts`

- [ ] **Step 1: Create the types file**

```typescript
// apps/mobile/types/habits.ts

export type Frequency =
  | 'daily'
  | { times: 3 | 4 | 5; period: 'week' };

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;          // emoji character
  color: string;         // hex from HABIT_COLORS
  frequency: Frequency;
  reminder_time: string | null;  // "HH:MM" or null
  is_archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;  // "YYYY-MM-DD"
  note: string | null;
}

export interface CreateHabitInput {
  name: string;
  icon: string;
  color: string;
  frequency: Frequency;
  reminder_time: string | null;
}

/** The 8 curated habit colors */
export const HABIT_COLORS = [
  '#4F8EF7', // Azul
  '#3DBF8A', // Esmeralda
  '#E8714A', // Coral
  '#A56CF0', // Violeta
  '#F0B429', // Ámbar
  '#E85D7A', // Rosa
  '#2BBDCE', // Turquesa
  '#8B6F47', // Tierra (system accent)
] as const;

/** The 20 curated habit emojis */
export const HABIT_EMOJIS = [
  '🎯', '🧘', '📚', '🏃', '💧',
  '✍️', '🌿', '💪', '🧠', '⭐',
  '🎨', '🎵', '🍎', '😴', '🧹',
  '💊', '🚴', '🧗', '📝', '🌅',
] as const;
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `types/habits.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/types/habits.ts
git commit -m "feat(mobile): add Habit and HabitLog TypeScript types"
```

---

## Task 3: Date utilities

**Files:**
- Create: `apps/mobile/lib/dateUtils.ts`

- [ ] **Step 1: Create dateUtils**

```typescript
// apps/mobile/lib/dateUtils.ts

/** Returns today's date as "YYYY-MM-DD" in local time */
export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Subtracts N days from a "YYYY-MM-DD" string, returns "YYYY-MM-DD" */
export function subtractDays(dateStr: string, days: number): string {
  // Use noon to avoid DST edge cases
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns the 7 days of the current week (Mon→Sun), each as { date, label } */
export function getCurrentWeekDays(): { date: string; label: string }[] {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: labels[i],
    };
  });
}

/** Returns "HOY · LUNES 19 ABR" for the dark header */
export function getHeaderDateStr(): string {
  const today = new Date();
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return `HOY · ${days[today.getDay()]} ${today.getDate()} ${months[today.getMonth()]}`;
}
```

- [ ] **Step 2: Verify no type errors**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec tsc --noEmit 2>&1 | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/dateUtils.ts
git commit -m "feat(mobile): add date utility functions"
```

---

## Task 4: Supabase queries

**Files:**
- Create: `apps/mobile/lib/habits.ts`

- [ ] **Step 1: Create the habits query file**

```typescript
// apps/mobile/lib/habits.ts
import { supabase } from './supabase';
import type { Habit, HabitLog, CreateHabitInput } from '../types/habits';

/** Fetches all non-archived habits for the user, oldest first */
export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Habit[];
}

/**
 * Fetches habit_logs for a user between two dates (inclusive).
 * @param from - "YYYY-MM-DD" start
 * @param to   - "YYYY-MM-DD" end
 */
export async function fetchHabitLogs(
  userId: string,
  from: string,
  to: string,
): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_at', from)
    .lte('completed_at', to);
  if (error) throw error;
  return (data ?? []) as HabitLog[];
}

/** Creates a new habit and returns it */
export async function createHabit(
  userId: string,
  input: CreateHabitInput,
): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

/** Updates an existing habit and returns it */
export async function updateHabit(
  id: string,
  input: Partial<CreateHabitInput>,
): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

/** Soft-deletes a habit by setting is_archived = true */
export async function archiveHabit(id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ is_archived: true })
    .eq('id', id);
  if (error) throw error;
}

/** Inserts a habit_log for a given date (marks habit as done) */
export async function insertHabitLog(
  habitId: string,
  userId: string,
  date: string, // "YYYY-MM-DD"
): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .insert({ habit_id: habitId, user_id: userId, completed_at: date });
  if (error) throw error;
}

/** Deletes a habit_log for a given date (un-marks habit as done) */
export async function deleteHabitLog(
  habitId: string,
  date: string, // "YYYY-MM-DD"
): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('completed_at', date);
  if (error) throw error;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/habits.ts
git commit -m "feat(mobile): add Supabase habit and habit_log query functions"
```

---

## Task 5: Streak calculation

**Files:**
- Create: `apps/mobile/hooks/useStreak.ts`
- Create: `apps/mobile/__tests__/habits.test.tsx` (partial — streak tests)

- [ ] **Step 1: Write the failing tests first**

```typescript
// apps/mobile/__tests__/habits.test.tsx
import { calculateStreak } from '../hooks/useStreak';
import type { HabitLog } from '../types/habits';

const HABIT_ID = 'h1';
const USER_ID = 'u1';

function makeLog(completed_at: string): HabitLog {
  return { id: completed_at, habit_id: HABIT_ID, user_id: USER_ID, completed_at, note: null };
}

describe('calculateStreak', () => {
  it('returns 0 when no logs', () => {
    expect(calculateStreak([], HABIT_ID, '2026-04-19')).toBe(0);
  });

  it('returns 1 when only today is done', () => {
    const logs = [makeLog('2026-04-19')];
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(1);
  });

  it('returns 3 for three consecutive days ending today', () => {
    const logs = [
      makeLog('2026-04-17'),
      makeLog('2026-04-18'),
      makeLog('2026-04-19'),
    ];
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(3);
  });

  it('returns streak from yesterday when today is not done', () => {
    const logs = [
      makeLog('2026-04-17'),
      makeLog('2026-04-18'),
    ];
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(2);
  });

  it('returns 0 when yesterday is missing (broken streak)', () => {
    const logs = [
      makeLog('2026-04-16'),
      makeLog('2026-04-17'),
      // 2026-04-18 missing
    ];
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(0);
  });

  it('ignores logs from other habits', () => {
    const logs = [
      makeLog('2026-04-17'),
      { id: 'other', habit_id: 'other-habit', user_id: USER_ID, completed_at: '2026-04-18', note: null },
      makeLog('2026-04-19'),
    ];
    // gap on 04-18 for HABIT_ID → streak = 1
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (calculateStreak not defined yet)**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec jest __tests__/habits.test.tsx 2>&1 | tail -10
```

Expected: FAIL — "Cannot find module '../hooks/useStreak'"

- [ ] **Step 3: Implement calculateStreak**

```typescript
// apps/mobile/hooks/useStreak.ts
import { subtractDays } from '../lib/dateUtils';
import type { HabitLog } from '../types/habits';

/**
 * Calculates the current streak for a habit from a flat array of logs.
 * - If today is done: counts backwards from today.
 * - If today is not done: counts backwards from yesterday.
 * - Caps at 365 days to prevent infinite loops.
 */
export function calculateStreak(
  logs: HabitLog[],
  habitId: string,
  today: string, // "YYYY-MM-DD"
): number {
  const done = new Set(
    logs.filter((l) => l.habit_id === habitId).map((l) => l.completed_at),
  );

  let streak = 0;
  let cur = done.has(today) ? today : subtractDays(today, 1);

  for (let i = 0; i < 365; i++) {
    if (!done.has(cur)) break;
    streak++;
    cur = subtractDays(cur, 1);
  }

  return streak;
}
```

- [ ] **Step 4: Run tests — expect all PASS**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec jest __tests__/habits.test.tsx 2>&1 | tail -15
```

Expected:
```
PASS __tests__/habits.test.tsx
  calculateStreak
    ✓ returns 0 when no logs
    ✓ returns 1 when only today is done
    ✓ returns 3 for three consecutive days ending today
    ✓ returns streak from yesterday when today is not done
    ✓ returns 0 when yesterday is missing (broken streak)
    ✓ ignores logs from other habits

Tests: 6 passed
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/hooks/useStreak.ts apps/mobile/__tests__/habits.test.tsx
git commit -m "feat(mobile): add streak calculation with tests"
```

---

## Task 6: Notifications

**Files:**
- Create: `apps/mobile/lib/notifications.ts`

- [ ] **Step 1: Create notifications lib**

```typescript
// apps/mobile/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import type { Habit } from '../types/habits';

// Show alert when notification arrives while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Asks the user for notification permission. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

// Weekday numbers for expo-notifications (1 = Sun, 2 = Mon, ..., 7 = Sat)
const WEEKLY_DAYS: Record<number, number[]> = {
  3: [2, 4, 6], // Mon, Wed, Fri
  4: [2, 3, 5, 6], // Mon, Tue, Thu, Fri
  5: [2, 3, 4, 5, 6], // Mon–Fri
};

/**
 * Schedules local notification(s) for a habit.
 * - Daily habit → one daily notification at reminder_time.
 * - Weekly habit → one notification per active weekday.
 * Cancels any existing notifications for this habit first.
 */
export async function scheduleHabitNotification(habit: Habit): Promise<void> {
  if (!habit.reminder_time) return;
  await cancelHabitNotification(habit.id);

  const { hour, minute } = parseTime(habit.reminder_time);
  const body = `Es hora de: ${habit.icon} ${habit.name}`;

  if (habit.frequency === 'daily') {
    await Notifications.scheduleNotificationAsync({
      identifier: `habit-${habit.id}`,
      content: { title: 'Hábito pendiente', body },
      trigger: { type: 'daily', hour, minute } as Notifications.DailyTriggerInput,
    });
  } else {
    const { times } = habit.frequency as { times: number; period: 'week' };
    const weekdays = WEEKLY_DAYS[times] ?? WEEKLY_DAYS[3];
    await Promise.all(
      weekdays.map((weekday) =>
        Notifications.scheduleNotificationAsync({
          identifier: `habit-${habit.id}-day${weekday}`,
          content: { title: 'Hábito pendiente', body },
          trigger: { type: 'weekly', weekday, hour, minute } as Notifications.WeeklyTriggerInput,
        }),
      ),
    );
  }
}

/**
 * Cancels all scheduled notifications for a specific habit.
 * Handles both daily (`habit-{id}`) and weekly (`habit-{id}-day{n}`) identifiers.
 */
export async function cancelHabitNotification(habitId: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const prefix = `habit-${habitId}`;
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Cancels all habit-related scheduled notifications (e.g., on logout). */
export async function cancelAllHabitNotifications(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith('habit-'))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors. If `DailyTriggerInput` or `WeeklyTriggerInput` don't exist in the installed version, replace the cast with `as unknown as Notifications.NotificationTriggerInput`.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/notifications.ts
git commit -m "feat(mobile): add notification scheduling for habits"
```

---

## Task 7: TanStack Query hooks

**Files:**
- Create: `apps/mobile/hooks/useHabits.ts`

- [ ] **Step 1: Create the hooks file**

```typescript
// apps/mobile/hooks/useHabits.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import * as habitsLib from '../lib/habits';
import {
  scheduleHabitNotification,
  cancelHabitNotification,
} from '../lib/notifications';
import { getTodayStr, getCurrentWeekDays } from '../lib/dateUtils';
import type { Habit, HabitLog, CreateHabitInput } from '../types/habits';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

function getWeekRange(): { from: string; to: string } {
  const days = getCurrentWeekDays();
  return { from: days[0].date, to: days[6].date };
}

// ─── useHabits ───────────────────────────────────────────────────────────────

interface HabitsData {
  habits: Habit[];
  logs: HabitLog[];
}

export function useHabits() {
  const { from, to } = getWeekRange();

  const habitsQuery = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: async () => habitsLib.fetchHabits(await getUserId()),
    staleTime: 1000 * 60 * 5,
  });

  const logsQuery = useQuery<HabitLog[]>({
    queryKey: ['habit-logs', from, to],
    queryFn: async () => habitsLib.fetchHabitLogs(await getUserId(), from, to),
    staleTime: 1000 * 60 * 5,
  });

  return {
    habits: habitsQuery.data ?? [],
    logs: logsQuery.data ?? [],
    isLoading: habitsQuery.isLoading || logsQuery.isLoading,
    error: habitsQuery.error ?? logsQuery.error,
    refetch: () => {
      habitsQuery.refetch();
      logsQuery.refetch();
    },
  };
}

// ─── useToggleHabit ──────────────────────────────────────────────────────────

export function useToggleHabit() {
  const queryClient = useQueryClient();
  const { from, to } = getWeekRange();
  const logsKey = ['habit-logs', from, to];

  return useMutation({
    mutationFn: async ({
      habitId,
      isCompleted,
    }: {
      habitId: string;
      isCompleted: boolean;
    }) => {
      const today = getTodayStr();
      if (isCompleted) {
        await habitsLib.deleteHabitLog(habitId, today);
      } else {
        const userId = await getUserId();
        await habitsLib.insertHabitLog(habitId, userId, today);
      }
    },

    onMutate: async ({ habitId, isCompleted }) => {
      const today = getTodayStr();
      await queryClient.cancelQueries({ queryKey: logsKey });
      const prevLogs = queryClient.getQueryData<HabitLog[]>(logsKey);

      queryClient.setQueryData<HabitLog[]>(logsKey, (old = []) => {
        if (isCompleted) {
          // Remove today's log optimistically
          return old.filter(
            (l) => !(l.habit_id === habitId && l.completed_at === today),
          );
        } else {
          // Add an optimistic log
          return [
            ...old,
            {
              id: `optimistic-${habitId}-${today}`,
              habit_id: habitId,
              user_id: '',
              completed_at: today,
              note: null,
            },
          ];
        }
      });

      return { prevLogs };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prevLogs !== undefined) {
        queryClient.setQueryData(logsKey, ctx.prevLogs);
      }
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: logsKey });
    },
  });
}

// ─── useCreateHabit ──────────────────────────────────────────────────────────

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      const userId = await getUserId();
      const habit = await habitsLib.createHabit(userId, input);
      if (input.reminder_time) {
        await scheduleHabitNotification(habit);
      }
      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo crear el hábito. Intenta de nuevo.');
    },
  });
}

// ─── useUpdateHabit ──────────────────────────────────────────────────────────

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateHabitInput>;
    }) => {
      const habit = await habitsLib.updateHabit(id, input);
      // Reschedule: cancel old, schedule new if reminder set
      await cancelHabitNotification(id);
      if (habit.reminder_time) {
        await scheduleHabitNotification(habit);
      }
      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo actualizar el hábito.');
    },
  });
}

// ─── useArchiveHabit ─────────────────────────────────────────────────────────

export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      await habitsLib.archiveHabit(habitId);
      await cancelHabitNotification(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo archivar el hábito.');
    },
  });
}

// ─── useDailyQuote ───────────────────────────────────────────────────────────

interface Quote {
  text: string;
  author: string;
}

const FALLBACK_QUOTE: Quote = {
  text: 'El obstáculo es el camino.',
  author: 'Marco Aurelio',
};

export function useDailyQuote() {
  return useQuery<Quote>({
    queryKey: ['daily-quote'],
    queryFn: async () => {
      const today = getTodayStr();
      const cacheKey = `stoic_quote_${today}`;

      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached) as Quote;

      const { data, error } = await supabase
        .from('stoic_quotes')
        .select('text, author')
        .eq('language', 'es');

      if (error || !data?.length) return FALLBACK_QUOTE;

      // Pick deterministically by day-of-month so it doesn't change on refetch
      const idx = new Date().getDate() % data.length;
      const quote = data[idx] as Quote;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(quote));
      return quote;
    },
    staleTime: Infinity, // never refetch during the same session
  });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hooks/useHabits.ts
git commit -m "feat(mobile): add TanStack Query hooks for habits (list, toggle, create, update, archive, daily quote)"
```

---

## Task 8: HabitCard component

**Files:**
- Create: `apps/mobile/components/habits/HabitCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
// apps/mobile/components/habits/HabitCard.tsx
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing, radius, fontFamilies, fontSizes } from '@estoicismo/ui';
import { calculateStreak } from '../hooks/useStreak';
import { getTodayStr, getCurrentWeekDays } from '../lib/dateUtils';
import type { Habit, HabitLog } from '../types/habits';

// Note: hooks/useStreak exports from apps/mobile/hooks/useStreak.ts
// Note: lib/dateUtils exports from apps/mobile/lib/dateUtils.ts

interface Props {
  habit: Habit;
  logs: HabitLog[];          // All logs for the week (and recent days for streak)
  onToggle: (habitId: string, isCompleted: boolean) => void;
  onLongPress: (habit: Habit) => void;
}

export function HabitCard({ habit, logs, onToggle, onLongPress }: Props) {
  const today = getTodayStr();
  const weekDays = getCurrentWeekDays();

  const isCompletedToday = logs.some(
    (l) => l.habit_id === habit.id && l.completed_at === today,
  );

  const streak = calculateStreak(logs, habit.id, today);

  function handleToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(habit.id, isCompletedToday);
  }

  return (
    <Pressable
      onLongPress={() => onLongPress(habit)}
      accessibilityRole="none"
      style={[styles.card, { borderLeftColor: habit.color }]}
    >
      {/* Top row: emoji · name · streak · check */}
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{habit.icon}</Text>
        <Text
          style={styles.name}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {habit.name}
        </Text>
        {streak > 0 && (
          <Text style={styles.streak}>🔥 {streak}</Text>
        )}
        <Pressable
          onPress={handleToggle}
          accessibilityRole="checkbox"
          accessibilityLabel={`${habit.name} — ${isCompletedToday ? 'completado' : 'pendiente'}`}
          accessibilityState={{ checked: isCompletedToday }}
          hitSlop={8}
          style={[styles.check, isCompletedToday && styles.checkDone]}
        >
          {isCompletedToday && (
            <Text style={styles.checkMark}>✓</Text>
          )}
        </Pressable>
      </View>

      {/* Week dots row */}
      <View style={styles.weekRow}>
        {weekDays.map(({ date, label }) => {
          const done = logs.some(
            (l) => l.habit_id === habit.id && l.completed_at === date,
          );
          const isToday = date === today;

          return (
            <View key={date} style={styles.dayCol}>
              <View
                style={[
                  styles.dot,
                  done && isToday && { backgroundColor: habit.color },
                  done && !isToday && styles.dotDone,
                  !done && isToday && {
                    borderWidth: 1.5,
                    borderColor: habit.color,
                    backgroundColor: 'transparent',
                  },
                ]}
              />
              <Text
                style={[
                  styles.dayLabel,
                  isToday && { color: habit.color, fontFamily: fontFamilies.mono },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  emoji: {
    fontSize: 16,
  },
  name: {
    flex: 1,
    fontFamily: fontFamilies.bodySemiBold ?? fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  streak: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.accent,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkMark: {
    color: colors.bg,
    fontSize: 12,
    fontFamily: fontFamilies.bodyMedium,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dayLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 7,
    color: colors.muted,
  },
});
```

> **Note on `fontFamilies.bodySemiBold`:** Check `packages/ui/src/tokens/typography.ts`. If `bodySemiBold` doesn't exist, use `fontFamilies.bodyMedium` instead (already done with the `??` fallback).

- [ ] **Step 2: Verify TypeScript**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/habits/HabitCard.tsx
git commit -m "feat(mobile): add HabitCard component with weekly dots and streak"
```

---

## Task 9: EmptyHabits component

**Files:**
- Create: `apps/mobile/components/habits/EmptyHabits.tsx`

- [ ] **Step 1: Create the component**

```typescript
// apps/mobile/components/habits/EmptyHabits.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, colors, spacing } from '@estoicismo/ui';

interface Props {
  onCreate: () => void;
}

export function EmptyHabits({ onCreate }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="display" style={styles.title}>
        Sin hábitos todavía.
      </Text>
      <Text variant="muted" style={styles.subtitle}>
        Los estoicos construían sistemas,{'\n'}no esperaban motivación.
      </Text>
      <Button
        variant="primary"
        label="Crear primer hábito"
        onPress={onCreate}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  button: {
    width: '100%',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/components/habits/EmptyHabits.tsx
git commit -m "feat(mobile): add EmptyHabits component"
```

---

## Task 10: HabitModal component

**Files:**
- Create: `apps/mobile/components/habits/HabitModal.tsx`

- [ ] **Step 1: Create the modal**

```typescript
// apps/mobile/components/habits/HabitModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, colors, spacing, radius, fontFamilies, fontSizes } from '@estoicismo/ui';
import { HABIT_COLORS, HABIT_EMOJIS } from '../../types/habits';
import type { Habit, CreateHabitInput, Frequency } from '../../types/habits';

interface Props {
  visible: boolean;
  habit?: Habit;           // If provided: edit mode. Else: create mode.
  onClose: () => void;
  onSave: (input: CreateHabitInput) => void;
  loading?: boolean;
}

const FREQ_OPTIONS: { label: string; value: Frequency }[] = [
  { label: 'Diario', value: 'daily' },
  { label: '3×/sem', value: { times: 3, period: 'week' } },
  { label: '4×/sem', value: { times: 4, period: 'week' } },
  { label: '5×/sem', value: { times: 5, period: 'week' } },
];

function freqEqual(a: Frequency, b: Frequency): boolean {
  if (a === 'daily' && b === 'daily') return true;
  if (typeof a === 'object' && typeof b === 'object') return a.times === b.times;
  return false;
}

function parseReminderTime(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatReminderTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function HabitModal({ visible, habit, onClose, onSave, loading }: Props) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  // Populate fields when editing an existing habit
  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setColor(habit.color);
      setFrequency(habit.frequency);
      if (habit.reminder_time) {
        setReminderEnabled(true);
        setReminderDate(parseReminderTime(habit.reminder_time));
      } else {
        setReminderEnabled(false);
      }
    } else {
      // Reset to defaults for create mode
      setName('');
      setIcon('🎯');
      setColor(HABIT_COLORS[0]);
      setFrequency('daily');
      setReminderEnabled(false);
    }
  }, [habit, visible]);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del hábito.');
      return;
    }
    if (name.trim().length > 40) {
      Alert.alert('Nombre muy largo', 'El nombre debe tener máximo 40 caracteres.');
      return;
    }

    const input: CreateHabitInput = {
      name: name.trim(),
      icon,
      color,
      frequency,
      reminder_time: reminderEnabled ? formatReminderTime(reminderDate) : null,
    };

    onSave(input);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Text variant="label" style={{ color: colors.accent }}>
            {habit ? 'EDITAR HÁBITO' : 'NUEVO HÁBITO'}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            style={styles.cancelBtn}
          >
            <Text variant="muted">Cancelar</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre */}
          <Text variant="label" style={styles.fieldLabel}>NOMBRE</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Meditar 10 min"
            placeholderTextColor={colors.muted}
            maxLength={40}
            returnKeyType="done"
            accessibilityLabel="Nombre del hábito"
          />

          {/* Emoji */}
          <Text variant="label" style={styles.fieldLabel}>EMOJI</Text>
          <View style={styles.emojiGrid}>
            {HABIT_EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setIcon(e)}
                accessibilityRole="button"
                accessibilityLabel={e}
                accessibilityState={{ selected: icon === e }}
                style={[styles.emojiOpt, icon === e && styles.emojiOptSel]}
              >
                <Text style={styles.emojiChar}>{e}</Text>
              </Pressable>
            ))}
          </View>

          {/* Color */}
          <Text variant="label" style={styles.fieldLabel}>COLOR</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityRole="button"
                accessibilityLabel={`Color ${c}`}
                accessibilityState={{ selected: color === c }}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSel,
                ]}
              />
            ))}
          </View>

          {/* Frecuencia */}
          <Text variant="label" style={styles.fieldLabel}>FRECUENCIA</Text>
          <View style={styles.freqRow}>
            {FREQ_OPTIONS.map(({ label, value }) => (
              <Pressable
                key={label}
                onPress={() => setFrequency(value)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: freqEqual(frequency, value) }}
                style={[
                  styles.freqOpt,
                  freqEqual(frequency, value) && styles.freqOptSel,
                ]}
              >
                <Text
                  style={[
                    styles.freqLabel,
                    freqEqual(frequency, value) && styles.freqLabelSel,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recordatorio */}
          <Text variant="label" style={styles.fieldLabel}>RECORDATORIO</Text>
          <View style={styles.reminderRow}>
            <Text variant="body" style={{ flex: 1, color: colors.ink }}>
              Notificación diaria
            </Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ true: colors.accent, false: colors.line }}
              thumbColor={colors.bg}
              accessibilityLabel="Activar recordatorio"
            />
          </View>

          {reminderEnabled && (
            <>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={reminderDate}
                  mode="time"
                  display="default"
                  onChange={(_, date) => { if (date) setReminderDate(date); }}
                  style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
                />
              ) : (
                <Pressable
                  onPress={() => setShowAndroidPicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Hora del recordatorio"
                  style={styles.androidTimePicker}
                >
                  <Text style={styles.androidTimeText}>
                    {formatReminderTime(reminderDate)}
                  </Text>
                </Pressable>
              )}
              {showAndroidPicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={reminderDate}
                  mode="time"
                  display="default"
                  onChange={(_, date) => {
                    setShowAndroidPicker(false);
                    if (date) setReminderDate(date);
                  }}
                />
              )}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Button
            variant="primary"
            label={habit ? 'Guardar cambios' : 'Crear hábito'}
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  cancelBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.muted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.ink,
    backgroundColor: colors.bgAlt,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emojiOpt: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptSel: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(139,111,71,0.1)',
  },
  emojiChar: {
    fontSize: 20,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSel: {
    borderWidth: 3,
    borderColor: colors.ink,
  },
  freqRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  freqOpt: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqOptSel: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  freqLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.muted,
  },
  freqLabelSel: {
    color: colors.bg,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  androidTimePicker: {
    height: 44,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  androidTimeText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/habits/HabitModal.tsx
git commit -m "feat(mobile): add HabitModal with emoji/color/frequency/reminder fields"
```

---

## Task 11: Main Hábitos screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/habitos/index.tsx`

- [ ] **Step 1: Check the typography tokens available**

```bash
cat "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/packages/ui/src/tokens/typography.ts"
```

Note the exact names of font family keys (e.g. `mono`, `body`, `bodyMedium`) — use them exactly in the screen below.

- [ ] **Step 2: Replace the placeholder screen**

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
import {
  useHabits,
  useToggleHabit,
  useCreateHabit,
  useUpdateHabit,
  useArchiveHabit,
  useDailyQuote,
} from '../../../hooks/useHabits';
import { getHeaderDateStr } from '../../../lib/dateUtils';
import type { Habit, CreateHabitInput } from '../../../types/habits';

const FREE_HABIT_LIMIT = 3;

export default function HabitosScreen() {
  const insets = useSafeAreaInsets();
  const { habits, logs, isLoading } = useHabits();
  const { data: quote } = useDailyQuote();
  const { mutate: toggle } = useToggleHabit();
  const { mutate: createHabit, isPending: creating } = useCreateHabit();
  const { mutate: updateHabit, isPending: updating } = useUpdateHabit();
  const { mutate: archiveHabit } = useArchiveHabit();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  const completedToday = habits.filter((h) =>
    logs.some(
      (l) =>
        l.habit_id === h.id &&
        l.completed_at === new Date().toISOString().split('T')[0],
    ),
  ).length;

  function handleFABPress() {
    if (habits.length >= FREE_HABIT_LIMIT) {
      Alert.alert(
        'Límite alcanzado',
        'El plan gratuito permite hasta 3 hábitos activos. Próximamente podrás desbloquear más.',
        [{ text: 'Entendido' }],
      );
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
          if (idx === 1) { setEditingHabit(habit); setModalVisible(true); }
          if (idx === 2) handleArchive(habit);
        },
      );
    } else {
      Alert.alert(habit.name, undefined, [
        { text: 'Editar', onPress: () => { setEditingHabit(habit); setModalVisible(true); } },
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
          {quote
            ? `"${quote.text}"`
            : '"El obstáculo es el camino."'}
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
          ListEmptyComponent={
            <EmptyHabits onCreate={handleFABPress} />
          }
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

      {/* Modal */}
      <HabitModal
        visible={modalVisible}
        habit={editingHabit}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        loading={creating || updating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.bgDeep,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.accentSoft ?? colors.accent,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  headerQuote: {
    fontFamily: fontFamilies.displayItalic ?? fontFamilies.display,
    fontSize: fontSizes.xl ?? 22,
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
    color: colors.accentSoft ?? colors.accent,
    lineHeight: 44,
  },
  progressLabel: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: '#9A8E82',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  listEmpty: {
    flex: 1,
  },
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

> **Note on font tokens:** `fontFamilies.displayItalic`, `fontFamilies.accentSoft`, `fontFamilies.display` — check `packages/ui/src/tokens/typography.ts` for exact key names. Use the `??` fallback as written above to handle any missing tokens gracefully.

> **Note on `getTodayStr` in completedToday:** Replace `new Date().toISOString().split('T')[0]` with `getTodayStr()` (import from `'../../../lib/dateUtils'`). The inline version works but is less safe across timezones.

- [ ] **Step 3: Fix the completedToday calculation to use getTodayStr**

Replace:
```typescript
l.completed_at === new Date().toISOString().split('T')[0],
```
With:
```typescript
l.completed_at === getTodayStr(),
```

Make sure `getTodayStr` is imported: `import { getHeaderDateStr, getTodayStr } from '../../../lib/dateUtils';`

- [ ] **Step 4: Verify TypeScript**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors. Fix any token name mismatches by checking `packages/ui/src/tokens/typography.ts`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/(tabs)/habitos/index.tsx
git commit -m "feat(mobile): build Hábitos screen — dark header, habit list, FAB, modal"
```

---

## Task 12: Smoke tests for HabitCard

**Files:**
- Modify: `apps/mobile/__tests__/habits.test.tsx` (add HabitCard tests)

- [ ] **Step 1: Add HabitCard render tests**

Append to the existing `apps/mobile/__tests__/habits.test.tsx` file (after the `calculateStreak` describe block):

```typescript
// ── HabitCard tests ────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HabitCard } from '../components/habits/HabitCard';
import type { Habit, HabitLog } from '../types/habits';

const MOCK_HABIT: Habit = {
  id: 'h1',
  user_id: 'u1',
  name: 'Meditar',
  icon: '🧘',
  color: '#4F8EF7',
  frequency: 'daily',
  reminder_time: null,
  is_archived: false,
  created_at: '2026-04-01T00:00:00Z',
};

// Mock the modules HabitCard depends on
jest.mock('../lib/dateUtils', () => ({
  getTodayStr: () => '2026-04-19',
  getCurrentWeekDays: () => [
    { date: '2026-04-14', label: 'L' },
    { date: '2026-04-15', label: 'M' },
    { date: '2026-04-16', label: 'X' },
    { date: '2026-04-17', label: 'J' },
    { date: '2026-04-18', label: 'V' },
    { date: '2026-04-19', label: 'S' },
    { date: '2026-04-20', label: 'D' },
  ],
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('HabitCard', () => {
  it('renders habit name and emoji', () => {
    render(
      <HabitCard
        habit={MOCK_HABIT}
        logs={[]}
        onToggle={jest.fn()}
        onLongPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Meditar')).toBeTruthy();
    expect(screen.getByText('🧘')).toBeTruthy();
  });

  it('calls onToggle when check is pressed', () => {
    const onToggle = jest.fn();
    render(
      <HabitCard
        habit={MOCK_HABIT}
        logs={[]}
        onToggle={onToggle}
        onLongPress={jest.fn()}
      />,
    );
    fireEvent.press(
      screen.getByAccessibilityLabel('Meditar — pendiente'),
    );
    expect(onToggle).toHaveBeenCalledWith('h1', false);
  });

  it('shows check mark and calls onToggle with isCompleted=true when already done', () => {
    const completedLog: HabitLog = {
      id: 'log1',
      habit_id: 'h1',
      user_id: 'u1',
      completed_at: '2026-04-19',
      note: null,
    };
    const onToggle = jest.fn();
    render(
      <HabitCard
        habit={MOCK_HABIT}
        logs={[completedLog]}
        onToggle={onToggle}
        onLongPress={jest.fn()}
      />,
    );
    fireEvent.press(
      screen.getByAccessibilityLabel('Meditar — completado'),
    );
    expect(onToggle).toHaveBeenCalledWith('h1', true);
  });
});
```

- [ ] **Step 2: Run all tests — expect all PASS**

```bash
cd "/Users/macbookpro/Desktop/APP ESTOICISMO/estoicismo-app/apps/mobile"
pnpm exec jest __tests__/habits.test.tsx 2>&1 | tail -20
```

Expected:
```
PASS __tests__/habits.test.tsx
  calculateStreak
    ✓ returns 0 when no logs
    ✓ returns 1 when only today is done
    ✓ returns 3 for three consecutive days ending today
    ✓ returns streak from yesterday when today is not done
    ✓ returns 0 when yesterday is missing (broken streak)
    ✓ ignores logs from other habits
  HabitCard
    ✓ renders habit name and emoji
    ✓ calls onToggle when check is pressed
    ✓ shows check mark and calls onToggle with isCompleted=true when already done

Tests: 9 passed
```

- [ ] **Step 3: Final commit**

```bash
git add apps/mobile/__tests__/habits.test.tsx
git commit -m "feat(mobile): add HabitCard smoke tests — Plan 2 (Hábitos MVP) complete"
```

---

## Self-Review Checklist (for implementer)

Before declaring done, verify:

- [ ] `pnpm exec tsc --noEmit` passes with zero errors
- [ ] All 9 tests pass
- [ ] The Hábitos tab no longer shows the placeholder "Próximamente — Plan 2"
- [ ] Tapping `+` opens the HabitModal
- [ ] Creating a habit with a reminder schedules a local notification
- [ ] Tapping the checkbox immediately toggles (no delay visible)
- [ ] Long pressing a card shows Editar / Archivar options
- [ ] Archived habits disappear from the list
- [ ] Free tier: attempting to create a 4th habit shows the limit Alert
