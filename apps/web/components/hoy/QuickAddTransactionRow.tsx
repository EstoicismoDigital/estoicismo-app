"use client";
import { useMemo, useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import {
  useCreateTransaction,
  useFinanceCategories,
} from "../../hooks/useFinance";
import { getTodayStr } from "../../lib/dateUtils";
import type { FinanceKind } from "@estoicismo/supabase";

/**
 * Inline transaction logger · una sola fila, dos taps.
 *
 * UX:
 *  1. Toggle ingreso/gasto (visual: flecha verde / roja).
 *  2. Tipea monto.
 *  3. Selecciona categoría (las del kind).
 *  4. Enter o tap "Agregar" → guarda y resetea.
 *
 * No hay note, no hay account, no hay ocurrence_on en otro día.
 * Para eso está el modal completo (link "más opciones →").
 *
 * Diseñado para que filles 5 transacciones en 30 segundos.
 */
export function QuickAddTransactionRow({
  defaultKind = "expense",
  onSaved,
  compact = false,
}: {
  defaultKind?: FinanceKind;
  onSaved?: () => void;
  compact?: boolean;
}) {
  const [kind, setKind] = useState<FinanceKind>(defaultKind);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const create = useCreateTransaction();

  const { data: cats = [] } = useFinanceCategories();
  const filteredCats = useMemo(
    () => cats.filter((c) => c.kind === kind),
    [cats, kind]
  );

  // Default category: the first one of the kind, if user hasn't picked
  const effectiveCategoryId =
    categoryId ?? filteredCats[0]?.id ?? null;

  async function save() {
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (!effectiveCategoryId) {
      toast.error("Crea una categoría primero", {
        description: "Ve a Finanzas → Resumen y agrega categorías.",
      });
      return;
    }
    try {
      await create.mutateAsync({
        amount: amt,
        kind,
        category_id: effectiveCategoryId,
        occurred_on: getTodayStr(),
      });
      setAmount("");
      setCategoryId(null);
      onSaved?.();
    } catch {
      // toast handled by hook
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    }
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-lg border border-line bg-bg p-2",
        compact && "p-1.5"
      )}
    >
      {/* Kind toggle */}
      <button
        type="button"
        onClick={() => setKind(kind === "income" ? "expense" : "income")}
        className={clsx(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          kind === "income"
            ? "bg-success/15 text-success"
            : "bg-danger/15 text-danger"
        )}
        title={
          kind === "income"
            ? "Cambiar a gasto"
            : "Cambiar a ingreso"
        }
      >
        {kind === "income" ? (
          <ArrowDownCircle size={16} />
        ) : (
          <ArrowUpCircle size={16} />
        )}
      </button>

      {/* Amount */}
      <input
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
        onKeyDown={handleKey}
        placeholder="0"
        className="w-24 bg-transparent border-0 font-display italic text-lg text-ink placeholder:text-muted/40 focus:outline-none tabular-nums"
      />

      {/* Category */}
      <select
        value={effectiveCategoryId ?? ""}
        onChange={(e) => setCategoryId(e.target.value || null)}
        className="flex-1 min-w-0 bg-transparent border-0 font-body text-sm text-ink focus:outline-none truncate"
      >
        {filteredCats.length === 0 && (
          <option value="">Sin categorías</option>
        )}
        {filteredCats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon ? `${c.icon} ` : ""}
            {c.name}
          </option>
        ))}
      </select>

      {/* Save */}
      <button
        type="button"
        onClick={save}
        disabled={create.isPending || !amount}
        className="h-9 w-9 rounded-full bg-accent text-bg flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0"
        aria-label="Agregar transacción"
      >
        {create.isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Plus size={14} />
        )}
      </button>
    </div>
  );
}
