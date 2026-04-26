/**
 * Cómputos derivados de las metas de ahorro: progreso, ETA, ritmo
 * mensual requerido para llegar al deadline, etc.
 */

import type { SavingsGoal, SavingsContribution } from "@estoicismo/supabase";

export type GoalProgress = {
  goal: SavingsGoal;
  saved: number;
  target: number;
  remaining: number;
  /** 0..100 */
  percent: number;
  isCompleted: boolean;
  /** Cuántos días faltan para deadline, o null si no hay deadline. */
  daysToDeadline: number | null;
  /** Mensual que necesitas para llegar al deadline. null si no hay. */
  monthlyRequired: number | null;
  /** Promedio mensual aportado en los últimos 90 días. */
  monthlyAverage: number;
  /** Meses estimados al ritmo actual (null si ritmo = 0). */
  etaMonths: number | null;
  /** Fecha estimada de logro al ritmo actual. */
  etaDate: Date | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function progressForGoal(
  goal: SavingsGoal,
  contributions: SavingsContribution[],
  ref: Date = new Date()
): GoalProgress {
  const onlyThisGoal = contributions.filter((c) => c.goal_id === goal.id);
  const saved = onlyThisGoal.reduce((s, c) => s + Number(c.amount), 0);
  const target = Number(goal.target_amount);
  const remaining = Math.max(0, target - saved);
  const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

  // Días al deadline.
  let daysToDeadline: number | null = null;
  if (goal.deadline) {
    const dl = new Date(goal.deadline + "T00:00:00");
    daysToDeadline = Math.ceil((dl.getTime() - ref.getTime()) / MS_PER_DAY);
  }

  // Mensual requerido.
  let monthlyRequired: number | null = null;
  if (daysToDeadline !== null && daysToDeadline > 0) {
    const monthsRemaining = Math.max(1, daysToDeadline / 30);
    monthlyRequired = remaining / monthsRemaining;
  }

  // Promedio mensual de los últimos 90 días.
  const cutoff = new Date(ref.getTime() - 90 * MS_PER_DAY);
  const recent = onlyThisGoal.filter((c) => new Date(c.occurred_on + "T00:00:00") >= cutoff);
  const recentTotal = recent.reduce((s, c) => s + Number(c.amount), 0);
  // 90 días ≈ 3 meses
  const monthlyAverage = recentTotal / 3;

  // ETA
  let etaMonths: number | null = null;
  let etaDate: Date | null = null;
  if (remaining > 0 && monthlyAverage > 0) {
    etaMonths = Math.ceil(remaining / monthlyAverage);
    etaDate = new Date(ref.getTime() + etaMonths * 30 * MS_PER_DAY);
  } else if (remaining <= 0) {
    etaMonths = 0;
    etaDate = ref;
  }

  return {
    goal,
    saved: round2(saved),
    target: round2(target),
    remaining: round2(remaining),
    percent: round1(percent),
    isCompleted: saved >= target,
    daysToDeadline,
    monthlyRequired: monthlyRequired !== null ? round2(monthlyRequired) : null,
    monthlyAverage: round2(monthlyAverage),
    etaMonths,
    etaDate,
  };
}

export function progressForAllGoals(
  goals: SavingsGoal[],
  contributions: SavingsContribution[],
  ref: Date = new Date()
): GoalProgress[] {
  return goals.map((g) => progressForGoal(g, contributions, ref));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
