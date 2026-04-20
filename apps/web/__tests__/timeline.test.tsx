import { getVisibleTimelineHabits, isHabitDueOn } from "../components/habits/TodayTimeline";
import type { Habit } from "@estoicismo/supabase";

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

describe("TodayTimeline helpers", () => {
  it("places habits without reminder_time into 'sin horario' bucket", () => {
    const habits = [
      makeHabit({ id: "a", name: "Sin hora", reminder_time: null }),
      makeHabit({ id: "b", name: "Con hora", reminder_time: "08:00:00" }),
    ];
    const { scheduled, unscheduled } = getVisibleTimelineHabits(
      habits,
      "2026-04-20"
    );
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].habit.id).toBe("b");
    expect(unscheduled).toHaveLength(1);
    expect(unscheduled[0].habit.id).toBe("a");
  });

  it("sorts habits with reminder_time chronologically", () => {
    const habits = [
      makeHabit({ id: "late", reminder_time: "21:30" }),
      makeHabit({ id: "early", reminder_time: "07:15" }),
      makeHabit({ id: "mid", reminder_time: "13:00:00" }),
    ];
    const { scheduled } = getVisibleTimelineHabits(habits, "2026-04-20");
    expect(scheduled.map((s) => s.habit.id)).toEqual(["early", "mid", "late"]);
  });

  it("filters out weekly-frequency habits not due today", () => {
    // 2026-04-20 is a Monday (Mon-first index 0).
    // A habit scheduled only on Wednesday (index 2) must be filtered out.
    const wedOnly = makeHabit({
      id: "wed",
      name: "Solo miércoles",
      frequency: { days: [2] },
      reminder_time: "09:00",
    });
    const monOnly = makeHabit({
      id: "mon",
      name: "Solo lunes",
      frequency: { days: [0] },
      reminder_time: "09:00",
    });
    const { scheduled } = getVisibleTimelineHabits(
      [wedOnly, monOnly],
      "2026-04-20"
    );
    expect(scheduled.map((s) => s.habit.id)).toEqual(["mon"]);
    expect(isHabitDueOn(wedOnly, "2026-04-20")).toBe(false);
    expect(isHabitDueOn(monOnly, "2026-04-20")).toBe(true);
  });
});
