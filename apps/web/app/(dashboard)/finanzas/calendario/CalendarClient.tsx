"use client";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type {
  FinanceTransaction,
  CreateTransactionInput,
} from "@estoicismo/supabase";
import {
  useFinanceCategories,
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../../../../hooks/useFinance";
import {
  CalendarView,
  visibleMonthRange,
} from "../../../../components/finanzas/CalendarView";
import { TransactionList } from "../../../../components/finanzas/TransactionList";
import { TransactionModal } from "../../../../components/finanzas/TransactionModal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { formatMoney, toIsoDate } from "../../../../lib/finance";

export function CalendarClient() {
  const [monthRef, setMonthRef] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(
    toIsoDate(new Date())
  );
  const range = useMemo(() => visibleMonthRange(monthRef), [monthRef]);

  const { data: categories = [] } = useFinanceCategories();
  const { data: monthTx = [], isLoading } = useTransactions(range);
  const createM = useCreateTransaction();
  const updateM = useUpdateTransaction();
  const deleteM = useDeleteTransaction();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);
  const [confirmDelete, setConfirmDelete] =
    useState<FinanceTransaction | null>(null);

  const dayTx = useMemo(
    () => monthTx.filter((t) => t.occurred_on === selectedDay),
    [monthTx, selectedDay]
  );

  const dayStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of dayTx) {
      const n = Number(t.amount) || 0;
      if (t.kind === "income") income += n;
      else expense += n;
    }
    return { income, expense, net: income - expense };
  }, [dayTx]);

  const dayLabel = selectedDay
    ? new Date(selectedDay + "T00:00:00").toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  async function handleSave(draft: CreateTransactionInput) {
    try {
      if (editing) {
        await updateM.mutateAsync({ id: editing.id, input: draft });
      } else {
        await createM.mutateAsync(draft);
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      /* hook shows toast */
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

  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Finanzas · Calendario
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            Tu mes, día a día.
          </h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Calendario */}
        <section aria-label="Calendario" className="rounded-card border border-line bg-bg-alt/40 p-4 sm:p-5">
          <CalendarView
            monthRef={monthRef}
            onChangeMonth={setMonthRef}
            transactions={monthTx}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </section>

        {/* Detalle del día */}
        <section aria-label="Movimientos del día" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {dayLabel || "Día"}
              </p>
              <p className="font-body text-sm text-ink">
                <span className="text-success tabular-nums">
                  +{formatMoney(dayStats.income)}
                </span>
                <span className="text-muted mx-2">·</span>
                <span className="text-danger tabular-nums">
                  −{formatMoney(dayStats.expense)}
                </span>
                <span className="text-muted mx-2">·</span>
                <span
                  className={`tabular-nums font-medium ${
                    dayStats.net >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {dayStats.net >= 0 ? "+" : "−"}
                  {formatMoney(dayStats.net)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-full bg-accent text-white font-body text-[12px] font-medium hover:opacity-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Plus size={14} aria-hidden />
              Añadir
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-card border border-line bg-bg-alt/40 p-4">
              <p className="font-body text-xs text-muted">Cargando…</p>
            </div>
          ) : (
            <TransactionList
              transactions={dayTx}
              categories={categories}
              onEdit={(tx) => {
                setEditing(tx);
                setModalOpen(true);
              }}
              onDelete={(tx) => setConfirmDelete(tx)}
              emptyMessage="Este día está limpio. Aprovéchalo."
            />
          )}
        </section>
      </div>

      <TransactionModal
        open={modalOpen}
        editing={editing}
        categories={categories}
        saving={createM.isPending || updateM.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={(draft) =>
          handleSave({
            ...draft,
            // Prefer the selected day when user opens the modal from a
            // specific cell — don't silently overwrite what they chose.
            occurred_on:
              editing || !selectedDay ? draft.occurred_on : selectedDay,
          })
        }
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Borrar este movimiento?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
