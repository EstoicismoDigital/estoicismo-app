"use client";
import { useState } from "react";
import { Plus, Receipt, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateSale,
  useProducts,
  useClients,
} from "../../hooks/useBusiness";

/**
 * Inline sale logger · una fila para "vendí X a Y".
 *
 * UX:
 *  - Producto opcional, cliente opcional (texto libre o select).
 *  - Monto + Enter.
 *  - Si no hay productos cargados → quick "lo que vendiste" (texto sin link).
 */
export function QuickAddSaleRow() {
  const create = useCreateSale();
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();
  const [amount, setAmount] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  async function save() {
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) {
      toast.error("Ingresa el monto");
      return;
    }
    await create.mutateAsync({
      amount: amt,
      product_id: productId,
      client_id: clientId,
    });
    setAmount("");
    setProductId(null);
    setClientId(null);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    }
  }

  return (
    <div className="rounded-lg border border-line bg-bg p-2 flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
        disabled={create.isPending || !amount}
        className="h-9 w-9 rounded-full bg-accent text-bg flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0 ml-auto"
        aria-label="Registrar venta"
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
