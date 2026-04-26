import {
  monthlyInterest,
  simulatePayoff,
  payoffMonths,
  advanceBalance,
  orderDebtsByStrategy,
  simulateStrategy,
  compareStrategies,
  compareExtraPayment,
  type DebtInput,
} from "../lib/debt/amortization";

describe("debt/amortization", () => {
  describe("monthlyInterest", () => {
    it("0 for zero balance", () => {
      expect(monthlyInterest(0, 36)).toBe(0);
    });
    it("0 for zero APR", () => {
      expect(monthlyInterest(1000, 0)).toBe(0);
    });
    it("computes monthly interest correctly", () => {
      // 10000 × 36/100/12 = 300
      expect(monthlyInterest(10000, 36)).toBe(300);
    });
  });

  describe("simulatePayoff", () => {
    const baseDebt: DebtInput = {
      id: "d1",
      balance: 10000,
      apr: 24,
      minimum_payment: 500,
    };

    it("liquidates with adequate payment", () => {
      const r = simulatePayoff(baseDebt, 500);
      expect(r.willGrow).toBe(false);
      expect(r.months).toBeGreaterThan(0);
      expect(r.months).toBeLessThan(60);
      // Last row should leave balance 0
      expect(r.schedule[r.schedule.length - 1].endBalance).toBe(0);
    });

    it("flags willGrow when payment < interest", () => {
      const r = simulatePayoff(
        { id: "d1", balance: 10000, apr: 60, minimum_payment: 100 },
        100
      );
      expect(r.willGrow).toBe(true);
    });

    it("higher payment = fewer months", () => {
      const r1 = simulatePayoff(baseDebt, 500);
      const r2 = simulatePayoff(baseDebt, 1000);
      expect(r2.months).toBeLessThan(r1.months);
      expect(r2.totalInterest).toBeLessThan(r1.totalInterest);
    });

    it("schedule lengths match months count", () => {
      const r = simulatePayoff(baseDebt, 500);
      expect(r.schedule).toHaveLength(r.months);
    });
  });

  describe("payoffMonths", () => {
    it("returns null when payment can't cover interest", () => {
      const months = payoffMonths(
        { id: "d", balance: 10000, apr: 60, minimum_payment: 100 },
        100
      );
      expect(months).toBeNull();
    });
    it("returns positive number for valid payment", () => {
      const months = payoffMonths(
        { id: "d", balance: 5000, apr: 12, minimum_payment: 500 },
        500
      );
      expect(months).not.toBeNull();
      expect(months).toBeGreaterThan(0);
    });
  });

  describe("advanceBalance", () => {
    it("returns same balance when payment matches interest", () => {
      const r = advanceBalance(
        { id: "d", balance: 1000, apr: 12, minimum_payment: 0 },
        10, // 1000 × 0.01 = 10 (interés mensual)
        12
      );
      // Balance no debe haber cambiado significativamente.
      expect(r.balance).toBeCloseTo(1000, 0);
    });

    it("zero balance after enough months of overpayment", () => {
      const r = advanceBalance(
        { id: "d", balance: 1000, apr: 0, minimum_payment: 100 },
        100,
        12
      );
      expect(r.balance).toBe(0);
    });
  });

  describe("orderDebtsByStrategy", () => {
    const debts: DebtInput[] = [
      { id: "a", balance: 5000, apr: 12, minimum_payment: 100 },
      { id: "b", balance: 1000, apr: 36, minimum_payment: 50 },
      { id: "c", balance: 2000, apr: 24, minimum_payment: 80 },
    ];

    it("avalanche orders by APR desc", () => {
      const ordered = orderDebtsByStrategy(debts, "avalanche");
      expect(ordered.map((d) => d.id)).toEqual(["b", "c", "a"]);
    });

    it("snowball orders by balance asc", () => {
      const ordered = orderDebtsByStrategy(debts, "snowball");
      expect(ordered.map((d) => d.id)).toEqual(["b", "c", "a"]);
    });

    it("custom keeps original order", () => {
      const ordered = orderDebtsByStrategy(debts, "custom");
      expect(ordered.map((d) => d.id)).toEqual(["a", "b", "c"]);
    });
  });

  describe("simulateStrategy", () => {
    const debts: DebtInput[] = [
      { id: "a", balance: 5000, apr: 12, minimum_payment: 200 },
      { id: "b", balance: 2000, apr: 36, minimum_payment: 100 },
    ];

    it("liquidates all debts in finite months with reasonable extra", () => {
      const r = simulateStrategy(debts, 200, "avalanche");
      expect(r.months).toBeGreaterThan(0);
      expect(r.months).toBeLessThan(120);
      // Cada deuda tiene su propio mes de payoff
      for (const id of ["a", "b"]) {
        const m = r.payoffByDebt.get(id);
        expect(m).toBeDefined();
        expect(m!).toBeLessThanOrEqual(r.months);
      }
    });

    it("avalanche pays off the highest-APR debt first", () => {
      const r = simulateStrategy(debts, 300, "avalanche");
      // b tiene APR 36 → debería liquidar antes que a (APR 12)
      const monthA = r.payoffByDebt.get("a")!;
      const monthB = r.payoffByDebt.get("b")!;
      expect(monthB).toBeLessThanOrEqual(monthA);
    });

    it("snowball pays off the smallest-balance debt first", () => {
      const r = simulateStrategy(debts, 300, "snowball");
      // b balance 2000 < a balance 5000 → debería liquidar antes
      const monthA = r.payoffByDebt.get("a")!;
      const monthB = r.payoffByDebt.get("b")!;
      expect(monthB).toBeLessThanOrEqual(monthA);
    });
  });

  describe("compareStrategies", () => {
    // Caso clásico donde avalanche y snowball divergen:
    // - Deuda chica con APR bajo (snowball atacaría primero)
    // - Deuda grande con APR alto (avalanche atacaría primero)
    const debts: DebtInput[] = [
      { id: "small-cheap", balance: 1000, apr: 6, minimum_payment: 50 },
      { id: "big-expensive", balance: 8000, apr: 36, minimum_payment: 250 },
    ];

    it("avalanche pays less interest than snowball when APR matters", () => {
      const cmp = compareStrategies(debts, 300);
      expect(cmp.avalanche.totalInterest).toBeLessThanOrEqual(
        cmp.snowball.totalInterest
      );
      expect(cmp.recommendation.cheaperStrategy).toBe("avalanche");
    });

    it("recommendation reports interestSavings >= 0", () => {
      const cmp = compareStrategies(debts, 300);
      expect(cmp.recommendation.interestSavings).toBeGreaterThanOrEqual(0);
    });
  });

  describe("compareExtraPayment", () => {
    const debt: DebtInput = {
      id: "d",
      balance: 10000,
      apr: 24,
      minimum_payment: 300,
    };

    it("with extra ⇒ fewer months", () => {
      const cmp = compareExtraPayment(debt, 200);
      expect(cmp.withExtra.months).toBeLessThanOrEqual(cmp.withMinimum.months);
      expect(cmp.monthsSaved).toBeGreaterThanOrEqual(0);
    });

    it("with extra ⇒ less total interest", () => {
      const cmp = compareExtraPayment(debt, 200);
      expect(cmp.withExtra.totalInterest).toBeLessThanOrEqual(
        cmp.withMinimum.totalInterest
      );
      expect(cmp.interestSaved).toBeGreaterThanOrEqual(0);
    });

    it("zero extra ⇒ equivalent to minimum-only", () => {
      const cmp = compareExtraPayment(debt, 0);
      expect(cmp.withExtra.months).toBe(cmp.withMinimum.months);
      expect(cmp.monthsSaved).toBe(0);
    });
  });
});
