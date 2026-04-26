"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type { FinanceCategory } from "@estoicismo/supabase";

export type BudgetModalSubmit = {
  category_id: string;
  amount: number;
  alert_threshold: number;
};

export function BudgetModal(props: {
  open: boolean;
  /** Categorías disponibles (filtradas a kind=expense). */
  categories: FinanceCategory[];
  /** Categoría preseleccionada cuando edita un budget existente. */
  initial?: { category_id: string; amount: number; alert_threshold: number };
  onClose: () => void;
  onSave: (input: BudgetModalSubmit) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, categories, initial, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [categoryId, setCategoryId] = useState(initial?.category_id ?? categories[0]?.id ?? "");
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [threshold, setThreshold] = useState<number>(initial?.alert_threshold ?? 80);

  useEffect(() => {
    if (!open) return;
    setCategoryId(initial?.category_id ?? categories[0]?.id ?? "");
    setAmount(initial?.amount ? String(initial.amount) : "");
    setThreshold(initial?.alert_threshold ?? 80);
  }, [open, initial, categories]);

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
      <div className="w-full sm:max-w-md bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">
            {initial ? "Ajustar presupuesto" : "Nuevo presupuesto"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!initial}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Tope mensual ($)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="3000"
              className="w-full bg-bg border border-line rounded-lg px-3 py-3 text-2xl font-display italic text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Avísame al {threshold}% del consumo
            </label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          <p className="text-[11px] text-muted italic">
            Alerta dispara cuando el gasto del mes alcanza el % indicado.
          </p>
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
            disabled={!categoryId || !amount || Number(amount) <= 0 || saving}
            onClick={async () => {
              const num = Number(amount);
              if (!categoryId || !num || num <= 0) return;
              await onSave({
                category_id: categoryId,
                amount: num,
                alert_threshold: threshold,
              });
            }}
            className={clsx(
              "px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest",
              "hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Guardar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
