"use client";
import { useMemo } from "react";
import { Mountain, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import {
  useTransactions,
  useAccounts,
} from "../../hooks/useFinance";
import { useDebts } from "../../hooks/useDebts";
import { computeFire, fireStatusLabel } from "../../lib/finance/fire";
import { formatMoney } from "../../lib/finance";

/**
 * FIRE Calculator Card.
 *
 * Aplica la regla del 4% (gasto_anual × 25 = libertad).
 *
 * Calcula el patrimonio neto desde accounts + savings - debts, y
 * estima años a FIRE con retorno real 4% anual + caso conservador
 * sin retorno.
 *
 * Si no hay gasto registrado en últ 90 días, se oculta (no podemos
 * calcular gasto anual).
 */
export function FireCalculatorCard() {
  // 90 días para promediar income + expense
  const range = useMemo(() => {
    const today = new Date();
    const ninety = new Date(today);
    ninety.setDate(ninety.getDate() - 90);
    return {
      from: ninety.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
    };
  }, []);

  const { data: txs = [], isLoading: lt } = useTransactions(range);
  const { data: accounts = [] } = useAccounts({});
  const { data: debts = [] } = useDebts({ include_paid: false });

  const snapshot = useMemo(() => {
    try {
      const totalExpense90d = txs
        .filter((t) => t.kind === "expense")
        .reduce((acc, t) => acc + Number(t.amount), 0);
      const totalIncome90d = txs
        .filter((t) => t.kind === "income")
        .reduce((acc, t) => acc + Number(t.amount), 0);

      // Net worth simplificado = accounts(en NW) - debts(activos).
      // No incluye contribuciones a savings goals (esas viven en otra
      // tabla y se contarían doble si la cuenta de ahorro ya está
      // sumando).
      const accountsTotal = accounts
        .filter((a) => !a.is_archived && a.include_in_net_worth)
        .reduce((acc, a) => acc + Number(a.current_balance), 0);
      const debtsTotal = debts.reduce(
        (acc, d) => acc + Number(d.balance ?? 0),
        0
      );
      const currentNetWorth = accountsTotal - debtsTotal;

      const currency =
        accounts.find((a) => a.include_in_net_worth)?.currency ??
        txs[0]?.currency ??
        "MXN";

      return computeFire({
        totalExpense90d,
        totalIncome90d,
        currentNetWorth,
        currency,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("FIRE calc failed:", err);
      return null;
    }
  }, [txs, accounts, debts]);

  if (lt) {
    return (
      <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6 flex items-center justify-center min-h-[120px]">
        <Loader2 size={18} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!snapshot || snapshot.status === "no-data") return null;

  const {
    annualExpense,
    fireTarget,
    currentNetWorth,
    monthlySavings,
    progress,
    yearsToFire,
    yearsToFireConservative,
    status,
    currency,
  } = snapshot;
  const pct = Math.round(progress * 100);

  return (
    <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Mountain size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          FIRE · libertad financiera
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>

      <p className="font-body text-sm text-muted mb-4 leading-relaxed">
        Regla del 4%: cuando tu patrimonio = 25× tu gasto anual, los
        retornos cubren tu vida sin que toques el principal.
      </p>

      {/* Big stat */}
      <div className="flex items-baseline gap-2 flex-wrap mb-2">
        <p
          className={clsx(
            "font-display italic text-3xl tabular-nums leading-none",
            status === "achieved"
              ? "text-success"
              : status === "close"
                ? "text-success"
                : status === "on-track"
                  ? "text-ink"
                  : "text-muted"
          )}
        >
          {pct}%
        </p>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {fireStatusLabel(status)}
        </span>
        {yearsToFire !== null && status !== "achieved" && (
          <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted">
            ~{yearsToFire}{" "}
            {yearsToFire === 1 ? "año" : "años"}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-bg rounded-full overflow-hidden mb-4">
        <div
          className={clsx(
            "h-full transition-all",
            status === "achieved" || status === "close"
              ? "bg-success"
              : "bg-accent"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
            Tu meta FIRE
          </p>
          <p className="font-display italic text-lg text-ink tabular-nums">
            {formatMoney(fireTarget, currency)}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted/70 mt-0.5">
            ({formatMoney(annualExpense, currency)}/año × 25)
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
            Hoy tienes
          </p>
          <p className="font-display italic text-lg text-ink tabular-nums">
            {formatMoney(currentNetWorth, currency)}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted/70 mt-0.5">
            faltan{" "}
            {formatMoney(
              Math.max(0, fireTarget - currentNetWorth),
              currency
            )}
          </p>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 border-l-2 border-accent/30 pl-3">
        <p className="font-body text-sm text-muted leading-relaxed">
          {advice(snapshot)}
        </p>
        {yearsToFireConservative !== null &&
          yearsToFire !== null &&
          status !== "achieved" && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted/60 mt-2">
              Sin retorno: ~{yearsToFireConservative.toFixed(1)} años ·
              Con 4% real: ~{yearsToFire} años
            </p>
          )}
      </div>
    </div>
  );
}

function advice(s: ReturnType<typeof computeFire>): string {
  if (s.status === "achieved") {
    return `🏔 Llegaste. Tu patrimonio cubre 25× tu gasto. La libertad ya es tuya.`;
  }
  if (s.monthlySavings <= 0) {
    return "Para avanzar a FIRE necesitas ahorrar mes a mes. Sube tu tasa de ahorro o reduce gasto recurrente.";
  }
  if (s.status === "close") {
    return "Cada peso que ahorras ahora pesa más por compounding. Estás cerca — no afloja el pie.";
  }
  if (s.status === "on-track") {
    return "Vas en ritmo razonable. Subir tu tasa de ahorro 5% recorta años al final.";
  }
  return "El camino es largo desde aquí. La fórmula es simple: gasta menos, gana más, invierte la diferencia.";
}
