"use client";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { useRecurring, useSubscriptions, useAccounts } from "../../hooks/useFinance";
import { buildCashFlowProjection } from "../../lib/finance/cash-flow";
import { formatMoney } from "../../lib/finance";

/**
 * Cash flow projection 60 días.
 *
 * Toma recurring + subscriptions activos y calcula la proyección
 * de balance acumulado a 60 días. Visualiza con un sparkline simple
 * + cifras clave.
 *
 * Si el user no tiene recurrentes/subs, no renderiza (no hay base
 * para proyectar).
 */
export function CashFlowProjectionCard() {
  const { data: recurring = [] } = useRecurring({ only_active: true });
  const { data: subscriptions = [] } = useSubscriptions({
    status: ["active", "trial"],
  });
  const { data: accounts = [] } = useAccounts({});

  const projection = useMemo(() => {
    if (recurring.length === 0 && subscriptions.length === 0) return null;
    // Saldo inicial = suma de cuentas que cuentan en el patrimonio
    const startBalance = accounts
      .filter((a) => a.include_in_net_worth && !a.is_archived)
      .reduce((acc, a) => acc + Number(a.current_balance), 0);
    const currency =
      accounts.find((a) => a.include_in_net_worth)?.currency ??
      recurring[0]?.currency ??
      subscriptions[0]?.currency ??
      "MXN";
    return buildCashFlowProjection({
      recurring,
      subscriptions,
      daysAhead: 60,
      startBalance,
      currency,
    });
  }, [recurring, subscriptions, accounts]);

  if (!projection) return null;

  const { totalIncome, totalExpense, netAtEnd, worstDay, currency, days } =
    projection;

  // Sparkline data — extraer cumulative de cada 2 días para 30 puntos
  const sparkPoints = days
    .filter((_, i) => i % 2 === 0)
    .map((d) => d.cumulative);
  const sparkMin = Math.min(...sparkPoints);
  const sparkMax = Math.max(...sparkPoints);
  const sparkRange = sparkMax - sparkMin || 1;

  return (
    <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Proyección · 60 días
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>

      <p className="font-body text-sm text-muted mb-4 leading-relaxed">
        Basado en tus recurrentes y suscripciones activos. No predice
        movimientos espontáneos — solo lo que ya tienes calendarizado.
      </p>

      {/* Sparkline */}
      <div className="relative h-20 mb-4">
        <svg
          viewBox={`0 0 ${sparkPoints.length} 100`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Línea cero (si visible) */}
          {sparkMin < 0 && sparkMax > 0 && (
            <line
              x1={0}
              y1={100 - ((0 - sparkMin) / sparkRange) * 100}
              x2={sparkPoints.length}
              y2={100 - ((0 - sparkMin) / sparkRange) * 100}
              className="stroke-line"
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
          )}
          <polyline
            points={sparkPoints
              .map(
                (v, i) =>
                  `${i},${100 - ((v - sparkMin) / sparkRange) * 100}`
              )
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className={clsx(
              netAtEnd >= 0 ? "text-success" : "text-danger"
            )}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat
          icon={<TrendingUp size={11} className="text-success" />}
          label="Ingresos"
          value={formatMoney(totalIncome, currency)}
        />
        <Stat
          icon={<TrendingDown size={11} className="text-danger" />}
          label="Gastos"
          value={formatMoney(totalExpense, currency)}
        />
        <Stat
          label="Neto"
          value={`${netAtEnd >= 0 ? "+" : ""}${formatMoney(netAtEnd, currency)}`}
          valueClass={netAtEnd >= 0 ? "text-success" : "text-danger"}
        />
      </div>

      {/* Worst day warning */}
      {worstDay && worstDay.cumulative < 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-danger shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-danger mb-0.5">
              Posible saldo negativo
            </p>
            <p className="font-body text-xs text-ink leading-relaxed">
              El{" "}
              <span className="font-semibold">
                {formatRelativeDate(worstDay.date)}
              </span>{" "}
              tu balance proyectado llega a{" "}
              <span className="font-display italic">
                {formatMoney(worstDay.cumulative, currency)}
              </span>
              . Considera mover ingreso anticipado o postponer un gasto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  valueClass,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted inline-flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </p>
      <p
        className={clsx(
          "font-display italic text-lg text-ink tabular-nums",
          valueClass
        )}
      >
        {value}
      </p>
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const dt = new Date(iso + "T00:00:00");
  return dt.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}
