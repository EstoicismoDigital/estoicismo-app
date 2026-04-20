"use client";
import { useQuery } from "@tanstack/react-query";
import {
  fetchHabits,
  fetchHabitLogs,
  type Habit,
  type HabitLog,
} from "@estoicismo/supabase";
import { getSupabaseBrowserClient } from "../lib/supabase-client";

/**
 * Inclusive window ends on `today`. 365 days covers a full year of reflections
 * — plenty for UX purposes; beyond that the page offers an "older" pagination
 * hook if we ever decide to add one. Choosing a wide but bounded window keeps
 * the payload predictable on big histories.
 */
const NOTES_WINDOW_DAYS = 365;

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

function ymdNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ymdToday(): string {
  return ymdNDaysAgo(0);
}

/**
 * Fetch habits + habit_logs for the trailing year in parallel. Shape is
 * intentionally left raw — projection into NoteEntry happens in the client
 * component so we can keep pure helpers (`lib/notes.ts`) independently
 * testable and swap filter/search inputs without refetching.
 *
 * Queries also include logs *without* notes; the client filters. This lets
 * us share the `habit-logs` cache across pages (hoy, progreso) instead of
 * fetching twice for the same date range.
 */
export function useAllNotes() {
  const from = ymdNDaysAgo(NOTES_WINDOW_DAYS);
  const to = ymdToday();

  const habitsQ = useQuery<Habit[]>({
    // Matches the existing key in useHabits so the two pages share cache.
    queryKey: ["habits"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchHabits(sb, await getUserId());
    },
  });

  const logsQ = useQuery<HabitLog[]>({
    queryKey: ["habit-logs", from, to],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchHabitLogs(sb, await getUserId(), from, to);
    },
  });

  return {
    habits: habitsQ.data ?? [],
    logs: logsQ.data ?? [],
    isLoading: habitsQ.isLoading || logsQ.isLoading,
    error: habitsQ.error ?? logsQ.error,
  };
}
