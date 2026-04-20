import { computeInsights } from "../lib/insights";
import { getCurrentWeekDays, getTodayStr } from "../lib/dateUtils";
import type { Habit, HabitLog } from "@estoicismo/supabase";

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    user_id: "u1",
    name: "Test",
    icon: "✨",
    color: "#4F8EF7",
    frequency: "daily",
    reminder_time: null,
    is_archived: false,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeLog(habitId: string, date: string, suffix = ""): HabitLog {
  return {
    id: `log-${habitId}-${date}${suffix}`,
    habit_id: habitId,
    user_id: "u1",
    completed_at: date,
    note: null,
  };
}

function daysAgo(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("computeInsights", () => {
  it("returns all zeros when there are no habits", () => {
    const today = getTodayStr();
    const res = computeInsights([], [], today);
    expect(res.longestStreak).toBe(0);
    expect(res.weeklyCompleted).toBe(0);
    expect(res.weeklyTotal).toBe(0);
    expect(res.consistency30).toBe(0);
  });

  it("returns zero completions when there are habits but no logs", () => {
    const today = getTodayStr();
    const habits = [makeHabit({ id: "h1" }), makeHabit({ id: "h2" })];
    const res = computeInsights(habits, [], today);
    expect(res.longestStreak).toBe(0);
    expect(res.weeklyCompleted).toBe(0);
    // weeklyTotal counts daily habits for each day up to today
    expect(res.weeklyTotal).toBeGreaterThan(0);
    expect(res.consistency30).toBe(0);
  });

  it("computes a perfect week for a single daily habit", () => {
    const today = getTodayStr();
    const week = getCurrentWeekDays();
    const habits = [makeHabit({ id: "h1" })];
    // One log for every past-or-present day in the week
    const logs = week
      .filter((d) => d.date <= today)
      .map((d) => makeLog("h1", d.date));
    const res = computeInsights(habits, logs, today);
    expect(res.weeklyCompleted).toBe(logs.length);
    expect(res.weeklyTotal).toBe(logs.length);
    // Longest streak is at least the number of trailing consecutive days ending today
    expect(res.longestStreak).toBeGreaterThanOrEqual(1);
  });

  it("tracks partial completion and computes consistency percentage", () => {
    const today = getTodayStr();
    const habits = [makeHabit({ id: "h1" })];
    // Complete every other day over the last 10 days
    const logs: HabitLog[] = [];
    for (let i = 0; i < 10; i += 2) {
      logs.push(makeLog("h1", daysAgo(i)));
    }
    const res = computeInsights(habits, logs, today);
    // 5 completed out of 30 scheduled daily-habit-days -> ~17%
    expect(res.consistency30).toBe(Math.round((5 / 30) * 100));
    // Today is included (offset 0) so streak should be 1 (yesterday missing)
    expect(res.longestStreak).toBe(1);
  });

  it("only counts scheduled days for weekly habits in weeklyTotal", () => {
    const today = getTodayStr();
    // Habit only due on Monday (Mon-first index 0)
    const habits = [makeHabit({ id: "h1", frequency: { days: [0] } })];
    const res = computeInsights(habits, [], today);
    // Only 0 or 1 Monday in a Mon-Sun week (always 1), and only counts if <= today
    expect(res.weeklyTotal).toBeLessThanOrEqual(1);
  });
});
