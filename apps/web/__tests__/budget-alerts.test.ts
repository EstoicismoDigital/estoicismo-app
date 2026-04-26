import {
  spentForCategoryThisMonth,
  computeBudgetStatus,
  computeAllBudgetStatuses,
  summarizeBudgets,
  projectMonthEnd,
} from "../lib/budgets/alerts";
import type { Budget, FinanceTransaction } from "@estoicismo/supabase";

const makeBudget = (id: string, category_id: string, amount: number, threshold = 80): Budget => ({
  id,
  user_id: "u",
  category_id,
  period: "monthly",
  period_start: null,
  amount,
  currency: "MXN",
  alert_threshold: threshold,
  is_active: true,
  created_at: "",
  updated_at: "",
});

const makeTx = (
  category_id: string,
  amount: number,
  date: string,
  kind: "expense" | "income" = "expense"
): FinanceTransaction => ({
  id: `tx-${Math.random()}`,
  user_id: "u",
  amount,
  currency: "MXN",
  kind,
  category_id,
  credit_card_id: null,
  occurred_on: date,
  note: null,
  source: "manual",
  created_at: "",
  updated_at: "",
});

describe("budgets/alerts", () => {
  // Para tests reproducibles usamos fechas fijas dentro de un mes.
  const ref = new Date("2026-04-15T12:00:00");

  describe("spentForCategoryThisMonth", () => {
    it("filters by category + month", () => {
      const txs = [
        makeTx("food", 100, "2026-04-01"),
        makeTx("food", 50, "2026-04-10"),
        makeTx("food", 30, "2026-03-30"), // mes anterior — excluido
        makeTx("transport", 80, "2026-04-05"), // otra categoría
        makeTx("food", 20, "2026-04-15", "income"), // ingreso, no cuenta
      ];
      const total = spentForCategoryThisMonth(txs, "food", ref);
      expect(total).toBe(150);
    });

    it("returns 0 when no transactions", () => {
      expect(spentForCategoryThisMonth([], "food", ref)).toBe(0);
    });
  });

  describe("computeBudgetStatus", () => {
    const budget = makeBudget("b1", "food", 1000);
    const ref = new Date("2026-04-15T12:00:00");

    it("calm at 0%", () => {
      const status = computeBudgetStatus(budget, [], ref);
      expect(status.state).toBe("calm");
      expect(status.percent).toBe(0);
      expect(status.triggered).toBe(false);
    });

    it("watch at 60%", () => {
      const txs = [makeTx("food", 600, "2026-04-10")];
      const status = computeBudgetStatus(budget, txs, ref);
      expect(status.state).toBe("watch");
      expect(status.percent).toBe(60);
    });

    it("caution at 80%", () => {
      const txs = [makeTx("food", 800, "2026-04-10")];
      const status = computeBudgetStatus(budget, txs, ref);
      expect(status.state).toBe("caution");
      expect(status.triggered).toBe(true); // alert_threshold = 80
    });

    it("alert at 95%", () => {
      const txs = [makeTx("food", 950, "2026-04-10")];
      const status = computeBudgetStatus(budget, txs, ref);
      expect(status.state).toBe("alert");
    });

    it("exceeded over 100%", () => {
      const txs = [makeTx("food", 1200, "2026-04-10")];
      const status = computeBudgetStatus(budget, txs, ref);
      expect(status.state).toBe("exceeded");
      expect(status.percent).toBeGreaterThan(100);
    });
  });

  describe("computeAllBudgetStatuses", () => {
    it("computes one status per budget", () => {
      const budgets = [
        makeBudget("b1", "food", 1000),
        makeBudget("b2", "transport", 500),
      ];
      const txs = [
        makeTx("food", 800, "2026-04-10"),
        makeTx("transport", 100, "2026-04-12"),
      ];
      const all = computeAllBudgetStatuses(budgets, txs, ref);
      expect(all).toHaveLength(2);
      expect(all[0].percent).toBe(80);
      expect(all[1].percent).toBe(20);
    });
  });

  describe("summarizeBudgets", () => {
    it("counts triggered and exceeded", () => {
      const budgets = [
        makeBudget("b1", "food", 1000),
        makeBudget("b2", "transport", 500),
        makeBudget("b3", "ocio", 200),
      ];
      const txs = [
        makeTx("food", 800, "2026-04-10"), // 80% → triggered
        makeTx("transport", 100, "2026-04-12"), // 20% → calm
        makeTx("ocio", 250, "2026-04-13"), // 125% → exceeded
      ];
      const all = computeAllBudgetStatuses(budgets, txs, ref);
      const summary = summarizeBudgets(all);
      expect(summary.total).toBe(3);
      expect(summary.triggered).toBe(2); // food y ocio
      expect(summary.exceeded).toBe(1);
      expect(summary.totalLimit).toBe(1700);
      expect(summary.totalSpent).toBe(1150);
    });
  });

  describe("projectMonthEnd", () => {
    const ref = new Date("2026-04-15T12:00:00"); // día 15 de un mes de 30 días
    it("doubles ish the spent at midmonth", () => {
      const r = projectMonthEnd(750, ref);
      // spent 750 / día 15 × 30 = 1500
      expect(r.projected).toBe(1500);
      expect(r.daysElapsed).toBe(15);
      expect(r.daysInMonth).toBe(30);
    });
  });
});
