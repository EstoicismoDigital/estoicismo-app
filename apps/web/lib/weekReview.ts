import type { Habit, HabitLog } from "@estoicismo/supabase";
import { getCurrentWeekDays } from "./dateUtils";

/**
 * Aggregate stats for the current Mon-Sun week. This is a pure projection of
 * (habits, logs, weekDates) — no network, no storage.
 */
export type WeekReview = {
  /** Mon..Sun dates for the week the user is currently in. */
  weekDates: string[];
  /** Total completion rows whose date falls in weekDates. */
  totalCompletions: number;
  /** Number of completions with a non-empty note. */
  notedCompletions: number;
  /** Days on which at least one habit was completed. */
  activeDays: number;
  /** Per-habit completion counts for the week, richest first. */
  perHabit: Array<{
    habit: Habit;
    completions: number;
    notes: number;
  }>;
  /** The habit with the most completions this week, or null if zero. */
  topHabit: Habit | null;
  /**
   * Bounded, deterministic prompt index (0..PROMPTS.length-1) computed from
   * the week's Monday. Same user sees the same prompt for the whole week,
   * then rotates.
   */
  promptIndex: number;
};

/**
 * Stoic prompts for the weekly review. Each is a question meant to be written
 * about in the Notas feed. Rotating deterministically by week means a user
 * who journals every Sunday sees a new one each time without randomness.
 */
export const STOIC_PROMPTS: readonly string[] = [
  "¿Qué hábito te costó más esta semana, y qué te enseñó esa resistencia?",
  "¿Qué hiciste bien que podrías repetir la próxima semana sin excusa?",
  "Si solo pudieras conservar uno de tus hábitos, ¿cuál sería y por qué?",
  "¿Qué parte de tu semana estuvo bajo tu control, y qué parte no?",
  "¿De qué te sientes orgulloso, aunque nadie lo haya notado?",
  "¿Qué harías distinto si supieras que la semana que viene será la última?",
  "¿A qué dedicaste más tiempo del que merecía? ¿Y qué descuidaste?",
  "¿Qué pequeño avance cuenta más hoy que cuando lo empezaste?",
  "¿Qué aprendiste sobre ti observando tus rachas y caídas?",
  "¿Qué dejarías atrás si pudieras cerrar esta semana con una sola acción?",
  "¿Qué hábito te devolvió energía en lugar de pedírtela?",
  "¿Qué excusa se repitió esta semana, y es tan sólida como suena?",
  "¿Qué habría dicho Marco Aurelio sobre cómo viviste estos siete días?",
] as const;

/**
 * Week-index helper. Uses the Monday of this week's ISO date as the bucket
 * key, so the index advances exactly every Monday regardless of timezone or
 * reference point.
 */
function promptIndexFromDates(weekDates: string[]): number {
  if (weekDates.length === 0) return 0;
  const monday = new Date(weekDates[0] + "T00:00:00");
  // Days since the Unix epoch (rounded), then /7 for weeks, mod prompt count.
  const daysSinceEpoch = Math.floor(monday.getTime() / 86_400_000);
  const weeksSinceEpoch = Math.floor(daysSinceEpoch / 7);
  const n = STOIC_PROMPTS.length;
  return ((weeksSinceEpoch % n) + n) % n;
}

export function computeWeekReview(
  habits: Habit[],
  logs: HabitLog[]
): WeekReview {
  const weekDates = getCurrentWeekDays().map((d) => d.date);
  const weekSet = new Set(weekDates);

  const weekLogs = logs.filter((l) => weekSet.has(l.completed_at));
  const totalCompletions = weekLogs.length;
  const notedCompletions = weekLogs.filter(
    (l) => l.note && l.note.trim() !== ""
  ).length;
  const activeDays = new Set(weekLogs.map((l) => l.completed_at)).size;

  const byHabit = new Map<string, { completions: number; notes: number }>();
  for (const l of weekLogs) {
    const cur = byHabit.get(l.habit_id) ?? { completions: 0, notes: 0 };
    cur.completions += 1;
    if (l.note && l.note.trim() !== "") cur.notes += 1;
    byHabit.set(l.habit_id, cur);
  }

  const perHabit = habits
    .map((habit) => ({
      habit,
      completions: byHabit.get(habit.id)?.completions ?? 0,
      notes: byHabit.get(habit.id)?.notes ?? 0,
    }))
    .sort(
      (a, b) =>
        b.completions - a.completions ||
        b.notes - a.notes ||
        a.habit.name.localeCompare(b.habit.name)
    );

  const topHabitRow = perHabit.find((row) => row.completions > 0);
  const topHabit = topHabitRow ? topHabitRow.habit : null;

  return {
    weekDates,
    totalCompletions,
    notedCompletions,
    activeDays,
    perHabit,
    topHabit,
    promptIndex: promptIndexFromDates(weekDates),
  };
}
