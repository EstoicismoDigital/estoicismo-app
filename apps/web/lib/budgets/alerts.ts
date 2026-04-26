/**
 * Cómputo del estado de un presupuesto: gasto del mes vs límite,
 * porcentaje, color/etiqueta.
 *
 * Se calcula 100% del lado cliente sumando finance_transactions
 * del mes en curso para la categoría correspondiente. NO escribimos
 * el "spent" en DB para evitar inconsistencias.
 */

import type { Budget } from "@estoicismo/supabase";
import type { FinanceTransaction } from "@estoicismo/supabase";

export type BudgetStatus = {
  budget: Budget;
  spent: number;
  remaining: number;
  /** 0 a 100+ (puede ser >100 si excedió). */
  percent: number;
  /** Estado discreto para colores y prioridad. */
  state: "calm" | "watch" | "caution" | "alert" | "exceeded";
  /** Etiqueta humana (es). */
  label: string;
  /** True si cruzó el alert_threshold del usuario (default 80%). */
  triggered: boolean;
  /** Color hex sugerido para barra de progreso. */
  color: string;
};

const STATE_THRESHOLDS = [
  { min: 0, max: 50, state: "calm" as const, label: "Tranquilo", color: "#22774E" },
  { min: 50, max: 75, state: "watch" as const, label: "Atento", color: "#65A30D" },
  { min: 75, max: 90, state: "caution" as const, label: "Cuidado", color: "#CA8A04" },
  { min: 90, max: 100, state: "alert" as const, label: "Cerca del límite", color: "#EA580C" },
  { min: 100, max: Infinity, state: "exceeded" as const, label: "Excedido", color: "#DC2626" },
];

function classify(percent: number) {
  for (const t of STATE_THRESHOLDS) {
    if (percent >= t.min && percent < t.max) {
      return t;
    }
  }
  return STATE_THRESHOLDS[STATE_THRESHOLDS.length - 1];
}

/**
 * Suma transacciones de tipo expense del mes vigente para una
 * categoría dada.
 */
export function spentForCategoryThisMonth(
  transactions: FinanceTransaction[],
  categoryId: string,
  ref: Date = new Date()
): number {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  let total = 0;
  for (const tx of transactions) {
    if (tx.kind !== "expense") continue;
    if (tx.category_id !== categoryId) continue;
    const d = new Date(tx.occurred_on + "T00:00:00");
    if (d >= start && d < end) total += Number(tx.amount);
  }
  return Math.round(total * 100) / 100;
}

/** Calcula el status individual de un presupuesto. */
export function computeBudgetStatus(
  budget: Budget,
  transactions: FinanceTransaction[],
  ref: Date = new Date()
): BudgetStatus {
  const spent = spentForCategoryThisMonth(transactions, budget.category_id, ref);
  const percent = budget.amount > 0 ? (spent / Number(budget.amount)) * 100 : 0;
  const t = classify(percent);
  const triggered = percent >= budget.alert_threshold;
  return {
    budget,
    spent,
    remaining: Math.max(0, Number(budget.amount) - spent),
    percent: Math.round(percent * 10) / 10,
    state: t.state,
    label: t.label,
    triggered,
    color: t.color,
  };
}

/**
 * Devuelve status de TODOS los presupuestos. Útil para banners.
 */
export function computeAllBudgetStatuses(
  budgets: Budget[],
  transactions: FinanceTransaction[],
  ref: Date = new Date()
): BudgetStatus[] {
  return budgets.map((b) => computeBudgetStatus(b, transactions, ref));
}

/**
 * Resumen agregado para banners — # de presupuestos y cuántos están
 * en estado de alerta.
 */
export function summarizeBudgets(statuses: BudgetStatus[]): {
  total: number;
  triggered: number;
  exceeded: number;
  totalLimit: number;
  totalSpent: number;
} {
  let total = 0;
  let triggered = 0;
  let exceeded = 0;
  let totalLimit = 0;
  let totalSpent = 0;
  for (const s of statuses) {
    total++;
    totalLimit += Number(s.budget.amount);
    totalSpent += s.spent;
    if (s.triggered) triggered++;
    if (s.state === "exceeded") exceeded++;
  }
  return {
    total,
    triggered,
    exceeded,
    totalLimit: Math.round(totalLimit * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
  };
}

/**
 * Proyección al fin de mes basada en el ritmo actual:
 * spent_actual / día_actual * dias_totales_del_mes
 *
 * Útil para mostrar "a este ritmo terminarás el mes en $X" — verde
 * si proyección ≤ amount, rojo si excede.
 */
export function projectMonthEnd(
  spent: number,
  ref: Date = new Date()
): { projected: number; daysElapsed: number; daysInMonth: number } {
  const day = ref.getDate();
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const projected = day > 0 ? (spent / day) * daysInMonth : spent;
  return {
    projected: Math.round(projected * 100) / 100,
    daysElapsed: day,
    daysInMonth,
  };
}
