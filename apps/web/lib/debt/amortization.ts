/**
 * Calculadora de amortización de deudas + estrategias de payoff.
 *
 * Convenciones:
 *   - APR es porcentaje anual (e.g. 36 = 36% anual). Lo convertimos
 *     a tasa mensual como apr/100/12.
 *   - balance, payment, interest, principal son números en la misma
 *     moneda. La función no opina sobre la moneda — los amounts se
 *     procesan como floats normales.
 *   - "monthlyPayment" es el pago total mensual (incluye interés).
 *   - Si monthlyPayment ≤ interés mensual → la deuda nunca se paga.
 *     Devolvemos null en ese caso para que la UI lo muestre como
 *     "advertencia: no estás cubriendo el interés".
 *   - Cap a 600 meses (50 años) — más allá es absurdo y previene
 *     loops infinitos.
 */

const MAX_MONTHS = 600;

export type DebtInput = {
  /** ID — sirve para identificar la deuda en la output. */
  id: string;
  name?: string;
  balance: number;
  /** APR en porcentaje (36 = 36%). */
  apr: number;
  /** Pago mínimo mensual obligatorio. */
  minimum_payment: number;
  currency?: string;
};

export type AmortizationRow = {
  /** Mes 1-indexed (1 = mes siguiente al inicio). */
  month: number;
  startBalance: number;
  interest: number;
  principal: number;
  payment: number;
  endBalance: number;
};

export type PayoffResult = {
  months: number;
  totalInterest: number;
  totalPaid: number;
  schedule: AmortizationRow[];
  /** True si el pago no cubre el interés y la deuda crece. */
  willGrow: boolean;
};

/**
 * Calcula el interés mensual sobre el balance vigente.
 */
export function monthlyInterest(balance: number, apr: number): number {
  if (balance <= 0 || apr <= 0) return 0;
  return (balance * apr) / 100 / 12;
}

/**
 * Simula la amortización mes a mes hasta liquidar (o hasta MAX_MONTHS).
 *
 * @param debt   deuda con balance + APR
 * @param payment  pago mensual fijo (≥ minimum_payment)
 * @param maxMonths cap (default 600)
 */
export function simulatePayoff(
  debt: DebtInput,
  payment: number,
  maxMonths = MAX_MONTHS
): PayoffResult {
  const schedule: AmortizationRow[] = [];
  let balance = debt.balance;
  let totalInterest = 0;
  let totalPaid = 0;
  let willGrow = false;

  // Verificar si el pago cubre el interés del primer mes.
  const firstMonthInterest = monthlyInterest(balance, debt.apr);
  if (payment <= firstMonthInterest && balance > 0) {
    willGrow = true;
  }

  for (let m = 1; m <= maxMonths; m++) {
    if (balance <= 0) break;
    const interest = monthlyInterest(balance, debt.apr);
    const startBalance = balance;
    let actualPayment = payment;
    // En el último mes pagamos exactamente lo que falte para llegar a 0.
    if (balance + interest < payment) {
      actualPayment = balance + interest;
    }
    const principal = Math.max(0, actualPayment - interest);
    const endBalance = Math.max(0, balance - principal);
    schedule.push({
      month: m,
      startBalance: round2(startBalance),
      interest: round2(interest),
      principal: round2(principal),
      payment: round2(actualPayment),
      endBalance: round2(endBalance),
    });
    totalInterest += interest;
    totalPaid += actualPayment;
    balance = endBalance;
    // Si después de un mes el balance no bajó, marca willGrow.
    if (m === 1 && endBalance >= startBalance) willGrow = true;
  }

  return {
    months: schedule.length,
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
    schedule,
    willGrow,
  };
}

/**
 * Devuelve sólo el número de meses para liquidar (sin schedule).
 * Útil cuando no necesitamos la tabla.
 */
export function payoffMonths(debt: DebtInput, payment: number): number | null {
  const r = simulatePayoff(debt, payment, MAX_MONTHS);
  if (r.willGrow) return null;
  if (r.months >= MAX_MONTHS && r.schedule[r.schedule.length - 1]?.endBalance > 0) {
    return null;
  }
  return r.months;
}

/**
 * Avanza el balance por N meses sin liquidar — útil para simular
 * cuánto interés acumulado tendrías si pagas sólo mínimos durante
 * X meses antes de empezar a abonar fuerte.
 */
export function advanceBalance(
  debt: DebtInput,
  payment: number,
  months: number
): { balance: number; totalInterest: number } {
  let balance = debt.balance;
  let totalInterest = 0;
  for (let i = 0; i < months && balance > 0; i++) {
    const interest = monthlyInterest(balance, debt.apr);
    totalInterest += interest;
    const principal = Math.max(0, payment - interest);
    balance = Math.max(0, balance - principal);
  }
  return { balance: round2(balance), totalInterest: round2(totalInterest) };
}

export type Strategy = "avalanche" | "snowball" | "custom";

/**
 * Reordena las deudas según la estrategia.
 *
 * - avalanche: APR descendente (matemáticamente óptimo).
 * - snowball: balance ascendente (psicológicamente óptimo — wins rápidas).
 * - custom: respeta el orden recibido.
 *
 * Sólo afecta el orden — los pagos mínimos se hacen en TODAS;
 * el "extra" siempre va a la primera de la lista ordenada.
 */
export function orderDebtsByStrategy<T extends DebtInput>(
  debts: T[],
  strategy: Strategy
): T[] {
  const arr = [...debts];
  if (strategy === "avalanche") {
    arr.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
  } else if (strategy === "snowball") {
    arr.sort((a, b) => a.balance - b.balance || b.apr - a.apr);
  }
  // custom: no reorder
  return arr;
}

export type StrategySimulation = {
  strategy: Strategy;
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** Calendario de cuándo se liquida cada deuda (mes en que llega a 0). */
  payoffByDebt: Map<string, number>;
  /** Si alguna deuda crece (willGrow) lo marcamos. */
  willGrow: boolean;
};

/**
 * Simula la estrategia completa: cada mes paga mínimos en todas las
 * deudas + dirige el "extra" a la primera deuda según orden de
 * estrategia. Cuando una deuda llega a 0, su mínimo se redistribuye
 * al pool de extra (el famoso "snowball effect").
 *
 * @param debts        lista de deudas activas
 * @param extraMonthly extra que el usuario puede aportar más allá
 *                     de la suma de mínimos
 * @param strategy     avalanche / snowball / custom
 */
export function simulateStrategy(
  debts: DebtInput[],
  extraMonthly: number,
  strategy: Strategy
): StrategySimulation {
  const ordered = orderDebtsByStrategy(debts, strategy).map((d) => ({ ...d }));
  const minimums: Record<string, number> = {};
  for (const d of ordered) minimums[d.id] = d.minimum_payment;

  const payoffByDebt = new Map<string, number>();
  let totalInterest = 0;
  let totalPaid = 0;
  let willGrow = false;

  for (let m = 1; m <= MAX_MONTHS; m++) {
    // Ya liquidado todo
    if (ordered.every((d) => d.balance <= 0)) break;

    let extraPool = extraMonthly;
    // Suma de mínimos de las deudas que ya están liquidadas → al pool.
    for (const d of ordered) {
      if (d.balance <= 0) extraPool += minimums[d.id];
    }

    // Cada deuda viva paga mínimo + interés.
    for (const d of ordered) {
      if (d.balance <= 0) continue;
      const interest = monthlyInterest(d.balance, d.apr);
      let pay = Math.min(d.minimum_payment, d.balance + interest);
      // Si el extraPool no se ha agotado y esta es la primera viva, va aquí.
      // Recorremos en el orden — el primero vivo recibe el extra.
      // Para simplificar, post-loop le damos extra al primero vivo.
      const principal = Math.max(0, pay - interest);
      d.balance = Math.max(0, d.balance - principal);
      totalInterest += interest;
      totalPaid += pay;
      if (m === 1 && d.balance >= d.balance + 0) {
        // willGrow chequea si alguna sube — separado abajo
      }
    }

    // Aplica el extra al primer deuda viva.
    if (extraPool > 0) {
      for (const d of ordered) {
        if (d.balance <= 0) continue;
        // Aquí sólo principal porque el interés ya se cubrió arriba.
        const applied = Math.min(extraPool, d.balance);
        d.balance = round2(d.balance - applied);
        totalPaid += applied;
        extraPool -= applied;
        break;
      }
    }

    // Marca cuáles llegaron a 0 este mes.
    for (const d of ordered) {
      if (d.balance <= 0 && !payoffByDebt.has(d.id)) {
        payoffByDebt.set(d.id, m);
      }
    }

    // Detecta crecimiento (mínimo no cubre interés y no hay extra).
    if (m === 1) {
      for (const d of ordered) {
        if (d.balance <= 0) continue;
        const interest = monthlyInterest(d.balance, d.apr);
        if (d.minimum_payment < interest) willGrow = true;
      }
    }
  }

  // Si terminamos sin liquidar todas, llenar payoffByDebt con MAX_MONTHS para señalizar.
  for (const d of ordered) {
    if (!payoffByDebt.has(d.id)) payoffByDebt.set(d.id, MAX_MONTHS);
  }

  const lastMonth = Math.max(...Array.from(payoffByDebt.values()));

  return {
    strategy,
    months: lastMonth,
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
    payoffByDebt,
    willGrow,
  };
}

/**
 * Compara avalanche vs snowball con el mismo extra mensual. Devuelve
 * recomendación clara (avalanche siempre ahorra dinero, snowball gana
 * en rapidez de eliminación de deudas pequeñas).
 */
export function compareStrategies(
  debts: DebtInput[],
  extraMonthly: number
): {
  avalanche: StrategySimulation;
  snowball: StrategySimulation;
  /** En qué meses sale antes y cuánto ahorra avalanche. */
  recommendation: {
    fasterStrategy: Strategy;
    monthsDifference: number;
    cheaperStrategy: Strategy;
    interestSavings: number;
  };
} {
  const avalanche = simulateStrategy(debts, extraMonthly, "avalanche");
  const snowball = simulateStrategy(debts, extraMonthly, "snowball");
  return {
    avalanche,
    snowball,
    recommendation: {
      fasterStrategy:
        avalanche.months < snowball.months
          ? "avalanche"
          : snowball.months < avalanche.months
          ? "snowball"
          : "avalanche",
      monthsDifference: Math.abs(avalanche.months - snowball.months),
      cheaperStrategy:
        avalanche.totalInterest < snowball.totalInterest ? "avalanche" : "snowball",
      interestSavings: round2(
        Math.abs(avalanche.totalInterest - snowball.totalInterest)
      ),
    },
  };
}

/**
 * Compara dos pagos mensuales para una misma deuda — sirve para el
 * simulador "¿qué pasa si abono $X extra?".
 */
export function compareExtraPayment(
  debt: DebtInput,
  extra: number
): {
  withMinimum: PayoffResult;
  withExtra: PayoffResult;
  monthsSaved: number;
  interestSaved: number;
} {
  const withMinimum = simulatePayoff(debt, debt.minimum_payment);
  const withExtra = simulatePayoff(debt, debt.minimum_payment + extra);
  return {
    withMinimum,
    withExtra,
    monthsSaved: Math.max(0, withMinimum.months - withExtra.months),
    interestSaved: round2(Math.max(0, withMinimum.totalInterest - withExtra.totalInterest)),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
