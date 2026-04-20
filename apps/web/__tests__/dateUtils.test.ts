import {
  getTodayStr,
  getCurrentWeekDays,
  getMonthGrid,
  computeStreak,
  computeLongestStreak,
  formatMonthLabel,
  getMonthRange,
} from "../lib/dateUtils";

describe("dateUtils", () => {
  describe("getTodayStr", () => {
    it("returns a YYYY-MM-DD string", () => {
      const s = getTodayStr();
      expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getCurrentWeekDays", () => {
    it("returns 7 entries", () => {
      const week = getCurrentWeekDays();
      expect(week).toHaveLength(7);
    });

    it("exactly one entry is marked isToday=true", () => {
      const week = getCurrentWeekDays();
      const todays = week.filter((d) => d.isToday);
      expect(todays).toHaveLength(1);
      expect(todays[0].date).toBe(getTodayStr());
    });

    it("first entry is Lunes and last is Domingo", () => {
      const week = getCurrentWeekDays();
      expect(week[0].label).toBe("L");
      expect(week[6].label).toBe("D");
    });

    it("dates are consecutive", () => {
      const week = getCurrentWeekDays();
      for (let i = 1; i < week.length; i++) {
        const prev = new Date(week[i - 1].date);
        const cur = new Date(week[i].date);
        expect(cur.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
      }
    });
  });

  describe("getMonthGrid", () => {
    it("returns 42 cells (6 weeks)", () => {
      const cells = getMonthGrid(2026, 3); // April 2026 (0-indexed)
      expect(cells).toHaveLength(42);
    });

    it("fills in dates and pads with null", () => {
      // April 2026: 1st is a Wednesday (dow=3) -> pad 2, 30 days, so 2 + 30 = 32 real cells
      const cells = getMonthGrid(2026, 3);
      const realCells = cells.filter((c): c is string => c !== null);
      expect(realCells).toHaveLength(30);
      expect(realCells[0]).toBe("2026-04-01");
      expect(realCells[realCells.length - 1]).toBe("2026-04-30");
    });

    it("handles December correctly and 31-day months", () => {
      const cells = getMonthGrid(2025, 11); // December 2025, 31 days
      const realCells = cells.filter((c): c is string => c !== null);
      expect(realCells).toHaveLength(31);
      expect(realCells[0]).toBe("2025-12-01");
      expect(realCells[30]).toBe("2025-12-31");
    });

    it("handles February leap-year edge (2024)", () => {
      const cells = getMonthGrid(2024, 1); // February 2024, leap year -> 29 days
      const realCells = cells.filter((c): c is string => c !== null);
      expect(realCells).toHaveLength(29);
    });
  });

  describe("computeStreak", () => {
    it("returns 0 for empty array", () => {
      expect(computeStreak([])).toBe(0);
    });

    it("counts streak ending today", () => {
      const today = new Date();
      const ds = (offset: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() - offset);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };
      // today, yesterday, 2 days ago, and a gap of 4 days -> streak = 3
      const dates = [ds(0), ds(1), ds(2), ds(5)];
      expect(computeStreak(dates)).toBe(3);
    });

    it("still counts when today missing but yesterday present", () => {
      const today = new Date();
      const ds = (offset: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() - offset);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };
      // yesterday + day before = streak 2, today missing
      const dates = [ds(1), ds(2)];
      expect(computeStreak(dates)).toBe(2);
    });

    it("returns 0 if neither today nor yesterday completed", () => {
      const today = new Date();
      const ds = (offset: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() - offset);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };
      const dates = [ds(3), ds(4)];
      expect(computeStreak(dates)).toBe(0);
    });
  });

  describe("computeLongestStreak", () => {
    it("returns 0 for empty array", () => {
      expect(computeLongestStreak([])).toBe(0);
    });

    it("returns 1 for a single date", () => {
      expect(computeLongestStreak(["2026-04-20"])).toBe(1);
    });

    it("counts consecutive days as one run", () => {
      expect(
        computeLongestStreak(["2026-04-18", "2026-04-19", "2026-04-20"])
      ).toBe(3);
    });

    it("returns the longest run when multiple runs exist", () => {
      // run A: 10-11 (length 2), run B: 20-21-22 (length 3)
      expect(
        computeLongestStreak([
          "2026-04-10",
          "2026-04-11",
          "2026-04-20",
          "2026-04-21",
          "2026-04-22",
        ])
      ).toBe(3);
    });

    it("is order-independent", () => {
      const asc = ["2026-04-18", "2026-04-19", "2026-04-20"];
      const desc = [...asc].reverse();
      const shuffled = ["2026-04-20", "2026-04-18", "2026-04-19"];
      expect(computeLongestStreak(asc)).toBe(3);
      expect(computeLongestStreak(desc)).toBe(3);
      expect(computeLongestStreak(shuffled)).toBe(3);
    });

    it("deduplicates repeated dates", () => {
      expect(
        computeLongestStreak([
          "2026-04-20",
          "2026-04-20",
          "2026-04-20",
        ])
      ).toBe(1);
    });

    it("resets the run on any gap", () => {
      expect(
        computeLongestStreak(["2026-04-10", "2026-04-12"])
      ).toBe(1);
    });

    it("crosses month boundaries", () => {
      expect(
        computeLongestStreak([
          "2026-03-30",
          "2026-03-31",
          "2026-04-01",
          "2026-04-02",
        ])
      ).toBe(4);
    });

    it("crosses leap-year Feb 28 → 29 boundary", () => {
      expect(
        computeLongestStreak(["2024-02-27", "2024-02-28", "2024-02-29", "2024-03-01"])
      ).toBe(4);
    });
  });

  describe("formatMonthLabel", () => {
    it("formats Spanish month and year", () => {
      expect(formatMonthLabel(2026, 3)).toBe("Abril 2026");
      expect(formatMonthLabel(2025, 0)).toBe("Enero 2025");
      expect(formatMonthLabel(2025, 11)).toBe("Diciembre 2025");
    });
  });

  describe("getMonthRange", () => {
    it("returns first and last day of the given month", () => {
      expect(getMonthRange(2026, 3)).toEqual({ from: "2026-04-01", to: "2026-04-30" });
      expect(getMonthRange(2025, 1)).toEqual({ from: "2025-02-01", to: "2025-02-28" });
      expect(getMonthRange(2024, 1)).toEqual({ from: "2024-02-01", to: "2024-02-29" });
    });
  });
});
