"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import {
  useCreateTransaction,
  useFinanceCategories,
} from "../../hooks/useFinance";
import { getTodayStr } from "../../lib/dateUtils";
import type { FinanceKind } from "@estoicismo/supabase";

const LAST_CAT_KEY_PREFIX = "finance:last-category:";

function readLastCategory(kind: FinanceKind): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_CAT_KEY_PREFIX + kind);
  } catch {
    return null;
  }
}

function writeLastCategory(kind: FinanceKind, id: string | null): void {
  if (typeof window === "undefined" || !id) return;
  try {
    window.localStorage.setItem(LAST_CAT_KEY_PREFIX + kind, id);
  } catch {
    /* ignore */
  }
}

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

  // Cuando cambia el kind, intentar usar la última categoría guardada
  // de ese kind (si sigue existiendo). Si no, fallback a la primera.
  useEffect(() => {
    setCategoryId(null);
    const last = readLastCategory(kind);
    if (last && filteredCats.some((c) => c.id === last)) {
      setCategoryId(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, filteredCats.length]);

  // Default category: la guardada > la primera del kind > null
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
      // Recordar la última categoría usada (por kind) — la próxima
      // vez aparece preseleccionada.
      writeLastCategory(kind, effectiveCategoryId);
      setAmount("");
      // No reseteamos categoryId — el user típicamente registra varios
      // gastos de la misma categoría seguidos.
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

      {/* Color dot for selected category */}
      {effectiveCategoryId && (
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{
            backgroundColor:
              filteredCats.find((c) => c.id === effectiveCategoryId)?.color ??
              "currentColor",
          }}
        />
      )}

      {/* Category */}
      <select
        value={effectiveCategoryId ?? ""}
        onChange={(e) => setCategoryId(e.target.value || null)}
        className="flex-1 min-w-0 bg-transparent border-0 font-body text-sm text-ink focus:outline-none truncate cursor-pointer"
      >
        {filteredCats.length === 0 && (
          <option value="">Sin categorías</option>
        )}
        {filteredCats.map((c) => (
          <option key={c.id} value={c.id}>
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
