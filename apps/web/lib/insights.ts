import type { Habit, HabitLog } from "@estoicismo/supabase";
import { computeStreak, getCurrentWeekDays } from "./dateUtils";

export type Insights = {
  /** Longest active streak across all habits. */
  longestStreak: number;
  /** Logs completed within the current Monday–Sunday week. */
  weeklyCompleted: number;
  /** Total possible completions this week, counting only days scheduled for each habit and not in the future. */
  weeklyTotal: number;
  /** Integer 0..100 representing completion % over the last 30 days. */
  consistency30: number;
};

/** "YYYY-MM-DD" for a given offset (days) from `today`. `today` must be YYYY-MM-DD. */
function shiftDay(today: string, deltaDays: number): string {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() + deltaDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Monday=0..Sunday=6 for a given "YYYY-MM-DD". */
function monFirstDow(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const jsDow = d.getDay();
  return jsDow === 0 ? 6 : jsDow - 1;
}

function isHabitDueOn(habit: Habit, dateStr: string): boolean {
  const freq = habit.frequency;
  if (freq === "daily" || freq === "weekly") return true;
  if (typeof freq === "object" && freq && "days" in freq) {
    return freq.days.includes(monFirstDow(dateStr));
  }
  return true;
}

export function computeInsights(
  habits: Habit[],
  logs: HabitLog[],
  today: string
): Insights {
  // Longest streak
  let longestStreak = 0;
  for (const habit of habits) {
    const dates = logs
      .filter((l) => l.habit_id === habit.id)
      .map((l) => l.completed_at);
    const s = computeStreak(dates);
    if (s > longestStreak) longestStreak = s;
  }

  // Weekly window (Mon-Sun)
  const week = getCurrentWeekDays();
  const weekDates = new Set(week.map((d) => d.date));
  const weeklyCompleted = logs.filter((l) => weekDates.has(l.completed_at))
    .length;

  let weeklyTotal = 0;
  for (const habit of habits) {
    for (const d of week) {
      if (d.date > today) continue; // don't count future days
      if (isHabitDueOn(habit, d.date)) weeklyTotal++;
    }
  }

  // 30-day consistency: of habit-days scheduled in the last 30 days (incl. today),
  // how many were completed?
  let considered = 0;
  let completed = 0;
  const logSet = new Set(
    logs.map((l) => `${l.habit_id}|${l.completed_at}`)
  );
  for (let i = 0; i < 30; i++) {
    const day = shiftDay(today, -i);
    for (const habit of habits) {
      if (!isHabitDueOn(habit, day)) continue;
      considered++;
      if (logSet.has(`${habit.id}|${day}`)) completed++;
    }
  }
  const consistency30 =
    considered === 0 ? 0 : Math.round((completed / considered) * 100);

  return { longestStreak, weeklyCompleted, weeklyTotal, consistency30 };
}
