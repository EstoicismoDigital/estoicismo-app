import { buildHeatmap } from "../app/(dashboard)/progreso/ProgresoClient";
import type { HabitLog } from "@estoicismo/supabase";

function makeLog(habitId: string, date: string): HabitLog {
  return {
    id: `log-${habitId}-${date}`,
    habit_id: habitId,
    user_id: "u1",
    completed_at: date,
    note: null,
  };
}

// Fixed today for deterministic layout: Sunday 2026-04-19 (Mon-first DOW 6)
const TODAY = "2026-04-19";

describe("buildHeatmap", () => {
  it("returns at most 13 weeks", () => {
    const weeks = buildHeatmap([], TODAY, 91);
    expect(weeks.length).toBeLessThanOrEqual(13);
    expect(weeks[0]).toHaveLength(7);
  });

  it("places today in the last column when today is Sunday", () => {
    const weeks = buildHeatmap([], TODAY, 91);
    const last = weeks[weeks.length - 1];
    // Sunday is weekday index 6 under Monday-first
    expect(last[6].date).toBe(TODAY);
    expect(last[6].inRange).toBe(true);
  });

  it("marks future padding as not in range", () => {
    // With Tuesday today, the week should extend Wed..Sun as out-of-range.
    const tuesday = "2026-04-14"; // 2026-04-14 is a Tuesday
    const weeks = buildHeatmap([], tuesday, 14);
    const last = weeks[weeks.length - 1];
    // Mon=0 is in range (yesterday), Tue=1 is today, Wed..Sun are padding.
    expect(last[1].date).toBe(tuesday);
    expect(last[1].inRange).toBe(true);
    expect(last[2].inRange).toBe(false);
    expect(last[6].inRange).toBe(false);
  });

  it("counts completions per date", () => {
    const logs: HabitLog[] = [
      makeLog("a", TODAY),
      makeLog("b", TODAY),
      makeLog("c", TODAY),
      makeLog("a", "2026-04-18"),
    ];
    const weeks = buildHeatmap(logs, TODAY, 91);
    const last = weeks[weeks.length - 1];
    // Sunday (today) has 3 logs
    expect(last[6].count).toBe(3);
    // Saturday has 1 log
    expect(last[5].count).toBe(1);
    // Friday has 0
    expect(last[4].count).toBe(0);
  });

  it("ignores logs outside the window", () => {
    const farPast = "2024-01-01";
    const weeks = buildHeatmap([makeLog("a", farPast)], TODAY, 30);
    const allCells = weeks.flat();
    const totalLogs = allCells.reduce((sum, c) => sum + c.count, 0);
    expect(totalLogs).toBe(0);
  });

  it("first column starts on a Monday", () => {
    const weeks = buildHeatmap([], TODAY, 91);
    const firstCell = weeks[0][0];
    const jsDow = new Date(firstCell.date + "T00:00:00").getDay();
    // JS: 0=Sun..6=Sat; Monday-first index 0 corresponds to jsDow === 1
    expect(jsDow).toBe(1);
  });
});
