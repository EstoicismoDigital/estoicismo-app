"use client";
import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Clock, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import {
  useTransactions,
  useRecurring,
  useSubscriptions,
} from "../../hooks/useFinance";
import { useBudgets } from "../../hooks/useBudgets";
import {
  computeAllBudgetStatuses,
} from "../../lib/budgets/alerts";
import { findUpcomingDue } from "../../lib/finance/upcoming";
import { formatMoney } from "../../lib/finance";

/**
 * AlertsBar · cosas que requieren tu atención hoy.
 *
 * Recoge señales de varios módulos y las muestra como cards compactas
 * priorizadas. Si no hay nada importante, no renderiza (mantiene la
 * vista limpia).
 *
 * Señales actuales:
 *  1. Presupuestos en estado caution+ (>=75% del límite o excedidos).
 *  2. Recurring/Subscription que vencen hoy o en los próximos 3 días.
 *
 * Diseño tono editorial — no agresivo, no ansiogénico. La idea es
 * "te aviso para que decidas", no "URGENTE!!!".
 */

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function thisMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: iso(from), to: iso(to) };
}

export function AlertsBar() {
  const range = useMemo(thisMonthRange, []);
  const { data: budgets = [] } = useBudgets({ only_active: true });
  const { data: txs = [] } = useTransactions(range);
  const { data: recurring = [] } = useRecurring({ only_active: true });
  const { data: subscriptions = [] } = useSubscriptions({
    status: ["active", "trial"],
  });

  // 1. Presupuestos en alerta (>=75%)
  const budgetAlerts = useMemo(() => {
    const statuses = computeAllBudgetStatuses(budgets, txs);
    return statuses.filter(
      (s) => s.state === "caution" || s.state === "alert" || s.state === "exceeded"
    );
  }, [budgets, txs]);

  // 2. Próximos vencimientos (3 días)
  const upcoming = useMemo(
    () =>
      findUpcomingDue({
        recurring,
        subscriptions,
        daysAhead: 3,
      }),
    [recurring, subscriptions]
  );

  const hasAny = budgetAlerts.length > 0 || upcoming.length > 0;
  if (!hasAny) return null;

  return (
    <section
      data-print-hide
      className="rounded-card border border-line bg-bg-alt/30 p-4 sm:p-5 print:hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <Bell size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Atención
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>

      <ul className="divide-y divide-line/40">
        {/* Budget alerts — los más rojos primero */}
        {budgetAlerts
          .sort((a, b) => b.percent - a.percent)
          .slice(0, 3)
          .map((s) => (
            <li key={s.budget.id}>
              <Link
                href="/finanzas/presupuestos"
                className="flex items-center gap-3 py-2.5 hover:bg-bg-alt/40 -mx-2 px-2 rounded-md transition-colors group"
              >
                <div
                  className={clsx(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    s.state === "exceeded"
                      ? "bg-danger/15 text-danger"
                      : s.state === "alert"
                        ? "bg-warning/15 text-warning"
                        : "bg-accent/15 text-accent"
                  )}
                >
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink truncate">
                    Presupuesto al{" "}
                    <span className="tabular-nums font-medium">
                      {Math.round(s.percent)}%
                    </span>
                  </p>
                  <p className="font-body text-xs text-muted truncate">
                    {formatMoney(s.spent, s.budget.currency)} de{" "}
                    {formatMoney(Number(s.budget.amount), s.budget.currency)}
                    {s.state === "exceeded" && " · excedido"}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                />
              </Link>
            </li>
          ))}

        {/* Upcoming due */}
        {upcoming.slice(0, 4).map((u) => {
          const today = todayStr();
          const isToday = u.dueDate === today;
          const verb =
            u.daysAway === 0
              ? "hoy"
              : u.daysAway === 1
                ? "mañana"
                : `en ${u.daysAway} días`;
          return (
            <li key={u.id}>
              <Link
                href={
                  u.source === "subscription"
                    ? "/finanzas/recurrentes"
                    : "/finanzas/recurrentes"
                }
                className="flex items-center gap-3 py-2.5 hover:bg-bg-alt/40 -mx-2 px-2 rounded-md transition-colors group"
              >
                <div
                  className={clsx(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isToday
                      ? "bg-warning/15 text-warning"
                      : "bg-muted/15 text-muted"
                  )}
                >
                  <Clock size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink truncate">
                    {u.name}{" "}
                    <span className="text-muted font-mono text-[11px]">
                      · {verb}
                    </span>
                  </p>
                  <p className="font-body text-xs text-muted">
                    {u.kind === "income" ? "Ingreso" : "Cargo"}{" "}
                    {formatMoney(u.amount, u.currency)}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
