import type { Habit, HabitLog } from "@estoicismo/supabase";
import { computeLongestStreak } from "./dateUtils";

/**
 * A derived, non-persistent achievement: whether it's unlocked today is a
 * pure function of (habits, logs). We don't store unlocks — recomputing is
 * cheap and avoids a migration whenever we add/rename a badge.
 */
export type Achievement = {
  id: string;
  title: string;
  description: string;
  /** Category drives the grouping/sort in the UI. */
  category: "streak" | "volume" | "reflection";
  /** Numeric goal (days, logs, notes). Used for progress bars. */
  target: number;
  /** Current value toward the goal. Capped at `target` in the UI. */
  progress: number;
  /**
   * True when `progress >= target`. When unlocked, `unlockedAt` is the
   * YYYY-MM-DD of the log that first reached the threshold (best-effort).
   */
  unlocked: boolean;
  /** YYYY-MM-DD of the event that unlocked this, or undefined if locked. */
  unlockedAt?: string;
};

/** Streak tiers (best-ever across any single habit). */
const STREAK_TIERS: Array<{
  id: string;
  days: number;
  title: string;
  description: string;
}> = [
  {
    id: "streak-3",
    days: 3,
    title: "Tres días",
    description: "El inicio es siempre lo más difícil.",
  },
  {
    id: "streak-7",
    days: 7,
    title: "Una semana firme",
    description: "El hábito empieza a echar raíces.",
  },
  {
    id: "streak-14",
    days: 14,
    title: "Dos semanas",
    description: "La repetición forja el carácter.",
  },
  {
    id: "streak-30",
    days: 30,
    title: "Un mes completo",
    description: "Ya no es un intento — es quien eres.",
  },
  {
    id: "streak-60",
    days: 60,
    title: "Sesenta días",
    description: "La constancia es un superpoder silencioso.",
  },
  {
    id: "streak-100",
    days: 100,
    title: "Cien días",
    description: "Eres, ante todo, lo que haces repetidamente.",
  },
  {
    id: "streak-365",
    days: 365,
    title: "Un año entero",
    description: "Has atravesado las cuatro estaciones sin rendirte.",
  },
];

/** Volume tiers (total completions across all habits). */
const VOLUME_TIERS: Array<{
  id: string;
  count: number;
  title: string;
  description: string;
}> = [
  {
    id: "volume-1",
    count: 1,
    title: "Primer paso",
    description: "Todo gran camino empieza con un completado.",
  },
  {
    id: "volume-10",
    count: 10,
    title: "Diez repeticiones",
    description: "La práctica empieza a dejar huella.",
  },
  {
    id: "volume-50",
    count: 50,
    title: "Cincuenta completados",
    description: "El hábito ya vive en ti.",
  },
  {
    id: "volume-100",
    count: 100,
    title: "Centenar",
    description: "La constancia se cuenta en hechos, no en intenciones.",
  },
  {
    id: "volume-365",
    count: 365,
    title: "Todo un año",
    description: "Un completado por cada día del año.",
  },
];

/** Reflection tiers (notes written on logs). */
const REFLECTION_TIERS: Array<{
  id: string;
  count: number;
  title: string;
  description: string;
}> = [
  {
    id: "reflection-1",
    count: 1,
    title: "Primera reflexión",
    description: "Escribir ordena el pensamiento.",
  },
  {
    id: "reflection-10",
    count: 10,
    title: "Diez reflexiones",
    description: "La vida examinada merece ser vivida.",
  },
  {
    id: "reflection-50",
    count: 50,
    title: "Cincuenta reflexiones",
    description: "Un diario propio, hecho de tus propias palabras.",
  },
  {
    id: "reflection-100",
    count: 100,
    title: "Cien reflexiones",
    description: "Te lees a ti mismo con más claridad que nunca.",
  },
];

/**
 * Compute all achievement states for the given (habits, logs) set. Order is
 * stable: streak tiers first (ascending), then volume, then reflection. Use
 * this directly in the render; no extra sorting needed.
 */
export function computeAchievements(
  habits: Habit[],
  logs: HabitLog[]
): Achievement[] {
  // Per-habit best streak; also remember the dates that made up each habit's
  // longest run so we can stamp an unlockedAt.
  type StreakInfo = { best: number; endDate: string | null };
  const perHabitStreak = new Map<string, StreakInfo>();
  for (const habit of habits) {
    const dates = logs
      .filter((l) => l.habit_id === habit.id)
      .map((l) => l.completed_at);
    const best = computeLongestStreak(dates);
    perHabitStreak.set(habit.id, {
      best,
      endDate: findLongestRunEnd(dates),
    });
  }

  // Max best across all habits. When a streak tier is unlocked, we attribute
  // it to whichever habit first reached that threshold in time-ordered logs.
  const maxStreak = Array.from(perHabitStreak.values()).reduce(
    (m, s) => Math.max(m, s.best),
    0
  );

  const streakAchievements: Achievement[] = STREAK_TIERS.map((tier) => {
    const unlocked = maxStreak >= tier.days;
    const unlockedAt = unlocked
      ? findFirstRunReachingThreshold(logs, tier.days) ?? undefined
      : undefined;
    return {
      id: tier.id,
      title: tier.title,
      description: tier.description,
      category: "streak",
      target: tier.days,
      progress: Math.min(maxStreak, tier.days),
      unlocked,
      unlockedAt,
    };
  });

  // Volume: sort logs by completed_at and pick the Nth log's date as the
  // unlock date for the N-tier.
  const sortedLogs = [...logs].sort((a, b) =>
    a.completed_at.localeCompare(b.completed_at)
  );
  const totalCount = sortedLogs.length;
  const volumeAchievements: Achievement[] = VOLUME_TIERS.map((tier) => {
    const unlocked = totalCount >= tier.count;
    const unlockedAt =
      unlocked && sortedLogs[tier.count - 1]
        ? sortedLogs[tier.count - 1].completed_at
        : undefined;
    return {
      id: tier.id,
      title: tier.title,
      description: tier.description,
      category: "volume",
      target: tier.count,
      progress: Math.min(totalCount, tier.count),
      unlocked,
      unlockedAt,
    };
  });

  // Reflection: same idea but only logs with non-empty notes.
  const notedLogs = sortedLogs.filter((l) => l.note && l.note.trim() !== "");
  const noteCount = notedLogs.length;
  const reflectionAchievements: Achievement[] = REFLECTION_TIERS.map((tier) => {
    const unlocked = noteCount >= tier.count;
    const unlockedAt =
      unlocked && notedLogs[tier.count - 1]
        ? notedLogs[tier.count - 1].completed_at
        : undefined;
    return {
      id: tier.id,
      title: tier.title,
      description: tier.description,
      category: "reflection",
      target: tier.count,
      progress: Math.min(noteCount, tier.count),
      unlocked,
      unlockedAt,
    };
  });

  return [
    ...streakAchievements,
    ...volumeAchievements,
    ...reflectionAchievements,
  ];
}

/**
 * Find the end date (YYYY-MM-DD) of the *single* longest consecutive run in
 * the list. When there are multiple equal-length maxes, returns the earliest
 * run's end date — we want to credit the user for first hitting the feat.
 */
function findLongestRunEnd(dates: string[]): string | null {
  if (dates.length === 0) return null;
  const sorted = Array.from(new Set(dates)).sort();
  let best = 1;
  let bestEnd = sorted[0];
  let run = 1;
  let curEnd = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const cur = new Date(sorted[i] + "T00:00:00");
    const delta = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    if (delta === 1) {
      run++;
      curEnd = sorted[i];
    } else {
      run = 1;
      curEnd = sorted[i];
    }
    if (run > best) {
      best = run;
      bestEnd = curEnd;
    }
  }
  return bestEnd;
}

/**
 * Scan all habits' logs chronologically and return the earliest date at
 * which *any* habit first had a running streak of at least `threshold`
 * consecutive days ending on that date. Used to stamp unlockedAt on streak
 * achievements. Returns null if no habit ever reached the threshold.
 */
function findFirstRunReachingThreshold(
  logs: HabitLog[],
  threshold: number
): string | null {
  // Group dates by habit.
  const byHabit = new Map<string, string[]>();
  for (const l of logs) {
    const arr = byHabit.get(l.habit_id) ?? [];
    arr.push(l.completed_at);
    byHabit.set(l.habit_id, arr);
  }
  let earliest: string | null = null;
  for (const dates of byHabit.values()) {
    const sorted = Array.from(new Set(dates)).sort();
    let run = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = new Date(sorted[i - 1] + "T00:00:00");
        const cur = new Date(sorted[i] + "T00:00:00");
        const delta = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
        run = delta === 1 ? run + 1 : 1;
      }
      if (run >= threshold) {
        if (!earliest || sorted[i] < earliest) earliest = sorted[i];
        break; // earliest for *this* habit — enough
      }
    }
  }
  return earliest;
}

/**
 * Convenience: just the unlocked achievements, newest first by unlock date.
 * Good for "Logros recientes" carousels or counts.
 */
export function getUnlockedAchievements(
  all: Achievement[]
): Achievement[] {
  return all
    .filter((a) => a.unlocked)
    .sort((a, b) => {
      const ad = a.unlockedAt ?? "";
      const bd = b.unlockedAt ?? "";
      if (ad === bd) return 0;
      return ad < bd ? 1 : -1;
    });
}
