/**
 * Lógica de cálculo de próximas ocurrencias de un recurring
 * (transacción recurrente o suscripción).
 *
 * NO genera filas en DB automáticamente — eso requiere un cron, y
 * preferimos que el usuario decida manualmente "materializar" cada
 * ocurrencia con un click. La función calcula CUÁNDO, el usuario
 * decide SI cuenta como una transacción real.
 */

import type {
  FinanceRecurring,
  FinanceSubscription,
  RecurringCadence,
  SubscriptionCadence,
} from "@estoicismo/supabase";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Próxima ocurrencia (>= ref) de un recurring template.
 * Devuelve YYYY-MM-DD o null si end_date ya pasó.
 */
export function nextRecurringOccurrence(
  rec: Pick<
    FinanceRecurring,
    "cadence" | "day_of_period" | "start_date" | "end_date" | "is_active"
  >,
  ref: Date = new Date()
): string | null {
  if (!rec.is_active) return null;
  const start = new Date(rec.start_date + "T00:00:00");
  const end = rec.end_date ? new Date(rec.end_date + "T00:00:00") : null;
  if (end && end < ref) return null;

  let candidate: Date;
  switch (rec.cadence) {
    case "monthly":
      candidate = nextMonthlyOccurrence(rec.day_of_period, ref, start);
      break;
    case "yearly":
      candidate = nextYearlyOccurrence(rec.day_of_period, ref, start);
      break;
    case "weekly":
      candidate = nextWeeklyOccurrence(rec.day_of_period, ref, start, 7);
      break;
    case "biweekly":
      candidate = nextWeeklyOccurrence(rec.day_of_period, ref, start, 14);
      break;
    default:
      return null;
  }
  if (end && candidate > end) return null;
  return candidate.toISOString().slice(0, 10);
}

function nextMonthlyOccurrence(day: number, ref: Date, start: Date): Date {
  // Primer día candidato: este mes en `day`. Si ya pasó (o si start es
  // futuro), avanza meses hasta que `candidate >= ref` y `candidate >= start`.
  let candidate = new Date(ref.getFullYear(), ref.getMonth(), day);
  while (candidate < ref || candidate < start) {
    candidate = new Date(candidate.getFullYear(), candidate.getMonth() + 1, day);
  }
  return candidate;
}

function nextYearlyOccurrence(dayOfYear: number, ref: Date, start: Date): Date {
  // day_of_period = 1-365. Mapeamos a fecha del año actual.
  let year = ref.getFullYear();
  let candidate = dayOfYearToDate(year, dayOfYear);
  while (candidate < ref || candidate < start) {
    year++;
    candidate = dayOfYearToDate(year, dayOfYear);
  }
  return candidate;
}

function nextWeeklyOccurrence(dayOfWeek: number, ref: Date, start: Date, intervalDays: number): Date {
  // dayOfWeek: 0=Sun, 6=Sat
  const refDay = ref.getDay();
  const diff = (dayOfWeek - refDay + 7) % 7;
  let candidate = new Date(ref);
  candidate.setDate(candidate.getDate() + diff);
  candidate.setHours(0, 0, 0, 0);
  // Si es biweekly y el "first day from start" está fuera de fase,
  // ajustamos sumando 7 días si la diferencia con start no es múltiplo de 14.
  if (intervalDays === 14) {
    const daysSinceStart = Math.round((candidate.getTime() - start.getTime()) / MS_PER_DAY);
    if (Math.abs(daysSinceStart % 14) !== 0) {
      candidate.setDate(candidate.getDate() + 7);
    }
  }
  while (candidate < start) {
    candidate.setDate(candidate.getDate() + intervalDays);
  }
  return candidate;
}

function dayOfYearToDate(year: number, day: number): Date {
  const d = new Date(year, 0, 1);
  d.setDate(day);
  return d;
}

/**
 * Próxima renovación de una suscripción. Cadence es monthly/quarterly/yearly.
 */
export function nextSubscriptionRenewal(
  sub: Pick<FinanceSubscription, "cadence" | "renewal_day" | "status" | "trial_ends_on">,
  ref: Date = new Date()
): string | null {
  if (sub.status === "cancelled") return null;
  if (sub.status === "trial" && sub.trial_ends_on) {
    return sub.trial_ends_on;
  }

  const day = sub.renewal_day;
  let candidate: Date;
  switch (sub.cadence) {
    case "monthly":
      candidate = nextMonthlyOccurrence(day, ref, new Date(0));
      break;
    case "yearly":
      candidate = new Date(ref.getFullYear(), 0, day);
      while (candidate < ref) {
        candidate = new Date(candidate.getFullYear() + 1, 0, day);
      }
      break;
    case "quarterly": {
      // Cada 3 meses desde el día actual del año, en el `day` del mes.
      const month = ref.getMonth();
      const quarterMonth = month - (month % 3);
      candidate = new Date(ref.getFullYear(), quarterMonth, day);
      while (candidate < ref) {
        candidate = new Date(candidate.getFullYear(), candidate.getMonth() + 3, day);
      }
      break;
    }
    default:
      return null;
  }
  return candidate.toISOString().slice(0, 10);
}

/**
 * Días hasta una fecha (puede ser negativo si ya pasó).
 */
export function daysUntil(dateStr: string, ref: Date = new Date()): number {
  const target = new Date(dateStr + "T00:00:00");
  const diff = target.getTime() - ref.getTime();
  return Math.ceil(diff / MS_PER_DAY);
}

/**
 * Suma mensual estimada de TODAS las suscripciones activas — útil
 * para mostrar "estás pagando $X al mes en suscripciones".
 */
export function monthlySubscriptionsTotal(
  subs: FinanceSubscription[]
): { total: number; byCurrency: Record<string, number> } {
  const byCurrency: Record<string, number> = {};
  let total = 0;
  for (const s of subs) {
    if (s.status !== "active" && s.status !== "trial") continue;
    let monthly = Number(s.amount);
    if (s.cadence === "yearly") monthly = monthly / 12;
    if (s.cadence === "quarterly") monthly = monthly / 3;
    byCurrency[s.currency] = (byCurrency[s.currency] ?? 0) + monthly;
    total += monthly;
  }
  return {
    total: Math.round(total * 100) / 100,
    byCurrency: Object.fromEntries(
      Object.entries(byCurrency).map(([k, v]) => [k, Math.round(v * 100) / 100])
    ),
  };
}

/**
 * Etiqueta humana para una cadencia.
 */
export function cadenceLabel(c: RecurringCadence | SubscriptionCadence): string {
  switch (c) {
    case "weekly":
      return "Semanal";
    case "biweekly":
      return "Quincenal";
    case "monthly":
      return "Mensual";
    case "quarterly":
      return "Trimestral";
    case "yearly":
      return "Anual";
    default:
      return c;
  }
}
