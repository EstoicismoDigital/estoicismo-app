/**
 * Cash flow projection · 60 días.
 *
 * Toma recurring + subscriptions activos, calcula todas las
 * ocurrencias en los próximos 60 días, y proyecta el balance
 * acumulado día por día.
 *
 * Sin AI, sin pronóstico estadístico — solo expansión determinística
 * de los recurrentes que el user ya configuró.
 */

import type {
  FinanceRecurring,
  FinanceSubscription,
} from "@estoicismo/supabase";

export type CashFlowDay = {
  /** YYYY-MM-DD */
  date: string;
  /** Día del mes (1-31). */
  dom: number;
  /** Total de ingresos planeados ese día. */
  income: number;
  /** Total de gastos (expenses + subs) ese día. */
  expense: number;
  /** Neto del día. */
  net: number;
  /** Balance acumulado desde el día 0. */
  cumulative: number;
};

export type CashFlowProjection = {
  /** Días proyectados (uno por día del rango). */
  days: CashFlowDay[];
  /** Suma de todos los ingresos en el rango. */
  totalIncome: number;
  /** Suma de todos los gastos. */
  totalExpense: number;
  /** Neto acumulado al final del rango. */
  netAtEnd: number;
  /** Día con balance acumulado más bajo (puede ser negativo → riesgo). */
  worstDay: CashFlowDay | null;
  currency: string;
};

/**
 * Construye la proyección. `startBalance` es opcional — si pasas el
 * neto de tus accounts hoy, las cifras absolutas son interpretables.
 */
export function buildCashFlowProjection({
  recurring,
  subscriptions,
  daysAhead = 60,
  startBalance = 0,
  startDate = new Date(),
  currency = "MXN",
}: {
  recurring: FinanceRecurring[];
  subscriptions: FinanceSubscription[];
  daysAhead?: number;
  startBalance?: number;
  startDate?: Date;
  currency?: string;
}): CashFlowProjection {
  const days: CashFlowDay[] = [];
  let cumulative = startBalance;
  let totalIncome = 0;
  let totalExpense = 0;

  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dom = d.getDate();

    let income = 0;
    let expense = 0;

    // Recurring activos
    for (const r of recurring) {
      if (!r.is_active) continue;
      if (r.end_date && new Date(r.end_date + "T00:00:00") < d) continue;
      if (occursOnDate(r, d)) {
        if (r.kind === "income") income += Number(r.amount);
        else expense += Number(r.amount);
      }
    }

    // Suscripciones activas
    for (const s of subscriptions) {
      if (s.status === "cancelled") continue;
      if (subOccursOnDate(s, d)) {
        expense += Number(s.amount);
      }
    }

    const net = income - expense;
    cumulative += net;
    totalIncome += income;
    totalExpense += expense;

    days.push({ date: iso, dom, income, expense, net, cumulative });
  }

  const worstDay = days.reduce<CashFlowDay | null>((acc, d) => {
    if (!acc || d.cumulative < acc.cumulative) return d;
    return acc;
  }, null);

  return {
    days,
    totalIncome,
    totalExpense,
    netAtEnd: cumulative - startBalance,
    worstDay,
    currency,
  };
}

/**
 * Verdadero si la recurring debe ocurrir en la fecha dada.
 * Replica la lógica de nextRecurringOccurrence pero como predicate.
 */
function occursOnDate(r: FinanceRecurring, date: Date): boolean {
  const start = new Date(r.start_date + "T00:00:00");
  if (date < start) return false;

  const dom = date.getDate();
  const dayOfPeriod = r.day_of_period;

  switch (r.cadence) {
    case "monthly":
      return dom === dayOfPeriod || isLastDayOfMonthCase(date, dayOfPeriod);
    case "yearly":
      return (
        dom === dayOfPeriod &&
        date.getMonth() === start.getMonth()
      );
    case "weekly": {
      // dayOfPeriod = 0..6 (Sun..Sat) en el schema
      return date.getDay() === dayOfPeriod;
    }
    case "biweekly": {
      // 14-day cycle desde start
      if (date.getDay() !== dayOfPeriod) return false;
      const diff = Math.floor(
        (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diff >= 0 && diff % 14 === 0;
    }
    default:
      return false;
  }
}

function isLastDayOfMonthCase(date: Date, dayOfPeriod: number): boolean {
  // Si dayOfPeriod = 31 y el mes solo tiene 30 días, fall back al
  // último día del mes.
  if (dayOfPeriod < 29) return false;
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return last < dayOfPeriod && date.getDate() === last;
}

function subOccursOnDate(s: FinanceSubscription, date: Date): boolean {
  if (s.status === "cancelled") return false;
  if (s.status === "trial" && s.trial_ends_on) {
    return s.trial_ends_on === date.toISOString().slice(0, 10);
  }
  const dom = date.getDate();
  const day = s.renewal_day;

  switch (s.cadence) {
    case "monthly":
      return dom === day || isLastDayOfMonthCase(date, day);
    case "yearly":
      // Asume renewal en el mes 0 (enero) — el schema actual no
      // guarda mes, así que esto es aproximado.
      return dom === day && date.getMonth() === 0;
    case "quarterly":
      return dom === day && date.getMonth() % 3 === 0;
    default:
      return false;
  }
}
