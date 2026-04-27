"use client";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import { computeNetWorth } from "../../lib/finance/net-worth";
import { formatMoney } from "../../lib/finance";
import { useAccounts, useCreditCards } from "../../hooks/useFinance";
import { useDebts } from "../../hooks/useDebts";
import { useSavingsGoals, useSavingsContributions } from "../../hooks/useSavings";

/**
 * Net Worth Card — card único en el dashboard de finanzas que muestra:
 *   - patrimonio neto total (verde si positivo, rojo si negativo)
 *   - desglose: activos vs pasivos
 *   - top 3 contribuyentes de cada lado
 *   - warning si hay mezcla de monedas
 */
export function NetWorthCard() {
  const { data: accounts = [] } = useAccounts();
  const { data: goals = [] } = useSavingsGoals();
  const { data: contributions = [] } = useSavingsContributions({ limit: 1000 });
  const { data: debts = [] } = useDebts({ include_paid: false });
  const { data: cards = [] } = useCreditCards();

  const snap = useMemo(
    () => computeNetWorth({ accounts, goals, contributions, debts, cards }),
    [accounts, goals, contributions, debts, cards]
  );

  const positive = snap.netWorth >= 0;
  const currency = [...snap.currencies][0] ?? "MXN";
  const mixedCurrencies = snap.currencies.size > 1;

  // Si no hay nada que mostrar, no renderizamos.
  if (snap.assetsTotal === 0 && snap.liabilitiesTotal === 0) {
    return null;
  }

  const topAssets = [
    ...snap.breakdown.accounts.map((a) => ({ ...a, type: "cuenta" })),
    ...snap.breakdown.savings.map((a) => ({ ...a, type: "ahorro" })),
  ]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 3);

  const topLiabs = [
    ...snap.breakdown.debts.map((d) => ({ ...d, type: "deuda" })),
    ...snap.breakdown.cards.map((c) => ({ ...c, type: "tarjeta" })),
  ]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 3);

  return (
    <section
      className={clsx(
        "rounded-card border p-5 sm:p-6 space-y-4",
        positive
          ? "border-success/30 bg-gradient-to-br from-success/5 to-transparent"
          : "border-danger/30 bg-gradient-to-br from-danger/5 to-transparent"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted inline-flex items-center gap-1.5">
          {positive ? (
            <TrendingUp size={12} className="text-success" />
          ) : (
            <TrendingDown size={12} className="text-danger" />
          )}
          Patrimonio neto
        </p>
        {mixedCurrencies && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-orange-400 inline-flex items-center gap-1">
            <AlertTriangle size={10} />
            Mezcla de monedas
          </span>
        )}
      </div>

      <div className="text-center py-2">
        <p
          className={clsx(
            "font-display italic text-4xl sm:text-5xl",
            positive ? "text-success" : "text-danger"
          )}
        >
          {formatMoney(snap.netWorth, currency)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line/60 bg-bg/40 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-success">
            Activos
          </p>
          <p className="font-display italic text-xl text-ink">
            {formatMoney(snap.assetsTotal, currency)}
          </p>
          <ul className="text-[10px] text-muted space-y-0.5 pt-1">
            {topAssets.map((a, i) => (
              <li key={`a-${i}`} className="flex justify-between">
                <span className="truncate">{a.name}</span>
                <span className="font-mono shrink-0 ml-1">
                  {formatMoney(a.balance, currency)}
                </span>
              </li>
            ))}
            {topAssets.length === 0 && <li className="italic">Sin cuentas activas.</li>}
          </ul>
        </div>
        <div className="rounded-lg border border-line/60 bg-bg/40 p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-danger">
            Pasivos
          </p>
          <p className="font-display italic text-xl text-ink">
            {formatMoney(snap.liabilitiesTotal, currency)}
          </p>
          <ul className="text-[10px] text-muted space-y-0.5 pt-1">
            {topLiabs.map((d, i) => (
              <li key={`l-${i}`} className="flex justify-between">
                <span className="truncate">{d.name}</span>
                <span className="font-mono shrink-0 ml-1">
                  {formatMoney(d.balance, currency)}
                </span>
              </li>
            ))}
            {topLiabs.length === 0 && (
              <li className="italic text-success">Sin deudas. ✓</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
