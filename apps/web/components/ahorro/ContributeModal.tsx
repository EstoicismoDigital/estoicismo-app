"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Plus, Minus } from "lucide-react";
import { clsx } from "clsx";
import type { SavingsGoal } from "@estoicismo/supabase";
import { formatMoney } from "../../lib/finance";

/**
 * Modal para abonar (o retirar) de una meta.
 *
 * El "amount" puede ser positivo (abono) o negativo (retiro). Default
 * es abono. UI ofrece toggle Abono/Retiro.
 *
 * Por simplicidad de MVP no creamos finance_transaction enlazada
 * automáticamente — eso quedaría detrás de un checkbox "registrar
 * también como gasto" en una iteración futura.
 */
export function ContributeModal(props: {
  open: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSave: (input: {
    amount: number;
    note: string | null;
    occurred_on: string;
    log_as_expense: boolean;
  }) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, goal, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [occurredOn, setOccurredOn] = useState(today);
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [logAsExpense, setLogAsExpense] = useState(true);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setNote("");
    setOccurredOn(today);
    setDirection("add");
    setLogAsExpense(true);
  }, [open, today]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open || !goal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">
            {direction === "add" ? "Abonar a meta" : "Retirar de meta"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="rounded-lg bg-bg/40 border border-line/60 p-3 flex items-center gap-3">
            <div
              className="w-2 self-stretch rounded-full"
              style={{ backgroundColor: goal.color }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{goal.name}</p>
              <p className="text-[11px] text-muted">
                Meta: {formatMoney(Number(goal.target_amount), goal.currency)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("add")}
              className={clsx(
                "py-2.5 rounded-lg border inline-flex items-center justify-center gap-1.5 text-sm",
                direction === "add"
                  ? "bg-success/15 border-success text-success"
                  : "border-line text-muted hover:text-ink"
              )}
            >
              <Plus size={14} /> Abono
            </button>
            <button
              type="button"
              onClick={() => setDirection("remove")}
              className={clsx(
                "py-2.5 rounded-lg border inline-flex items-center justify-center gap-1.5 text-sm",
                direction === "remove"
                  ? "bg-danger/15 border-danger text-danger"
                  : "border-line text-muted hover:text-ink"
              )}
            >
              <Minus size={14} /> Retiro
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Monto
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full bg-bg border border-line rounded-lg px-3 py-3 text-2xl font-display italic text-ink focus:outline-none focus:border-accent"
            />
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
              Nota (opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Aguinaldo, freelance, ahorro mensual…"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>

          {direction === "add" && (
            <label className="flex items-start gap-2 cursor-pointer p-2 -mx-2 rounded hover:bg-line/30 transition-colors">
              <input
                type="checkbox"
                checked={logAsExpense}
                onChange={(e) => setLogAsExpense(e.target.checked)}
                className="mt-0.5 rounded"
              />
              <div className="text-[11px]">
                <p className="text-ink font-semibold">Registrar como gasto en Ahorro</p>
                <p className="text-muted">
                  Crea una transacción para que aparezca en tu mes — sin doble conteo.
                </p>
              </div>
            </label>
          )}
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
                amount: direction === "add" ? num : -num,
                note: note.trim() || null,
                occurred_on: occurredOn,
                log_as_expense: direction === "add" && logAsExpense,
              });
            }}
            className={clsx(
              "px-5 py-2 rounded-lg font-mono text-[11px] uppercase tracking-widest text-bg",
              direction === "add" ? "bg-success" : "bg-danger",
              "hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {direction === "add" ? "Abonar" : "Retirar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
