"use client";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useBudgets } from "../../hooks/useBudgets";
import { useTransactions, useFinanceCategories } from "../../hooks/useFinance";
import {
  computeAllBudgetStatuses,
  summarizeBudgets,
} from "../../lib/budgets/alerts";

/**
 * Banner mostrado en el dashboard de Finanzas si hay presupuestos
 * cerca del límite (≥ alert_threshold) o ya excedidos. Si todo está
 * sano o no hay presupuestos, no renderiza nada.
 */
export function BudgetsAlertBanner() {
  const { data: budgets = [] } = useBudgets({ only_active: true });
  const { data: categories = [] } = useFinanceCategories();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const { data: transactions = [] } = useTransactions({
    from: monthStart.toISOString().slice(0, 10),
    to: monthEnd.toISOString().slice(0, 10),
  });

  if (budgets.length === 0) return null;

  const statuses = computeAllBudgetStatuses(budgets, transactions);
  const summary = summarizeBudgets(statuses);

  if (summary.triggered === 0 && summary.exceeded === 0) {
    // Estado feliz — sin banner
    return null;
  }

  const offendingStatuses = statuses
    .filter((s) => s.triggered || s.state === "exceeded")
    .sort((a, b) => b.percent - a.percent);

  const topThree = offendingStatuses.slice(0, 3);
  const tone = summary.exceeded > 0 ? "exceeded" : "alert";

  return (
    <Link
      href="/finanzas/presupuestos"
      className={`block rounded-card border p-3 transition-colors ${
        tone === "exceeded"
          ? "border-danger/40 bg-danger/5 hover:bg-danger/10"
          : "border-orange-400/40 bg-orange-400/5 hover:bg-orange-400/10"
      }`}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={tone === "exceeded" ? "text-danger" : "text-orange-400"}
          size={16}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink font-semibold">
            {summary.exceeded > 0
              ? `${summary.exceeded} presupuesto${summary.exceeded > 1 ? "s" : ""} excedido${summary.exceeded > 1 ? "s" : ""}`
              : `${summary.triggered} cerca del límite`}
          </p>
          <ul className="text-[11px] text-muted mt-1 space-y-0.5">
            {topThree.map((s) => {
              const cat = categories.find((c) => c.id === s.budget.category_id);
              return (
                <li key={s.budget.id} className="flex justify-between">
                  <span>{cat?.name ?? "Categoría"}</span>
                  <span
                    className="font-mono"
                    style={{ color: s.color }}
                  >
                    {s.percent.toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <ChevronRight className="text-muted shrink-0 mt-0.5" size={14} />
      </div>
    </Link>
  );
}
