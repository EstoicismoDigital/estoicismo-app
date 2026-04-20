import { computeWeekReview, STOIC_PROMPTS } from "../lib/weekReview";
import { getCurrentWeekDays } from "../lib/dateUtils";
import type { Habit, HabitLog } from "@estoicismo/supabase";

function makeHabit(id: string, name = `H-${id}`): Habit {
  return {
    id,
    user_id: "u1",
    name,
    icon: "✨",
    color: "#4F8EF7",
    frequency: "daily",
    reminder_time: null,
    is_archived: false,
    created_at: "2025-01-01T00:00:00Z",
  };
}

function makeLog(
  habitId: string,
  date: string,
  note: string | null = null
): HabitLog {
  return {
    id: `log-${habitId}-${date}-${Math.random()}`,
    habit_id: habitId,
    user_id: "u1",
    completed_at: date,
    note,
  };
}

describe("computeWeekReview", () => {
  it("returns zeros when there are no logs", () => {
    const r = computeWeekReview([makeHabit("h1")], []);
    expect(r.totalCompletions).toBe(0);
    expect(r.notedCompletions).toBe(0);
    expect(r.activeDays).toBe(0);
    expect(r.topHabit).toBeNull();
    expect(r.perHabit).toHaveLength(1);
    expect(r.perHabit[0].completions).toBe(0);
  });

  it("ignores logs outside the current week", () => {
    const habits = [makeHabit("h1")];
    // Fabricate a log from far in the past — guaranteed outside this week.
    const r = computeWeekReview(habits, [makeLog("h1", "2000-01-01")]);
    expect(r.totalCompletions).toBe(0);
  });

  it("counts completions, noted completions, and active days within the week", () => {
    const habits = [makeHabit("h1"), makeHabit("h2")];
    const week = getCurrentWeekDays().map((d) => d.date);
    const logs = [
      makeLog("h1", week[0], "reflexión monday"),
      makeLog("h2", week[0]),
      makeLog("h1", week[1]),
      makeLog("h2", week[1], "mart"),
      makeLog("h1", week[2]),
    ];
    const r = computeWeekReview(habits, logs);
    expect(r.totalCompletions).toBe(5);
    expect(r.notedCompletions).toBe(2);
    expect(r.activeDays).toBe(3);
  });

  it("ranks perHabit by completions descending, with stable name tiebreak", () => {
    const habits = [makeHabit("h1", "Zelda"), makeHabit("h2", "Aarón")];
    const week = getCurrentWeekDays().map((d) => d.date);
    const logs = [
      makeLog("h1", week[0]),
      makeLog("h2", week[0]),
    ];
    // Same completion count → alpha by habit name; Aarón before Zelda
    const r = computeWeekReview(habits, logs);
    expect(r.perHabit.map((x) => x.habit.name)).toEqual(["Aarón", "Zelda"]);
  });

  it("topHabit is the one with the most completions", () => {
    const habits = [makeHabit("h1", "Lecturas"), makeHabit("h2", "Meditar")];
    const week = getCurrentWeekDays().map((d) => d.date);
    const logs = [
      makeLog("h1", week[0]),
      makeLog("h1", week[1]),
      makeLog("h1", week[2]),
      makeLog("h2", week[0]),
    ];
    const r = computeWeekReview(habits, logs);
    expect(r.topHabit?.name).toBe("Lecturas");
  });

  it("topHabit is null when there are zero completions", () => {
    const r = computeWeekReview([makeHabit("h1")], []);
    expect(r.topHabit).toBeNull();
  });

  it("promptIndex is within the prompt array bounds", () => {
    const r = computeWeekReview([makeHabit("h1")], []);
    expect(r.promptIndex).toBeGreaterThanOrEqual(0);
    expect(r.promptIndex).toBeLessThan(STOIC_PROMPTS.length);
  });

  it("promptIndex is stable within a week (same Monday)", () => {
    // Two calls in the same week must yield the same index.
    const r1 = computeWeekReview([makeHabit("h1")], []);
    const r2 = computeWeekReview([makeHabit("h2")], []);
    expect(r1.promptIndex).toBe(r2.promptIndex);
  });
});
