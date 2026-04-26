import { progressForGoal, progressForAllGoals } from "../lib/savings/projection";
import type { SavingsGoal, SavingsContribution } from "@estoicismo/supabase";

const makeGoal = (
  id: string,
  target: number,
  deadline: string | null = null
): SavingsGoal => ({
  id,
  user_id: "u",
  name: "test",
  target_amount: target,
  currency: "MXN",
  deadline,
  image_url: null,
  icon: "piggy-bank",
  color: "#000",
  notes: null,
  is_completed: false,
  completed_at: null,
  position: 0,
  created_at: "",
  updated_at: "",
});

const makeContrib = (
  goal_id: string,
  amount: number,
  occurred_on: string
): SavingsContribution => ({
  id: `c-${Math.random()}`,
  user_id: "u",
  goal_id,
  amount,
  transaction_id: null,
  occurred_on,
  note: null,
  created_at: "",
});

describe("savings/projection", () => {
  describe("progressForGoal", () => {
    const goal = makeGoal("g1", 10000);
    const ref = new Date("2026-04-15T12:00:00");

    it("zero saved with no contributions", () => {
      const p = progressForGoal(goal, [], ref);
      expect(p.saved).toBe(0);
      expect(p.percent).toBe(0);
      expect(p.remaining).toBe(10000);
      expect(p.isCompleted).toBe(false);
    });

    it("computes saved + percent correctly", () => {
      const contribs = [
        makeContrib("g1", 1000, "2026-04-01"),
        makeContrib("g1", 1500, "2026-04-10"),
        makeContrib("g2", 5000, "2026-04-10"), // distinta meta — ignorada
      ];
      const p = progressForGoal(goal, contribs, ref);
      expect(p.saved).toBe(2500);
      expect(p.percent).toBe(25);
      expect(p.remaining).toBe(7500);
    });

    it("flags completed when saved >= target", () => {
      const contribs = [makeContrib("g1", 12000, "2026-04-01")];
      const p = progressForGoal(goal, contribs, ref);
      expect(p.isCompleted).toBe(true);
      expect(p.percent).toBe(100); // capped
    });

    it("computes monthly required when deadline set", () => {
      const goalWithDeadline = makeGoal("g1", 10000, "2026-10-15"); // 6 meses
      const p = progressForGoal(goalWithDeadline, [], ref);
      expect(p.daysToDeadline).toBeCloseTo(183, -1);
      expect(p.monthlyRequired).not.toBeNull();
      expect(p.monthlyRequired!).toBeGreaterThan(1000); // ~1700/mes
      expect(p.monthlyRequired!).toBeLessThan(2000);
    });

    it("ETA at current rate", () => {
      const contribs = [
        makeContrib("g1", 1500, "2026-03-15"), // hace 30 días
        makeContrib("g1", 1500, "2026-04-15"), // hoy
      ];
      const p = progressForGoal(goal, contribs, ref);
      // monthlyAverage = 3000/3 = 1000/mes
      // remaining = 7000 → 7000/1000 = 7 meses
      expect(p.etaMonths).toBe(7);
    });

    it("ETA null when no recent activity", () => {
      const p = progressForGoal(goal, [], ref);
      expect(p.etaMonths).toBeNull();
    });
  });

  describe("progressForAllGoals", () => {
    it("returns one progress per goal", () => {
      const goals = [makeGoal("a", 1000), makeGoal("b", 2000)];
      const all = progressForAllGoals(goals, []);
      expect(all).toHaveLength(2);
    });
  });
});
