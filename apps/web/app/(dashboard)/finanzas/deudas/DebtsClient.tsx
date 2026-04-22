"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  Flame,
  Snowflake,
  Info,
} from "lucide-react";
import { clsx } from "clsx";
import type { FinanceDebt, CreateDebtInput } from "@estoicismo/supabase";
import {
  useDebts,
  useCreateDebt,
  useUpdateDebt,
  useDeleteDebt,
} from "../../../../hooks/useFinance";
import {
  buildDebtPlan,
  formatMoney,
  type DebtStrategy,
} from "../../../../lib/finance";
import { DebtModal } from "../../../../components/finanzas/DebtModal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { FinanceAdvice } from "../../../../components/finanzas/FinanceAdvice";

/**
 * Dashboard de deudas con calculadora de plan avalanche/snowball.
 *
 * - Campos: presupuesto mensual, estrategia (toggle).
 * - La tabla muestra por deuda: nombre, saldo, APR, meses hasta liquidar.
 * - Resumen: total pagado, intereses totales, mes en que salís.
 * - Si budget < mínimos, se advierte pero se simula igual para dar
 *   visibilidad del escenario.
 */
export function DebtsClient() {
  const { data: debts = [], isLoading } = useDebts();
  const createM = useCreateDebt();
  const updateM = useUpdateDebt();
  const deleteM = useDeleteDebt();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceDebt | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FinanceDebt | null>(null);

  const [strategy, setStrategy] = useState<DebtStrategy>("avalanche");
  const [budgetText, setBudgetText] = useState("");

  const activeDebts = useMemo(
    () => debts.filter((d) => !d.is_paid && Number(d.balance) > 0),
    [debts]
  );

  const minimumTotal = useMemo(
    () => activeDebts.reduce((s, d) => s + (Number(d.minimum_payment) || 0), 0),
    [activeDebts]
  );

  // Sugerir un presupuesto razonable: 1.3x mínimos (dejando algo de margen).
  useEffect(() => {
    if (budgetText === "" && minimumTotal > 0) {
      setBudgetText(String(Math.round(minimumTotal * 1.3)));
    }
  }, [minimumTotal, budgetText]);

  const budget = Number.parseFloat(budgetText) || 0;
  const plan = useMemo(
    () => buildDebtPlan(activeDebts, budget, strategy),
    [activeDebts, budget, strategy]
  );

  // Comparativa con el contrario para mostrar el costo de la estrategia.
  const counter = useMemo(
    () =>
      buildDebtPlan(
        activeDebts,
        budget,
        strategy === "avalanche" ? "snowball" : "avalanche"
      ),
    [activeDebts, budget, strategy]
  );

  async function handleSave(input: CreateDebtInput) {
    try {
      if (editing) {
        await updateM.mutateAsync({ id: editing.id, input });
      } else {
        await createM.mutateAsync(input);
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      /* toast in hook */
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteM.mutateAsync(confirmDelete.id);
    } finally {
      setConfirmDelete(null);
    }
  }

  async function togglePaid(d: FinanceDebt) {
    try {
      await updateM.mutateAsync({ id: d.id, input: { is_paid: !d.is_paid } });
    } catch {
      /* toast */
    }
  }

  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Finanzas · Deudas
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            Liberarte es matemática.
          </h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display italic text-xl text-ink">Mis deudas</h2>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-full bg-accent text-white font-body text-[12px] font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus size={14} aria-hidden />
            Añadir
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <ListSkeleton />
        ) : debts.length === 0 ? (
          <EmptyState onAdd={() => setModalOpen(true)} />
        ) : (
          <ul className="space-y-2" role="list">
            {debts.map((d) => (
              <DebtRow
                key={d.id}
                debt={d}
                onEdit={() => {
                  setEditing(d);
                  setModalOpen(true);
                }}
                onDelete={() => setConfirmDelete(d)}
                onTogglePaid={() => togglePaid(d)}
              />
            ))}
          </ul>
        )}

        {/* Strategy panel */}
        {activeDebts.length > 0 && (
          <section
            aria-label="Plan de pago"
            className="rounded-card border border-line bg-bg-alt/40 p-5 space-y-4"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Plan estratégico
              </p>
              <h3 className="font-display italic text-xl text-ink">
                ¿En cuánto sales?
              </h3>
            </div>

            {/* Budget */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Presupuesto mensual para deudas
              </label>
              <div className="mt-1 flex items-stretch gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display italic text-xl text-muted pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="100"
                    value={budgetText}
                    onChange={(e) => setBudgetText(e.target.value)}
                    className="w-full h-12 pl-8 pr-3 rounded-lg border border-line bg-bg font-body text-[16px] text-ink tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
                    placeholder="0"
                  />
                </div>
              </div>
              <p className="mt-1.5 font-body text-xs text-muted">
                Mínimo requerido:{" "}
                <span
                  className={clsx(
                    "font-medium tabular-nums",
                    budget >= minimumTotal ? "text-ink" : "text-danger"
                  )}
                >
                  {formatMoney(minimumTotal)}
                </span>
                {budget < minimumTotal && (
                  <> — tu presupuesto no cubre los mínimos.</>
                )}
              </p>
            </div>

            {/* Strategy toggle */}
            <div>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-bg-alt">
                <StrategyButton
                  active={strategy === "avalanche"}
                  onClick={() => setStrategy("avalanche")}
                  Icon={Flame}
                  label="Avalancha"
                  sub="Mayor APR primero"
                />
                <StrategyButton
                  active={strategy === "snowball"}
                  onClick={() => setStrategy("snowball")}
                  Icon={Snowflake}
                  label="Bola de nieve"
                  sub="Menor saldo primero"
                />
              </div>
              <p className="mt-2 font-body text-xs text-muted flex gap-1.5">
                <Info size={12} aria-hidden className="mt-0.5 shrink-0" />
                {strategy === "avalanche"
                  ? "Matemáticamente óptimo: pagás menos intereses totales."
                  : "Psicológicamente óptimo: ganás momentum liquidando las chicas primero."}
              </p>
            </div>

            {/* KPIs */}
            {plan.months.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <KpiSmall
                  label="Meses"
                  value={
                    plan.payoffMonths >= 600
                      ? "+600"
                      : String(plan.payoffMonths)
                  }
                />
                <KpiSmall
                  label="Intereses"
                  value={formatMoney(plan.totalInterest)}
                  tone="danger"
                />
                <KpiSmall
                  label="Total pagado"
                  value={formatMoney(plan.totalPaid)}
                />
              </div>
            )}

            {/* Strategy comparison */}
            {plan.months.length > 0 && counter.months.length > 0 && (
              <StrategyCompare
                current={{
                  strategy,
                  totalInterest: plan.totalInterest,
                  payoffMonths: plan.payoffMonths,
                }}
                counter={{
                  strategy: strategy === "avalanche" ? "snowball" : "avalanche",
                  totalInterest: counter.totalInterest,
                  payoffMonths: counter.payoffMonths,
                }}
              />
            )}

            {/* Order */}
            {plan.order.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                  Orden en que las liquidas
                </p>
                <ol className="space-y-1.5" role="list">
                  {plan.order.map((id, i) => {
                    const d = debts.find((x) => x.id === id);
                    if (!d) return null;
                    const monthCleared =
                      plan.months.find((m) => m.cleared.includes(id))?.month ??
                      plan.payoffMonths;
                    return (
                      <li
                        key={id}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-line bg-bg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs text-accent shrink-0">
                            #{i + 1}
                          </span>
                          <p className="font-body text-sm text-ink truncate">
                            {d.name}
                          </p>
                        </div>
                        <p className="font-body text-xs text-muted tabular-nums shrink-0">
                          Mes {monthCleared}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </section>
        )}

        <FinanceAdvice tag="debt" />
      </div>

      <DebtModal
        open={modalOpen}
        editing={editing}
        saving={createM.isPending || updateM.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Borrar esta deuda?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────

function DebtRow({
  debt,
  onEdit,
  onDelete,
  onTogglePaid,
}: {
  debt: FinanceDebt;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePaid: () => void;
}) {
  const balance = Number(debt.balance) || 0;
  const apr = Number(debt.apr) || 0;
  const min = Number(debt.minimum_payment) || 0;
  return (
    <li
      className={clsx(
        "flex items-center gap-3 p-3 rounded-card border bg-bg transition-opacity",
        debt.is_paid ? "opacity-60 border-dashed border-line" : "border-line"
      )}
    >
      <button
        type="button"
        onClick={onTogglePaid}
        aria-pressed={debt.is_paid}
        aria-label={debt.is_paid ? "Marcar como pendiente" : "Marcar como pagada"}
        className={clsx(
          "w-8 h-8 shrink-0 rounded-full border-2 inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          debt.is_paid
            ? "bg-success border-success text-white"
            : "border-line hover:border-accent text-transparent"
        )}
      >
        <Check size={14} aria-hidden />
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            "font-body text-sm text-ink truncate",
            debt.is_paid && "line-through"
          )}
        >
          {debt.name}
        </p>
        <p className="font-body text-xs text-muted">
          <span className="tabular-nums">{formatMoney(balance)}</span>
          {apr > 0 && (
            <>
              <span className="mx-1">·</span>
              <span className="tabular-nums">{apr}% APR</span>
            </>
          )}
          {min > 0 && (
            <>
              <span className="mx-1">·</span>
              <span className="tabular-nums">mín {formatMoney(min)}</span>
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        aria-label="Editar"
        className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-bg-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Pencil size={13} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Borrar"
        className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full text-muted hover:text-danger hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
      >
        <Trash2 size={13} aria-hidden />
      </button>
    </li>
  );
}

function StrategyButton({
  active,
  onClick,
  Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Flame;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "h-auto p-3 rounded-lg text-left transition-all duration-150",
        active ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={14}
          aria-hidden
          className={active ? "text-accent" : "text-muted"}
        />
        <p className="font-body text-sm font-medium">{label}</p>
      </div>
      <p className="font-body text-[11px] text-muted mt-0.5">{sub}</p>
    </button>
  );
}

function KpiSmall({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </p>
      <p
        className={clsx(
          "font-display italic text-lg tabular-nums mt-0.5",
          tone === "danger" ? "text-danger" : "text-ink"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StrategyCompare({
  current,
  counter,
}: {
  current: { strategy: DebtStrategy; totalInterest: number; payoffMonths: number };
  counter: { strategy: DebtStrategy; totalInterest: number; payoffMonths: number };
}) {
  const interestDiff = counter.totalInterest - current.totalInterest;
  const monthsDiff = counter.payoffMonths - current.payoffMonths;
  const otherLabel = counter.strategy === "avalanche" ? "Avalancha" : "Bola de nieve";
  const better =
    current.strategy === "avalanche"
      ? interestDiff >= 0
      : monthsDiff >= 0 || interestDiff >= 0;

  if (!better) return null;

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 font-body text-xs text-ink">
      <p>
        Con esta estrategia vs. <span className="font-medium">{otherLabel}</span>:{" "}
        {interestDiff > 1 && (
          <>
            ahorrás{" "}
            <span className="text-success font-medium tabular-nums">
              {formatMoney(Math.abs(interestDiff))}
            </span>{" "}
            en intereses
          </>
        )}
        {interestDiff > 1 && monthsDiff !== 0 && " · "}
        {monthsDiff > 0 && (
          <>
            salís{" "}
            <span className="text-success font-medium">
              {monthsDiff} {monthsDiff === 1 ? "mes" : "meses"} antes
            </span>
          </>
        )}
        {interestDiff <= 1 && monthsDiff <= 0 && (
          <>Los dos escenarios son equivalentes en costo.</>
        )}
        .
      </p>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-bg-alt/40 p-6 text-center">
      <p className="font-display italic text-lg text-ink">Sin deudas registradas</p>
      <p className="font-body text-sm text-muted mt-1 max-w-prose mx-auto">
        Registra cada deuda con su APR y pago mínimo. Con eso te armo un plan mes a
        mes — avalancha o bola de nieve.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 h-10 px-4 rounded-lg bg-accent text-white font-body text-sm font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex items-center gap-2"
      >
        <Plus size={14} aria-hidden /> Añadir deuda
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="h-[62px] rounded-card border border-line bg-bg animate-pulse"
        />
      ))}
    </ul>
  );
}
