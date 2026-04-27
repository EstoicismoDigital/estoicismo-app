/**
 * FIRE Calculator (Financial Independence, Retire Early).
 *
 * Aplica la regla del 4% (Trinity Study):
 *   target_FIRE = gasto_anual × 25
 *
 * Estimación de años a FIRE asumiendo:
 *   - Gasto anual constante en términos reales.
 *   - Aporte mensual = (income - expense) actual.
 *   - Retorno real (después de inflación): 4% anual default.
 *
 * Sin retorno (caso simple si user no invierte):
 *   years = (target - currentNW) / (savings × 12)
 *
 * Con retorno (caso real):
 *   PV = currentNW (presente)
 *   PMT = savings monthly
 *   r = monthly real return = 0.04 / 12
 *   FV = target
 *
 *   FV = PV * (1 + r)^n + PMT * ((1 + r)^n - 1) / r
 *
 * Resolviendo para n:
 *   n = log((FV * r + PMT) / (PV * r + PMT)) / log(1 + r)
 *
 * (n = meses)
 */

export type FireSnapshot = {
  /** Gasto anual estimado (basado en últ. 90 días × 4). */
  annualExpense: number;
  /** Monto FIRE = gasto_anual × 25. */
  fireTarget: number;
  /** Patrimonio actual neto. */
  currentNetWorth: number;
  /** Ahorro mensual estimado (income - expense últ 3 meses prom). */
  monthlySavings: number;
  /** Progreso hacia FIRE: 0..1. */
  progress: number;
  /** Años estimados a FIRE asumiendo retorno real 4%. */
  yearsToFire: number | null;
  /** Años a FIRE sin retorno (peor caso). */
  yearsToFireConservative: number | null;
  /** Status: too-far / on-track / close / achieved. */
  status: "too-far" | "on-track" | "close" | "achieved" | "no-data";
  currency: string;
};

export function computeFire(input: {
  /** Total expenses últimos 90 días. */
  totalExpense90d: number;
  /** Total income últimos 90 días. */
  totalIncome90d: number;
  /** Patrimonio neto actual (assets - liabilities). */
  currentNetWorth: number;
  currency?: string;
  /** Retorno real anual asumido. Default 4%. */
  realReturn?: number;
}): FireSnapshot {
  const realReturn = input.realReturn ?? 0.04;
  const annualExpense = (input.totalExpense90d / 90) * 365;
  const fireTarget = annualExpense * 25;
  const monthlySavings = (input.totalIncome90d - input.totalExpense90d) / 3;
  const progress =
    fireTarget > 0
      ? Math.max(0, Math.min(1, input.currentNetWorth / fireTarget))
      : 0;

  const yearsToFire = computeYearsToFire(
    input.currentNetWorth,
    fireTarget,
    monthlySavings,
    realReturn
  );

  const yearsToFireConservative =
    monthlySavings > 0 && fireTarget > input.currentNetWorth
      ? (fireTarget - input.currentNetWorth) / (monthlySavings * 12)
      : input.currentNetWorth >= fireTarget
        ? 0
        : null;

  let status: FireSnapshot["status"] = "no-data";
  if (annualExpense === 0) status = "no-data";
  else if (input.currentNetWorth >= fireTarget) status = "achieved";
  else if (progress >= 0.5) status = "close";
  else if (yearsToFire !== null && yearsToFire <= 20) status = "on-track";
  else status = "too-far";

  return {
    annualExpense,
    fireTarget,
    currentNetWorth: input.currentNetWorth,
    monthlySavings,
    progress,
    yearsToFire,
    yearsToFireConservative,
    status,
    currency: input.currency ?? "MXN",
  };
}

function computeYearsToFire(
  pv: number,
  fv: number,
  monthlyPmt: number,
  annualReturn: number
): number | null {
  if (pv >= fv) return 0;
  if (monthlyPmt <= 0 && annualReturn <= 0) return null;

  const r = annualReturn / 12; // tasa mensual

  // Si no hay retorno, fórmula lineal
  if (r === 0) {
    if (monthlyPmt <= 0) return null;
    return (fv - pv) / monthlyPmt / 12; // en años
  }

  // Fórmula cerrada: n = log((FV*r + PMT) / (PV*r + PMT)) / log(1 + r)
  const num = fv * r + monthlyPmt;
  const den = pv * r + monthlyPmt;
  if (num <= 0 || den <= 0) return null;
  if (num <= den) return null; // ya estás más allá

  const months = Math.log(num / den) / Math.log(1 + r);
  if (!Number.isFinite(months) || months < 0) return null;
  return +(months / 12).toFixed(1);
}

export function fireStatusLabel(status: FireSnapshot["status"]): string {
  switch (status) {
    case "achieved":
      return "FIRE alcanzado";
    case "close":
      return "Cerca";
    case "on-track":
      return "En camino";
    case "too-far":
      return "Lejos · revisa el plan";
    case "no-data":
      return "Sin datos suficientes";
  }
}
