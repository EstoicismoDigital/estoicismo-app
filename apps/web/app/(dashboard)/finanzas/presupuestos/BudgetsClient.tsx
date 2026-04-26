"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Wallet, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import {
  useBudgets,
  useUpsertBudget,
  useDeleteBudget,
} from "../../../../hooks/useBudgets";
import {
  useFinanceCategories,
  useTransactions,
} from "../../../../hooks/useFinance";
import { BudgetModal } from "../../../../components/presupuestos/BudgetModal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import {
  computeAllBudgetStatuses,
  summarizeBudgets,
  projectMonthEnd,
  type BudgetStatus,
} from "../../../../lib/budgets/alerts";
import { formatMoney } from "../../../../lib/finance";
import type { Budget, FinanceCategory } from "@estoicismo/supabase";

export function BudgetsClient() {
  const { data: budgets = [] } = useBudgets({ only_active: true });
  const { data: categories = [] } = useFinanceCategories();
  // Carga del mes vigente para no traer histórico completo.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);
  const monthEndStr = monthEnd.toISOString().slice(0, 10);
  const { data: transactions = [] } = useTransactions({
    from: monthStartStr,
    to: monthEndStr,
  });

  const upsertM = useUpsertBudget();
  const deleteM = useDeleteBudget();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Budget | null>(null);

  const expenseCategories = useMemo(
    () => categories.filter((c: FinanceCategory) => c.kind === "expense"),
    [categories]
  );

  const statuses = useMemo(
    () => computeAllBudgetStatuses(budgets, transactions),
    [budgets, transactions]
  );

  const summary = useMemo(() => summarizeBudgets(statuses), [statuses]);

  const categoryById = useMemo(() => {
    const m = new Map<string, FinanceCategory>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  // Filtrar categorías ya con presupuesto al crear uno nuevo.
  const availableCategoriesForNew = useMemo(() => {
    if (editingBudget) {
      // edición: incluye la categoría actual.
      return expenseCategories;
    }
    const taken = new Set(budgets.map((b) => b.category_id));
    return expenseCategories.filter((c) => !taken.has(c.id));
  }, [editingBudget, expenseCategories, budgets]);

  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Finanzas · Presupuestos
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            Dile a tu dinero a dónde ir.
          </h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
            <Stat label="Tope total" value={formatMoney(summary.totalLimit, "MXN")} />
            <Stat label="Gastado" value={formatMoney(summary.totalSpent, "MXN")} />
            <Stat label="Activos" value={`${summary.total}`} />
            {summary.exceeded > 0 && (
              <div className="ml-auto flex items-center gap-1 text-danger text-xs font-mono">
                <AlertTriangle size={12} />
                {summary.exceeded} excedido{summary.exceeded > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {summary.triggered > 0 && (
          <div className="rounded-card border border-orange-400/40 bg-orange-400/5 p-3 flex items-start gap-2">
            <AlertTriangle className="text-orange-400 mt-0.5" size={16} />
            <div className="text-sm">
              <p className="text-ink font-semibold">
                {summary.triggered} categoría{summary.triggered > 1 ? "s" : ""} cerca del límite
              </p>
              <p className="text-muted text-[12px]">
                Ya cruzaron tu threshold de alerta este mes.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-display italic text-xl text-ink">Tus presupuestos</h2>
          <button
            type="button"
            onClick={() => {
              setEditingBudget(null);
              setModalOpen(true);
            }}
            disabled={availableCategoriesForNew.length === 0 && !editingBudget}
            className="px-3 py-1.5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            <Plus size={12} /> Nuevo
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="rounded-card border border-dashed border-line p-8 text-center space-y-2">
            <Wallet className="mx-auto text-muted" size={32} />
            <p className="text-sm text-ink font-semibold">Sin presupuestos aún</p>
            <p className="text-[12px] text-muted">
              Define un tope mensual para tus categorías de gasto.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {statuses.map((s) => (
              <BudgetCard
                key={s.budget.id}
                status={s}
                category={categoryById.get(s.budget.category_id) ?? null}
                onEdit={() => {
                  setEditingBudget(s.budget);
                  setModalOpen(true);
                }}
                onDelete={() => setConfirmDelete(s.budget)}
              />
            ))}
          </div>
        )}
      </div>

      <BudgetModal
        open={modalOpen}
        categories={availableCategoriesForNew}
        initial={
          editingBudget
            ? {
                category_id: editingBudget.category_id,
                amount: Number(editingBudget.amount),
                alert_threshold: editingBudget.alert_threshold,
              }
            : undefined
        }
        saving={upsertM.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={async (input) => {
          await upsertM.mutateAsync({
            category_id: input.category_id,
            amount: input.amount,
            alert_threshold: input.alert_threshold,
            period: "monthly",
          });
          setModalOpen(false);
          setEditingBudget(null);
        }}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Eliminar presupuesto?"
        description="Las transacciones de la categoría no se afectan."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteM.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function BudgetCard(props: {
  status: BudgetStatus;
  category: FinanceCategory | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { status, category, onEdit, onDelete } = props;
  const { budget, spent, percent, color, label, state } = status;
  const projection = useMemo(() => projectMonthEnd(spent), [spent]);
  const projectedExceeds = projection.projected > Number(budget.amount);

  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {category && (
            <span
              className="w-2 h-8 rounded-full shrink-0"
              style={{ backgroundColor: category.color }}
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">
              {category?.name ?? "Categoría"}
            </p>
            <p className="text-[11px] text-muted">
              {formatMoney(spent, budget.currency)} de{" "}
              {formatMoney(Number(budget.amount), budget.currency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              backgroundColor: `${color}20`,
              color,
            }}
          >
            {label}
          </span>
          <button onClick={onEdit} className="p-1 text-muted hover:text-ink rounded">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1 text-muted hover:text-danger rounded">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="h-2 bg-line/30 rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${Math.min(100, percent)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted">{percent.toFixed(0)}% del tope</span>
        <span className={clsx(projectedExceeds && state !== "exceeded" ? "text-orange-400" : "text-muted")}>
          {projection.daysElapsed}/{projection.daysInMonth} días · proyectado{" "}
          {formatMoney(projection.projected, budget.currency)}
        </span>
      </div>
    </div>
  );
}
