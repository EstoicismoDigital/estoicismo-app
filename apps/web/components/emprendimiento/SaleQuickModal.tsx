"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type { BusinessProduct, BusinessClient } from "@estoicismo/supabase";

export type SaleQuickSubmit = {
  product_id: string | null;
  client_id: string | null;
  quantity: number;
  amount: number;
  occurred_on: string;
  note: string | null;
  log_as_income: boolean;
};

export function SaleQuickModal(props: {
  open: boolean;
  products: BusinessProduct[];
  clients: BusinessClient[];
  onClose: () => void;
  onSave: (input: SaleQuickSubmit) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, products, clients, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = new Date().toISOString().slice(0, 10);
  const [productId, setProductId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [amount, setAmount] = useState("");
  const [occurredOn, setOccurredOn] = useState(today);
  const [note, setNote] = useState("");
  const [logAsIncome, setLogAsIncome] = useState(true);

  // Auto-fill amount when product selected.
  useEffect(() => {
    if (!open) return;
    if (!productId) return;
    const p = products.find((x) => x.id === productId);
    if (p) {
      const q = Number(quantity || "1");
      setAmount(String(p.price * q));
    }
  }, [productId, quantity, products, open]);

  useEffect(() => {
    if (!open) return;
    setProductId("");
    setClientId("");
    setQuantity("1");
    setAmount("");
    setOccurredOn(today);
    setNote("");
    setLogAsIncome(true);
  }, [open, today]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">Nueva venta</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Producto / servicio
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            >
              <option value="">— Sin producto / personalizado —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Cliente
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            >
              <option value="">— Sin cliente registrado —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Total cobrado
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Nota
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer p-2 -mx-2 rounded hover:bg-line/30">
            <input
              type="checkbox"
              checked={logAsIncome}
              onChange={(e) => setLogAsIncome(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div className="text-[11px]">
              <p className="text-ink font-semibold">Registrar como ingreso en Finanzas</p>
              <p className="text-muted">
                Crea una transacción "Ventas" en tus finanzas personales.
              </p>
            </div>
          </label>
        </div>
        <div className="border-t border-line px-5 py-3 flex justify-end gap-2 sticky bottom-0 bg-bg-alt/95">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!amount || Number(amount) <= 0 || saving}
            onClick={async () => {
              const num = Number(amount);
              if (!num || num <= 0) return;
              await onSave({
                product_id: productId || null,
                client_id: clientId || null,
                quantity: Number(quantity) || 1,
                amount: num,
                occurred_on: occurredOn,
                note: note.trim() || null,
                log_as_income: logAsIncome,
              });
            }}
            className={clsx(
              "px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest",
              "hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Registrar venta
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
