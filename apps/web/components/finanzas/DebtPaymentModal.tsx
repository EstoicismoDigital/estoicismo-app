"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type { FinanceDebt } from "@estoicismo/supabase";
import { monthlyInterest } from "../../lib/debt/amortization";
import { formatMoney } from "../../lib/finance";

export type DebtPaymentSubmit = {
  amount: number;
  occurred_on: string;
  note: string | null;
};

/**
 * Modal para registrar un pago a una deuda. El cliente preview-ea
 * cómo se va a partir el pago en interés vs capital usando la APR
 * mensual sobre el balance vigente. Guarda los splits explícitos
 * para auditoría histórica fiel.
 */
export function DebtPaymentModal(props: {
  open: boolean;
  debt: FinanceDebt | null;
  onClose: () => void;
  onSave: (input: DebtPaymentSubmit) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, debt, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [occurredOn, setOccurredOn] = useState(today);

  useEffect(() => {
    if (!open) return;
    setAmount(debt ? String(debt.minimum_payment) : "");
    setNote("");
    setOccurredOn(today);
  }, [open, debt, today]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const split = useMemo(() => {
    if (!debt) return null;
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) return null;
    const interest = Math.min(monthlyInterest(debt.balance, debt.apr), num);
    const principal = Math.max(0, num - interest);
    const newBalance = Math.max(0, debt.balance - principal);
    return {
      interest,
      principal,
      newBalance,
    };
  }, [amount, debt]);

  if (!mounted || !open || !debt) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">Registrar pago</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="rounded-lg bg-bg/40 border border-line/60 p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Deuda</p>
            <p className="text-sm font-semibold text-ink">{debt.name}</p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
              <div>
                <p className="text-muted">Saldo</p>
                <p className="text-ink font-semibold">
                  {formatMoney(debt.balance, debt.currency)}
                </p>
              </div>
              <div>
                <p className="text-muted">APR</p>
                <p className="text-ink font-semibold">{Number(debt.apr).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted">Mínimo</p>
                <p className="text-ink font-semibold">
                  {formatMoney(debt.minimum_payment, debt.currency)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Monto del pago
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="w-full bg-bg border border-line rounded-lg px-3 py-3 text-2xl font-display italic text-ink focus:outline-none focus:border-accent"
            />
          </div>

          {split && (
            <div className="rounded-lg bg-bg/40 border border-line/60 p-3 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                Cómo se reparte (estimado)
              </p>
              <Row label="Interés" value={formatMoney(split.interest, debt.currency)} accent="text-danger" />
              <Row label="Capital" value={formatMoney(split.principal, debt.currency)} accent="text-success" />
              <div className="border-t border-line/40 pt-1.5 mt-1">
                <Row
                  label="Nuevo saldo"
                  value={formatMoney(split.newBalance, debt.currency)}
                  bold
                />
              </div>
              {split.newBalance === 0 && (
                <p className="text-[11px] text-success mt-1">
                  Este pago liquida la deuda completamente.
                </p>
              )}
              {split.principal === 0 && split.interest > 0 && (
                <p className="text-[11px] text-orange-400 mt-1">
                  Este pago sólo cubre intereses — el capital no baja.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
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
          </div>
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
                amount: num,
                note: note.trim() || null,
                occurred_on: occurredOn,
              });
            }}
            className={clsx(
              "px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest",
              "hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Registrar pago
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Row({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex justify-between items-center text-[12px]">
      <span className={clsx("text-muted", bold && "text-ink")}>{label}</span>
      <span className={clsx("font-mono", accent ?? "text-ink", bold && "font-semibold")}>
        {value}
      </span>
    </div>
  );
}
