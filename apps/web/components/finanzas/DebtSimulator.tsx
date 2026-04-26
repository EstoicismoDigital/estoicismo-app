"use client";
import { useMemo, useState } from "react";
import { Sliders, TrendingDown } from "lucide-react";
import type { FinanceDebt } from "@estoicismo/supabase";
import {
  compareExtraPayment,
  compareStrategies,
  type Strategy,
} from "../../lib/debt/amortization";
import { formatMoney } from "../../lib/finance";

/**
 * Simulador interactivo: slider de "extra mensual" → muestra
 * comparativa avalanche vs snowball y, si seleccionas una deuda
 * sola, comparativa solo-mínimo vs con-extra.
 */
export function DebtSimulator(props: {
  debts: FinanceDebt[];
  strategy: Strategy;
  /** Currency esperada — se asume la del primer debt. */
  currency: string;
}) {
  const { debts, strategy, currency } = props;

  const totalMinimum = useMemo(
    () => debts.reduce((s, d) => s + Number(d.minimum_payment), 0),
    [debts]
  );

  // Slider: 0 a un máximo razonable (3× total mínimo)
  const sliderMax = useMemo(() => {
    const ceil = Math.max(2000, Math.ceil((totalMinimum * 3) / 100) * 100);
    return ceil;
  }, [totalMinimum]);

  const [extra, setExtra] = useState(Math.round(totalMinimum * 0.5));

  const inputDebts = useMemo(
    () =>
      debts
        .filter((d) => !d.is_paid && d.balance > 0)
        .map((d) => ({
          id: d.id,
          name: d.name,
          balance: d.balance,
          apr: d.apr,
          minimum_payment: d.minimum_payment,
          currency: d.currency,
        })),
    [debts]
  );

  const compare = useMemo(() => {
    if (inputDebts.length === 0) return null;
    return compareStrategies(inputDebts, extra);
  }, [inputDebts, extra]);

  const activeSim = strategy === "snowball" ? compare?.snowball : compare?.avalanche;

  if (inputDebts.length === 0) return null;

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sliders size={14} className="text-accent" />
        <h2 className="font-display italic text-lg text-ink">Simulador</h2>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
            Extra mensual
          </span>
          <span className="text-base font-display italic text-ink">
            {formatMoney(extra, currency)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={sliderMax}
          step="50"
          value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span>$0</span>
          <span>{formatMoney(sliderMax, currency)}</span>
        </div>
      </div>

      {activeSim && (
        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Sales en"
            value={`${activeSim.months}m`}
            subtitle={`(${Math.round(activeSim.months / 12)}a)`}
          />
          <Metric
            label="Total interés"
            value={formatMoney(activeSim.totalInterest, currency)}
          />
        </div>
      )}

      {compare && (
        <div className="rounded-lg bg-bg/40 border border-line/60 p-3 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
            Comparativa estrategias (con tu extra)
          </p>
          <ComparisonRow
            label="Avalancha"
            description="APR más alto primero"
            months={compare.avalanche.months}
            interest={compare.avalanche.totalInterest}
            currency={currency}
            highlight={strategy === "avalanche"}
          />
          <ComparisonRow
            label="Bola de nieve"
            description="Saldo más chico primero"
            months={compare.snowball.months}
            interest={compare.snowball.totalInterest}
            currency={currency}
            highlight={strategy === "snowball"}
          />
          <div className="text-[11px] text-muted pt-1.5 border-t border-line/30">
            <TrendingDown size={11} className="inline mr-1" />
            <strong className="text-ink">{compare.recommendation.cheaperStrategy === "avalanche" ? "Avalancha" : "Bola de nieve"}</strong>
            {" "}ahorra{" "}
            <span className="text-success font-mono">
              {formatMoney(compare.recommendation.interestSavings, currency)}
            </span>{" "}
            en intereses
            {compare.recommendation.monthsDifference > 0 && (
              <>
                {" "}y sale{" "}
                <span className="text-success font-mono">
                  {compare.recommendation.monthsDifference} meses
                </span>{" "}
                antes
              </>
            )}
            .
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg bg-bg/40 border border-line/60 p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{label}</p>
      <p className="text-2xl font-display italic text-ink">
        {value}
        {subtitle && <span className="text-xs text-muted ml-1">{subtitle}</span>}
      </p>
    </div>
  );
}

function ComparisonRow({
  label,
  description,
  months,
  interest,
  currency,
  highlight,
}: {
  label: string;
  description: string;
  months: number;
  interest: number;
  currency: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-baseline gap-2 ${
        highlight ? "text-ink" : "text-muted"
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm ${highlight ? "font-semibold" : ""}`}>{label}</p>
        <p className="text-[10px] text-muted">{description}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-sm">{months}m</p>
        <p className="text-[10px] text-muted">{formatMoney(interest, currency)}</p>
      </div>
    </div>
  );
}

/**
 * Simulador para una deuda individual: compara solo-mínimo vs con-extra.
 */
export function SingleDebtSimulator(props: { debt: FinanceDebt }) {
  const { debt } = props;
  const [extra, setExtra] = useState(0);

  const sliderMax = Math.max(500, Math.ceil((Number(debt.minimum_payment) * 3) / 100) * 100);

  const cmp = useMemo(() => {
    return compareExtraPayment(
      {
        id: debt.id,
        balance: debt.balance,
        apr: debt.apr,
        minimum_payment: debt.minimum_payment,
      },
      extra
    );
  }, [debt, extra]);

  return (
    <div className="rounded-lg bg-bg/40 border border-line/60 p-3 space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
        Si abonas extra cada mes
      </p>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[11px] text-muted">Extra mensual</span>
          <span className="text-sm font-display italic text-ink">
            {formatMoney(extra, debt.currency)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={sliderMax}
          step="25"
          value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-mono text-muted">Solo mínimo</p>
          <p className="text-sm font-mono text-ink">
            {cmp.withMinimum.willGrow ? "∞" : `${cmp.withMinimum.months}m`}
          </p>
          <p className="text-[10px] text-muted">{formatMoney(cmp.withMinimum.totalInterest, debt.currency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-muted">Con extra</p>
          <p className="text-sm font-mono text-ink">
            {cmp.withExtra.willGrow ? "∞" : `${cmp.withExtra.months}m`}
          </p>
          <p className="text-[10px] text-muted">{formatMoney(cmp.withExtra.totalInterest, debt.currency)}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-success">Te ahorras</p>
          <p className="text-sm font-mono text-success">
            {cmp.monthsSaved}m
          </p>
          <p className="text-[10px] text-success">{formatMoney(cmp.interestSaved, debt.currency)}</p>
        </div>
      </div>
    </div>
  );
}
