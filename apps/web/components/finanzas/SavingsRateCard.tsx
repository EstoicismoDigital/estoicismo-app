"use client";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertCircle, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { useTransactions } from "../../hooks/useFinance";
import {
  computeSavingsRate,
  ratingLabel,
  thisMonthRange,
} from "../../lib/finance/savings-rate";
import { formatMoney } from "../../lib/finance";

/**
 * Savings rate del mes en curso. Single most valuable finance KPI:
 *   savings_rate = (income - expenses) / income
 *
 * Tono: editorial honesto. Sin emojis de aplauso falso. La rating
 * "great" no es "amazing!" — es "FIRE / aceleración" en mono.
 */
export function SavingsRateCard() {
  const range = useMemo(() => thisMonthRange(), []);
  const { data: transactions = [] } = useTransactions({
    from: range.from,
    to: range.to,
  });

  const snap = useMemo(
    () => computeSavingsRate(transactions),
    [transactions]
  );

  // Currency: tomar la primera de las tx (asume single currency mes
  // a mes — para multi-currency, el NetWorthCard ya muestra warning).
  const currency = transactions.find((t) => t.currency)?.currency ?? "MXN";

  const pct = Math.round(snap.ratio * 100);

  return (
    <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Tasa de ahorro · este mes
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex items-baseline gap-3 flex-wrap">
        <p
          className={clsx(
            "font-display italic text-4xl leading-none tabular-nums",
            snap.rating === "danger" && "text-danger",
            snap.rating === "warning" && "text-ink",
            (snap.rating === "ok" ||
              snap.rating === "good" ||
              snap.rating === "great") &&
              "text-success"
          )}
        >
          {pct >= 0 ? `${pct}%` : `${pct}%`}
        </p>
        <span
          className={clsx(
            "font-mono text-[10px] uppercase tracking-widest",
            snap.rating === "danger" && "text-danger",
            snap.rating === "warning" && "text-muted",
            snap.rating === "ok" && "text-muted",
            snap.rating === "good" && "text-success",
            snap.rating === "great" && "text-success"
          )}
        >
          {ratingLabel(snap.rating)}
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted">
          {snap.net >= 0 ? (
            <TrendingUp size={11} className="inline mr-1" />
          ) : (
            <TrendingDown size={11} className="inline mr-1" />
          )}
          {formatMoney(snap.net, currency)} neto
        </span>
      </div>

      {/* Bar visualization · 0-50% range, anything above shows full */}
      <div className="mt-4 h-2 bg-bg rounded-full overflow-hidden relative">
        {/* Banded thresholds: 10, 20, 50 */}
        <div className="absolute inset-0 flex">
          <div className="w-[20%] border-r border-line/30" />
          <div className="w-[20%] border-r border-line/30" />
          <div className="w-[60%]" />
        </div>
        <div
          className={clsx(
            "h-full transition-all",
            snap.rating === "danger" && "bg-danger",
            snap.rating === "warning" && "bg-danger/60",
            snap.rating === "ok" && "bg-accent",
            snap.rating === "good" && "bg-success",
            snap.rating === "great" && "bg-success"
          )}
          style={{
            width: `${Math.min(100, Math.max(0, pct))}%`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1 font-mono text-[8px] uppercase tracking-widest text-muted/60">
        <span>0%</span>
        <span>10%</span>
        <span>20%</span>
        <span>50%+</span>
      </div>

      {/* Insight / advice based on rating */}
      <div className="mt-4 border-l-2 border-accent/30 pl-3 sm:pl-4">
        <p className="font-body text-sm text-muted leading-relaxed">
          {getAdvice(snap, currency)}
        </p>
      </div>

      {/* Income/expense breakdown */}
      <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-line">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
            Ingresos
          </p>
          <p className="font-display italic text-lg text-ink">
            {formatMoney(snap.income, currency)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
            Gastos
          </p>
          <p className="font-display italic text-lg text-ink">
            {formatMoney(snap.expenses, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}

function getAdvice(
  snap: ReturnType<typeof computeSavingsRate>,
  currency: string
): string {
  if (snap.income === 0)
    return "Sin ingresos registrados este mes — registra al menos uno para calcular tu tasa.";
  switch (snap.rating) {
    case "danger":
      return "Estás gastando más de lo que entra. Esto no se sostiene — revisa qué gasto se puede recortar esta semana.";
    case "warning":
      return "Ahorras menos del 10%. Una sola emergencia te empuja a deuda. Apunta a 10% mínimo.";
    case "ok":
      return "Vas en estándar. Si subes a 20%, en 5 años tu yo futuro te lo agradecerá.";
    case "good":
      if (snap.monthsToEmergencyFund !== null) {
        return `Vas bien. A este ritmo, en ~${snap.monthsToEmergencyFund} meses tienes 6 meses de gastos en reserva.`;
      }
      return "Vas bien. Considera empezar a invertir el excedente.";
    case "great":
      return `Excelente. ${formatMoney(snap.net, currency)} ahorrados este mes — cada peso aquí es un ladrillo de tu libertad.`;
  }
}
