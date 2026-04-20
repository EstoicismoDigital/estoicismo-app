import {
  computeAchievements,
  getUnlockedAchievements,
} from "../lib/achievements";
import type { Habit, HabitLog } from "@estoicismo/supabase";

function makeHabit(id: string, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    user_id: "u1",
    name: `H-${id}`,
    icon: "✨",
    color: "#4F8EF7",
    frequency: "daily",
    reminder_time: null,
    is_archived: false,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function log(habitId: string, date: string, note: string | null = null): HabitLog {
  return {
    id: `log-${habitId}-${date}-${Math.random()}`,
    habit_id: habitId,
    user_id: "u1",
    completed_at: date,
    note,
  };
}

function consecutive(habitId: string, start: string, n: number): HabitLog[] {
  const out: HabitLog[] = [];
  const d = new Date(start + "T00:00:00");
  for (let i = 0; i < n; i++) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push(log(habitId, ds));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

describe("computeAchievements", () => {
  it("all locked when there's no data", () => {
    const res = computeAchievements([], []);
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((a) => !a.unlocked)).toBe(true);
    expect(res.every((a) => a.progress === 0)).toBe(true);
  });

  it("unlocks streak-3 but not streak-7 after a 3-day run", () => {
    const habits = [makeHabit("h1")];
    const logs = consecutive("h1", "2026-04-10", 3);
    const res = computeAchievements(habits, logs);
    const s3 = res.find((a) => a.id === "streak-3")!;
    const s7 = res.find((a) => a.id === "streak-7")!;
    expect(s3.unlocked).toBe(true);
    expect(s3.progress).toBe(3);
    expect(s3.unlockedAt).toBe("2026-04-12"); // 3rd day
    expect(s7.unlocked).toBe(false);
    expect(s7.progress).toBe(3); // partial progress toward 7
  });

  it("uses the longest run across all habits", () => {
    const habits = [makeHabit("h1"), makeHabit("h2")];
    const logs = [
      ...consecutive("h1", "2026-04-10", 5),
      ...consecutive("h2", "2026-04-20", 10),
    ];
    const res = computeAchievements(habits, logs);
    const s7 = res.find((a) => a.id === "streak-7")!;
    const s14 = res.find((a) => a.id === "streak-14")!;
    expect(s7.unlocked).toBe(true);
    expect(s7.progress).toBe(7);
    expect(s14.unlocked).toBe(false);
    expect(s14.progress).toBe(10);
  });

  it("stamps streak unlock with the earliest date the threshold was reached", () => {
    const habits = [makeHabit("h1")];
    // 7 consecutive starting 2026-04-10 -> threshold 3 reached on day 3
    const logs = consecutive("h1", "2026-04-10", 7);
    const res = computeAchievements(habits, logs);
    const s3 = res.find((a) => a.id === "streak-3")!;
    const s7 = res.find((a) => a.id === "streak-7")!;
    expect(s3.unlockedAt).toBe("2026-04-12");
    expect(s7.unlockedAt).toBe("2026-04-16");
  });

  it("counts total completions toward volume tiers", () => {
    const habits = [makeHabit("h1"), makeHabit("h2")];
    const logs = [
      log("h1", "2026-01-01"),
      log("h1", "2026-01-02"),
      log("h2", "2026-01-03"),
    ];
    const res = computeAchievements(habits, logs);
    const v1 = res.find((a) => a.id === "volume-1")!;
    const v10 = res.find((a) => a.id === "volume-10")!;
    expect(v1.unlocked).toBe(true);
    expect(v1.progress).toBe(1);
    expect(v1.unlockedAt).toBe("2026-01-01");
    expect(v10.unlocked).toBe(false);
    expect(v10.progress).toBe(3);
  });

  it("volume unlockedAt is the date of the Nth chronological log", () => {
    const habits = [makeHabit("h1")];
    // 12 logs on distinct dates; the 10th one in sorted order unlocks volume-10
    const logs = consecutive("h1", "2026-01-01", 12);
    const res = computeAchievements(habits, logs);
    const v10 = res.find((a) => a.id === "volume-10")!;
    expect(v10.unlocked).toBe(true);
    expect(v10.unlockedAt).toBe("2026-01-10");
  });

  it("counts only notes with non-whitespace content for reflection tiers", () => {
    const habits = [makeHabit("h1")];
    const logs = [
      log("h1", "2026-01-01", null),
      log("h1", "2026-01-02", ""),
      log("h1", "2026-01-03", "   "),
      log("h1", "2026-01-04", "real reflection"),
      log("h1", "2026-01-05", "another one"),
    ];
    const res = computeAchievements(habits, logs);
    const r1 = res.find((a) => a.id === "reflection-1")!;
    const r10 = res.find((a) => a.id === "reflection-10")!;
    expect(r1.unlocked).toBe(true);
    expect(r1.progress).toBe(1);
    expect(r1.unlockedAt).toBe("2026-01-04");
    expect(r10.unlocked).toBe(false);
    expect(r10.progress).toBe(2);
  });

  it("groups results by category in stable order (streak, volume, reflection)", () => {
    const res = computeAchievements([], []);
    const cats = res.map((a) => a.category);
    const firstVolume = cats.indexOf("volume");
    const firstReflection = cats.indexOf("reflection");
    const lastStreak = cats.lastIndexOf("streak");
    expect(lastStreak).toBeLessThan(firstVolume);
    expect(firstVolume).toBeLessThan(firstReflection);
  });
});

describe("getUnlockedAchievements", () => {
  it("filters out locked and sorts newest unlock first", () => {
    const habits = [makeHabit("h1")];
    const logs = [
      ...consecutive("h1", "2026-01-01", 3), // unlocks streak-3 at 2026-01-03
      log("h1", "2026-02-01", "note!"), // unlocks reflection-1 at 2026-02-01
    ];
    const all = computeAchievements(habits, logs);
    const unlocked = getUnlockedAchievements(all);
    expect(unlocked.every((a) => a.unlocked)).toBe(true);
    // Most recent unlock (2026-02-01 reflection-1) first
    expect(unlocked[0].id).toBe("reflection-1");
  });

  it("returns empty when no achievements are unlocked", () => {
    expect(getUnlockedAchievements(computeAchievements([], []))).toEqual([]);
  });
});
