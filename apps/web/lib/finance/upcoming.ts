/**
 * Próximos eventos financieros — recurring + subscriptions vencen
 * en los siguientes N días.
 *
 * Útil para banners "tu factura vence en 3 días" sin tener que
 * proyectar todo el cash flow.
 */

import type {
  FinanceRecurring,
  FinanceSubscription,
} from "@estoicismo/supabase";

export type UpcomingDue = {
  id: string;
  source: "recurring" | "subscription";
  name: string;
  amount: number;
  currency: string;
  kind: "income" | "expense";
  /** YYYY-MM-DD */
  dueDate: string;
  /** Días desde hoy (0 = hoy). */
  daysAway: number;
};

function isLastDayOfMonthCase(date: Date, dayOfPeriod: number): boolean {
  if (dayOfPeriod < 29) return false;
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return last < dayOfPeriod && date.getDate() === last;
}

function recurringOccursOnDate(r: FinanceRecurring, date: Date): boolean {
  const start = new Date(r.start_date + "T00:00:00");
  if (date < start) return false;
  if (r.end_date && new Date(r.end_date + "T00:00:00") < date) return false;
  const dom = date.getDate();
  const dop = r.day_of_period;
  switch (r.cadence) {
    case "monthly":
      return dom === dop || isLastDayOfMonthCase(date, dop);
    case "yearly":
      return dom === dop && date.getMonth() === start.getMonth();
    case "weekly":
      return date.getDay() === dop;
    case "biweekly": {
      if (date.getDay() !== dop) return false;
      const diff = Math.floor(
        (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diff >= 0 && diff % 14 === 0;
    }
    default:
      return false;
  }
}

function subscriptionOccursOnDate(
  s: FinanceSubscription,
  date: Date
): boolean {
  if (s.status === "cancelled" || s.status === "paused") return false;
  if (s.status === "trial" && s.trial_ends_on) {
    return s.trial_ends_on === date.toISOString().slice(0, 10);
  }
  const dom = date.getDate();
  switch (s.cadence) {
    case "monthly":
      return dom === s.renewal_day || isLastDayOfMonthCase(date, s.renewal_day);
    case "yearly":
      return dom === s.renewal_day && date.getMonth() === 0;
    case "quarterly":
      return dom === s.renewal_day && date.getMonth() % 3 === 0;
    default:
      return false;
  }
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Devuelve recurring + subscription que vencen en los próximos
 * `daysAhead` días, ordenados por fecha (más próximos primero).
 */
export function findUpcomingDue(opts: {
  recurring: FinanceRecurring[];
  subscriptions: FinanceSubscription[];
  daysAhead?: number;
  ref?: Date;
}): UpcomingDue[] {
  const daysAhead = opts.daysAhead ?? 7;
  const ref = opts.ref ?? new Date();
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());

  const out: UpcomingDue[] = [];
  for (let offset = 0; offset <= daysAhead; offset++) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);

    for (const r of opts.recurring) {
      if (!r.is_active) continue;
      if (recurringOccursOnDate(r, day)) {
        out.push({
          id: `r-${r.id}-${isoDate(day)}`,
          source: "recurring",
          name: r.name,
          amount: Number(r.amount),
          currency: r.currency,
          kind: r.kind === "income" ? "income" : "expense",
          dueDate: isoDate(day),
          daysAway: offset,
        });
      }
    }
    for (const s of opts.subscriptions) {
      if (subscriptionOccursOnDate(s, day)) {
        out.push({
          id: `s-${s.id}-${isoDate(day)}`,
          source: "subscription",
          name: s.name,
          amount: Number(s.amount),
          currency: s.currency,
          kind: "expense",
          dueDate: isoDate(day),
          daysAway: offset,
        });
      }
    }
  }
  return out.sort((a, b) => a.daysAway - b.daysAway);
}
