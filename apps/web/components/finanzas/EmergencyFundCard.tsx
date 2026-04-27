"use client";
import { useMemo } from "react";
import { Shield, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { useAccounts, useTransactions } from "../../hooks/useFinance";
import { useDefaultCurrency } from "../../hooks/useDefaultCurrency";
import { formatMoney } from "../../lib/finance";

/**
 * Emergency Fund Tracker.
 *
 * Calcula:
 *   - Saldo "líquido" = sum(accounts.current_balance) where kind in
 *     [cash, checking, savings] y include_in_net_worth=true.
 *   - Promedio mensual de gastos en últimos 90 días.
 *   - Meses de cobertura = liquid / avgMonthlyExpense.
 *   - Status:
 *       <1 mes  → danger (muy expuesto)
 *       1-3 mes → warning (vulnerable)
 *       3-6 mes → ok (saludable estándar)
 *       6+ mes  → great (libertad)
 *
 * Si no hay cuentas o gastos suficientes, se oculta.
 */
export function EmergencyFundCard() {
  // 90 días para promediar gasto mensual
  const range = useMemo(() => {
    const today = new Date();
    const ninety = new Date(today);
    ninety.setDate(ninety.getDate() - 90);
    return {
      from: ninety.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
    };
  }, []);

  const { data: accounts = [], isLoading: la } = useAccounts({});
  const { data: txs = [], isLoading: lt } = useTransactions(range);
  const defaultCurrency = useDefaultCurrency();

  const stats = useMemo(() => {
    try {
      // Liquid = cuentas líquidas que cuentan en patrimonio
      const liquidKinds: string[] = ["cash", "checking", "savings"];
      const liquid = accounts
        .filter(
          (a) =>
            !a.is_archived &&
            a.include_in_net_worth &&
            liquidKinds.includes(a.kind)
        )
        .reduce((acc, a) => acc + Number(a.current_balance), 0);

      // Promedio mensual de gastos (últ 90 días)
      const totalExpense = txs
        .filter((t) => t.kind === "expense")
        .reduce((acc, t) => acc + Number(t.amount), 0);
      const avgMonthly = totalExpense / 3; // 90d ≈ 3 meses

      const monthsCovered =
        avgMonthly > 0 ? +(liquid / avgMonthly).toFixed(1) : null;

      const currency =
        accounts.find((a) => a.include_in_net_worth)?.currency ??
        txs[0]?.currency ??
        defaultCurrency;

      return { liquid, avgMonthly, monthsCovered, currency };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("EmergencyFund stats failed:", err);
      return {
        liquid: 0,
        avgMonthly: 0,
        monthsCovered: null,
        currency: defaultCurrency,
      };
    }
  }, [accounts, txs, defaultCurrency]);

  if (la || lt) {
    return (
      <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6 flex items-center justify-center min-h-[120px]">
        <Loader2 size={18} className="animate-spin text-muted" />
      </div>
    );
  }

  if (stats.liquid === 0 || stats.avgMonthly === 0) return null;

  const m = stats.monthsCovered ?? 0;
  const rating: "danger" | "warning" | "ok" | "great" =
    m < 1 ? "danger" : m < 3 ? "warning" : m < 6 ? "ok" : "great";

  // Barra: meta = 6 meses
  const TARGET_MONTHS = 6;
  const pct = Math.min(100, (m / TARGET_MONTHS) * 100);

  return (
    <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Fondo de emergencia
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <p
          className={clsx(
            "font-display italic text-3xl tabular-nums leading-none",
            rating === "danger" && "text-danger",
            rating === "warning" && "text-ink",
            (rating === "ok" || rating === "great") && "text-success"
          )}
        >
          {m} {m === 1 ? "mes" : "meses"}
        </p>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          de {TARGET_MONTHS} objetivo
        </span>
      </div>

      <div className="mt-3 h-2 bg-bg rounded-full overflow-hidden relative">
        {/* Threshold lines: 1, 3, 6 meses */}
        <div className="absolute inset-0 flex">
          <div
            className="border-r border-line/30"
            style={{ width: `${(1 / TARGET_MONTHS) * 100}%` }}
          />
          <div
            className="border-r border-line/30"
            style={{ width: `${(2 / TARGET_MONTHS) * 100}%` }}
          />
          <div className="flex-1" />
        </div>
        <div
          className={clsx(
            "h-full transition-all",
            rating === "danger" && "bg-danger",
            rating === "warning" && "bg-danger/60",
            rating === "ok" && "bg-accent",
            rating === "great" && "bg-success"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 font-mono text-[8px] uppercase tracking-widest text-muted/60">
        <span>0</span>
        <span>1m</span>
        <span>3m</span>
        <span>6m+</span>
      </div>

      <p className="mt-3 font-body text-sm text-muted leading-relaxed border-l-2 border-accent/30 pl-3">
        {advice(rating, m, stats.avgMonthly, stats.currency)}
      </p>

      {/* Detalles */}
      <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
            Líquido hoy
          </p>
          <p className="font-display italic text-base text-ink">
            {formatMoney(stats.liquid, stats.currency)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
            Gasto/mes (prom)
          </p>
          <p className="font-display italic text-base text-ink">
            {formatMoney(stats.avgMonthly, stats.currency)}
          </p>
        </div>
      </div>

      {rating !== "great" && (
        <Link
          href="/finanzas/ahorro"
          className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-accent hover:underline"
        >
          Crear meta de ahorro <ArrowRight size={11} />
        </Link>
      )}
    </div>
  );
}

function advice(
  rating: "danger" | "warning" | "ok" | "great",
  months: number,
  avgMonthly: number,
  currency: string
): string {
  const fmt = (n: number) => formatMoney(n, currency);
  switch (rating) {
    case "danger":
      return `Tienes menos de un mes de cobertura. Una emergencia te empuja a deuda. Apunta a 1 mes (${fmt(avgMonthly)}) este trimestre.`;
    case "warning":
      return `${months} meses está bien para empezar. Un aire más — apunta a 3 meses (${fmt(avgMonthly * 3)}) — y duermes mejor.`;
    case "ok":
      return `Vas saludable. Si subes a 6 meses (${fmt(avgMonthly * 6)}), puedes tomar riesgos más calculados sin temor.`;
    case "great":
      return "Sólido. Tu yo del año que viene tiene libertad — usa el excedente para invertir.";
  }
}
