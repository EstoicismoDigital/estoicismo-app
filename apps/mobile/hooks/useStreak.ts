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
