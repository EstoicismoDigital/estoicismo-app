/**
 * Unit tests for the browser-reminder scheduler helpers.
 *
 * `shouldFire` is pure and gets the bulk of the coverage: all decisions
 * that determine whether a habit reminder should pop *right now* live
 * there. The side-effect helpers (`hasFired` / `markFired` / `firedKey`)
 * get light round-trip coverage against jsdom's localStorage.
 */
import {
  firedKey,
  formatHM,
  hasFired,
  markFired,
  normalizeTime,
  shouldFire,
} from "../lib/notifications";
import type { Habit } from "@estoicismo/supabase";

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    user_id: "u1",
    name: "Meditar",
    icon: "🧘",
    color: "#8B6F47",
    frequency: "daily",
    reminder_time: "07:30",
    is_archived: false,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("formatHM", () => {
  it("zero-pads hours and minutes", () => {
    expect(formatHM(new Date(2026, 3, 20, 7, 5))).toBe("07:05");
  });

  it("handles midnight", () => {
    expect(formatHM(new Date(2026, 3, 20, 0, 0))).toBe("00:00");
  });

  it("handles late evening", () => {
    expect(formatHM(new Date(2026, 3, 20, 23, 59))).toBe("23:59");
  });
});

describe("normalizeTime", () => {
  it("trims seconds from a DB-style time string", () => {
    expect(normalizeTime("07:30:00")).toBe("07:30");
  });

  it("passes through an already-short HH:MM string", () => {
    expect(normalizeTime("07:30")).toBe("07:30");
  });
});

describe("firedKey", () => {
  it("produces a namespaced, stable key", () => {
    expect(firedKey("h1", "2026-04-20")).toBe(
      "estoicismo:reminder-fired:h1:2026-04-20"
    );
  });

  it("changes when either component changes", () => {
    expect(firedKey("h1", "2026-04-20")).not.toBe(
      firedKey("h2", "2026-04-20")
    );
    expect(firedKey("h1", "2026-04-20")).not.toBe(
      firedKey("h1", "2026-04-21")
    );
  });
});

describe("hasFired / markFired", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns false before markFired", () => {
    expect(hasFired("h1", "2026-04-20")).toBe(false);
  });

  it("returns true after markFired on the same key", () => {
    markFired("h1", "2026-04-20");
    expect(hasFired("h1", "2026-04-20")).toBe(true);
  });

  it("is scoped per-habit-per-day", () => {
    markFired("h1", "2026-04-20");
    expect(hasFired("h1", "2026-04-21")).toBe(false);
    expect(hasFired("h2", "2026-04-20")).toBe(false);
  });
});

describe("shouldFire", () => {
  const today = "2026-04-20"; // Monday
  const empty = new Set<string>();

  it("fires when the reminder time has passed and nothing suppresses it", () => {
    expect(
      shouldFire({
        habit: makeHabit({ reminder_time: "07:30" }),
        today,
        nowHM: "07:30",
        completedHabitIds: empty,
        firedHabitIds: empty,
      })
    ).toBe(true);
  });

  it("does not fire before the reminder time", () => {
    expect(
      shouldFire({
        habit: makeHabit({ reminder_time: "07:30" }),
        today,
        nowHM: "07:29",
        completedHabitIds: empty,
        firedHabitIds: empty,
      })
    ).toBe(false);
  });

  it("does not fire when no reminder time is set", () => {
    expect(
      shouldFire({
        habit: makeHabit({ reminder_time: null }),
        today,
        nowHM: "07:30",
        completedHabitIds: empty,
        firedHabitIds: empty,
      })
    ).toBe(false);
  });

  it("does not fire for archived habits", () => {
    expect(
      shouldFire({
        habit: makeHabit({ is_archived: true }),
        today,
        nowHM: "07:30",
        completedHabitIds: empty,
        firedHabitIds: empty,
      })
    ).toBe(false);
  });

  it("does not fire when the habit is already completed today", () => {
    expect(
      shouldFire({
        habit: makeHabit({ id: "h1" }),
        today,
        nowHM: "07:30",
        completedHabitIds: new Set(["h1"]),
        firedHabitIds: empty,
      })
    ).toBe(false);
  });

  it("does not fire twice — `firedHabitIds` suppresses a second call", () => {
    expect(
      shouldFire({
        habit: makeHabit({ id: "h1" }),
        today,
        nowHM: "07:30",
        completedHabitIds: empty,
        firedHabitIds: new Set(["h1"]),
      })
    ).toBe(false);
  });

  it("respects weekday frequency — skips a day the habit is not due", () => {
    // 2026-04-20 is a Monday. Monday-first index 0. Sunday-only habit
    // should NOT fire on a Monday.
    expect(
      shouldFire({
        habit: makeHabit({ frequency: { days: [6] } }), // Sunday only
        today,
        nowHM: "07:30",
        completedHabitIds: empty,
        firedHabitIds: empty,
      })
    ).toBe(false);
  });

  it("respects weekday frequency — fires on a day the habit IS due", () => {
    expect(
      shouldFire({
        habit: makeHabit({ frequency: { days: [0] } }), // Monday only
        today,
        nowHM: "07:30",
        completedHabitIds: empty,
        firedHabitIds: empty,
      })
    ).toBe(true);
  });

  it("normalizes HH:MM:SS reminder strings from the DB", () => {
    expect(
      shouldFire({
        habit: makeHabit({ reminder_time: "07:30:00" }),
        today,
        nowHM: "07:30",
        completedHabitIds: empty,
        firedHabitIds: empty,
      })
    ).toBe(true);
  });

  it("stays fired after the reminder time passes (late tick still triggers)", () => {
    // Tab may sleep; when it wakes at 09:15 a 07:30 reminder should
    // still fire unless already suppressed.
    expect(
      shouldFire({
        habit: makeHabit({ reminder_time: "07:30" }),
        today,
        nowHM: "09:15",
        completedHabitIds: empty,
        firedHabitIds: empty,
      })
    ).toBe(true);
  });
});
