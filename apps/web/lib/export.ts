import type { Habit, HabitLog } from "@estoicismo/supabase";

/**
 * Versioned export envelope. Bump `version` when the shape changes — future
 * import code can then branch on it without guessing. Dates are ISO strings
 * so the file is trivially grep-able and diff-able.
 */
export type ExportEnvelope = {
  version: 1;
  exportedAt: string;
  habitsCount: number;
  logsCount: number;
  habits: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    frequency: Habit["frequency"];
    reminderTime: string | null;
    isArchived: boolean;
    createdAt: string;
    logs: Array<{
      date: string;
      note: string | null;
    }>;
  }>;
};

/**
 * Project the raw supabase rows into a flat, version-stamped JSON shape
 * ready to be downloaded. Logs are grouped under their habit and sorted
 * oldest-first so a human reading the JSON sees chronological order.
 * Orphan logs (no matching habit) are dropped with the assumption they
 * came from a since-deleted habit.
 *
 * `now` is an injected timestamp so tests can freeze it; production code
 * should pass `new Date().toISOString()`.
 */
export function buildExport(
  habits: Habit[],
  logs: HabitLog[],
  now: string
): ExportEnvelope {
  const byHabit = new Map<string, HabitLog[]>();
  for (const l of logs) {
    const arr = byHabit.get(l.habit_id) ?? [];
    arr.push(l);
    byHabit.set(l.habit_id, arr);
  }

  const projectedHabits = habits.map((h) => {
    const habitLogs = (byHabit.get(h.id) ?? [])
      .slice()
      .sort((a, b) => a.completed_at.localeCompare(b.completed_at));
    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      frequency: h.frequency,
      reminderTime: h.reminder_time,
      isArchived: h.is_archived,
      createdAt: h.created_at,
      logs: habitLogs.map((l) => ({ date: l.completed_at, note: l.note })),
    };
  });

  // Count only logs that were attached to a habit we actually exported.
  const exportedLogsCount = projectedHabits.reduce(
    (n, h) => n + h.logs.length,
    0
  );

  return {
    version: 1,
    exportedAt: now,
    habitsCount: projectedHabits.length,
    logsCount: exportedLogsCount,
    habits: projectedHabits,
  };
}

/**
 * Pretty-stringify the envelope so the downloaded file is human-readable
 * (2-space indent). Tiny wrapper, but centralizes the style choice.
 */
export function exportToJson(env: ExportEnvelope): string {
  return JSON.stringify(env, null, 2);
}

/** Filename like `estoicismo-export-2026-04-20.json`. Must be filesystem-safe. */
export function exportFilename(now: string): string {
  const d = new Date(now);
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `estoicismo-export-${ymd}.json`;
}
