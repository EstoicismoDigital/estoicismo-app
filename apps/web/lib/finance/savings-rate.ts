import type { FinanceTransaction } from "@estoicismo/supabase";

/**
 * Tasa de ahorro (savings rate) — el predictor más simple y honesto
 * de tu salud financiera.
 *
 *   savings_rate = (income - expenses) / income
 *
 * Interpretación:
 *   < 0%   → estás endeudándote este mes
 *   0-10%  → vas justo, vulnerabilidad alta
 *   10-20% → estándar saludable
 *   20-50% → camino a libertad financiera
 *   > 50%  → FIRE / aceleración
 *
 * El cálculo solo considera transacciones del rango especificado.
 */
export type SavingsRateSnapshot = {
  income: number;
  expenses: number;
  net: number;
  ratio: number; // 0..1 (puede ser negativo si net < 0)
  rating: "danger" | "warning" | "ok" | "good" | "great";
  /** Cantidad de meses para llegar a 6 meses de gastos como fondo de emergencia. */
  monthsToEmergencyFund: number | null;
};

export function computeSavingsRate(
  transactions: FinanceTransaction[]
): SavingsRateSnapshot {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    const amt = Number(t.amount);
    if (t.kind === "income") income += amt;
    else if (t.kind === "expense") expenses += amt;
  }
  const net = income - expenses;
  const ratio = income > 0 ? net / income : 0;
  const rating = getRating(ratio);

  // Fondo de emergencia ≈ 6 meses de gastos. Si ahorras `net` cada
  // periodo y los gastos son `expenses`, te lleva 6*expenses/net periodos.
  const monthsToEmergencyFund =
    net > 0 && expenses > 0 ? Math.ceil((6 * expenses) / net) : null;

  return {
    income,
    expenses,
    net,
    ratio,
    rating,
    monthsToEmergencyFund,
  };
}

function getRating(ratio: number): SavingsRateSnapshot["rating"] {
  if (ratio < 0) return "danger";
  if (ratio < 0.1) return "warning";
  if (ratio < 0.2) return "ok";
  if (ratio < 0.5) return "good";
  return "great";
}

export function ratingLabel(rating: SavingsRateSnapshot["rating"]): string {
  switch (rating) {
    case "danger":
      return "Saliendo en negativo";
    case "warning":
      return "Vulnerable";
    case "ok":
      return "Estándar saludable";
    case "good":
      return "Camino a libertad";
    case "great":
      return "FIRE · aceleración";
  }
}

/**
 * Filtra transacciones al mes actual del usuario (mes calendario,
 * timezone local).
 */
export function thisMonthRange(today: Date = new Date()): {
  from: string;
  to: string;
} {
  const y = today.getFullYear();
  const m = today.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(start), to: fmt(end) };
}
