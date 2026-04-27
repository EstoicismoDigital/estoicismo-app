"use client";
import { useMemo, useState } from "react";
import { Plus, Receipt, Loader2, Coins } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import {
  useCreateSale,
  useProducts,
  useClients,
} from "../../hooks/useBusiness";
import {
  useCreateTransaction,
  useFinanceCategories,
} from "../../hooks/useFinance";
import { getTodayStr } from "../../lib/dateUtils";

const AUTO_LOG_KEY = "negocio:sale-auto-log-finance";

function readAutoLog(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.localStorage.getItem(AUTO_LOG_KEY);
    return v === null ? true : v === "true"; // default ON
  } catch {
    return true;
  }
}

function writeAutoLog(v: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTO_LOG_KEY, String(v));
  } catch {
    /* ignore */
  }
}

/**
 * Inline sale logger · una fila para "vendí X a Y".
 *
 * UX:
 *  - Producto opcional, cliente opcional (texto libre o select).
 *  - Monto + Enter.
 *  - Toggle "auto-log a finanzas" (default ON, persistido en LS):
 *    al guardar la venta, se crea un finance_transaction de tipo
 *    income en la categoría "Ventas" (o la primera de income).
 *    Doble-entry sin trabajo extra.
 */
export function QuickAddSaleRow() {
  const createSale = useCreateSale();
  const createTx = useCreateTransaction();
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();
  const { data: categories = [] } = useFinanceCategories();
  const [amount, setAmount] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [autoLog, setAutoLog] = useState(() => readAutoLog());

  // Categoría "Ventas" (income) o la primera disponible
  const salesCategoryId = useMemo(() => {
    const exact = categories.find(
      (c) => c.kind === "income" && c.name.toLowerCase().includes("venta")
    );
    if (exact) return exact.id;
    return categories.find((c) => c.kind === "income")?.id ?? null;
  }, [categories]);

  function toggleAutoLog() {
    const next = !autoLog;
    setAutoLog(next);
    writeAutoLog(next);
  }

  async function save() {
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) {
      toast.error("Ingresa el monto");
      return;
    }

    try {
      // 1. Crear la venta
      const sale = await createSale.mutateAsync({
        amount: amt,
        product_id: productId,
        client_id: clientId,
      });

      // 2. Si auto-log activo, crear finance_transaction
      if (autoLog && salesCategoryId) {
        await createTx.mutateAsync({
          amount: amt,
          kind: "income",
          category_id: salesCategoryId,
          occurred_on: getTodayStr(),
          note: clients.find((c) => c.id === clientId)?.name
            ? `Venta a ${clients.find((c) => c.id === clientId)?.name}`
            : "Venta",
        });
        toast.success("Venta + ingreso registrados", {
          description: `${amt} en ventas y en /finanzas también.`,
        });
      }

      setAmount("");
      setProductId(null);
      setClientId(null);
      // sale ref opcional, para futuro link en UI
      void sale;
    } catch {
      // toast en hooks
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    }
  }

  const saving = createSale.isPending || createTx.isPending;

  return (
    <div className="rounded-lg border border-line bg-bg p-2 space-y-2">
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <Receipt size={14} className="text-accent shrink-0 ml-1" />
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
          onKeyDown={handleKey}
          placeholder="Monto"
          className="w-24 bg-transparent border-0 font-display italic text-base text-ink placeholder:text-muted/40 focus:outline-none tabular-nums"
        />
        {products.length > 0 && (
          <select
            value={productId ?? ""}
            onChange={(e) => setProductId(e.target.value || null)}
            className="bg-transparent border-0 font-body text-xs text-muted focus:outline-none flex-1 min-w-0 max-w-[40%] truncate"
          >
            <option value="">Producto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        {clients.length > 0 && (
          <select
            value={clientId ?? ""}
            onChange={(e) => setClientId(e.target.value || null)}
            className="bg-transparent border-0 font-body text-xs text-muted focus:outline-none flex-1 min-w-0 max-w-[40%] truncate"
          >
            <option value="">Cliente…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving || !amount}
          className="h-9 w-9 rounded-full bg-accent text-bg flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0 ml-auto"
          aria-label="Registrar venta"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
        </button>
      </div>

      {/* Auto-log toggle */}
      {salesCategoryId && (
        <button
          type="button"
          onClick={toggleAutoLog}
          className={clsx(
            "w-full inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[9px] uppercase tracking-widest transition-colors",
            autoLog
              ? "text-accent bg-accent/10"
              : "text-muted hover:text-ink"
          )}
          title={
            autoLog
              ? "Cada venta se duplica como ingreso en finanzas"
              : "Solo registra venta, no afecta finanzas personales"
          }
        >
          <Coins size={10} />
          {autoLog
            ? "Auto-log a finanzas (ON)"
            : "Auto-log a finanzas (OFF)"}
        </button>
      )}
    </div>
  );
}
