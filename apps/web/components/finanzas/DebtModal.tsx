"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type {
  FinanceDebt,
  FinanceDebtKind,
  CreateDebtInput,
} from "@estoicismo/supabase";

const DEBT_KINDS: { value: FinanceDebtKind; label: string }[] = [
  { value: "credit_card", label: "Tarjeta" },
  { value: "personal_loan", label: "Préstamo" },
  { value: "mortgage", label: "Hipoteca" },
  { value: "auto", label: "Auto" },
  { value: "student", label: "Estudios" },
  { value: "family", label: "Familia" },
  { value: "other", label: "Otro" },
];

export function DebtModal({
  open,
  editing,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing?: FinanceDebt | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: CreateDebtInput) => void | Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<FinanceDebtKind>("credit_card");
  const [balance, setBalance] = useState("");
  const [min, setMin] = useState("");
  const [apr, setApr] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [touched, setTouched] = useState(false);

  const dialogRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    if (editing) {
      setName(editing.name);
      setKind(editing.kind);
      setBalance(String(editing.balance));
      setMin(String(editing.minimum_payment));
      setApr(String(editing.apr));
      setDueDay(editing.due_day != null ? String(editing.due_day) : "");
    } else {
      setName("");
      setKind("credit_card");
      setBalance("");
      setMin("");
      setApr("");
      setDueDay("");
    }
    setTouched(false);
    const t = window.setTimeout(() => nameRef.current?.focus(), 30);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const balN = Number.parseFloat(balance);
  const minN = min === "" ? 0 : Number.parseFloat(min);
  const aprN = apr === "" ? 0 : Number.parseFloat(apr);
  const dueN = dueDay === "" ? null : Number.parseInt(dueDay, 10);

  const nameErr = touched && !name.trim() ? "Dale un nombre." : null;
  const balErr =
    touched && (!Number.isFinite(balN) || balN <= 0)
      ? "Saldo mayor a 0."
      : null;
  const minErr =
    touched && (!Number.isFinite(minN) || minN < 0) ? "No puede ser negativo." : null;
  const aprErr =
    touched && (!Number.isFinite(aprN) || aprN < 0 || aprN > 200)
      ? "APR entre 0 y 200."
      : null;
  const dueErr =
    touched && dueN !== null && (dueN < 1 || dueN > 31) ? "Día inválido." : null;

  const canSave =
    !!name.trim() &&
    Number.isFinite(balN) &&
    balN > 0 &&
    !minErr &&
    !aprErr &&
    !dueErr &&
    !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSave) return;
    await onSave({
      name: name.trim(),
      kind,
      balance: Number(balN.toFixed(2)),
      minimum_payment: Number.isFinite(minN) ? Number(minN.toFixed(2)) : 0,
      apr: Number.isFinite(aprN) ? Number(aprN.toFixed(2)) : 0,
      due_day: dueN,
    });
  }

  const titleId = "debt-modal-title";
  const node = (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
      />
      <form
        ref={dialogRef}
        onSubmit={handleSubmit}
        className="relative bg-bg w-full sm:max-w-lg rounded-t-modal sm:rounded-modal shadow-[0_20px_60px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 max-h-[90dvh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm px-5 sm:px-6 py-4 flex items-center justify-between border-b border-line">
          <h2 id={titleId} className="font-display italic text-xl sm:text-2xl text-ink">
            {editing ? "Editar deuda" : "Nueva deuda"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-ink hover:bg-bg-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          {/* Kind chips */}
          <div>
            <Label>Tipo</Label>
            <ul className="mt-2 flex flex-wrap gap-1.5" role="listbox" aria-label="Tipo de deuda">
              {DEBT_KINDS.map((k) => {
                const active = k.value === kind;
                return (
                  <li key={k.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setKind(k.value)}
                      className={clsx(
                        "px-3 h-9 rounded-full border font-body text-[12px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        active
                          ? "border-accent text-ink bg-accent/10"
                          : "border-line text-muted hover:text-ink hover:border-accent/50"
                      )}
                    >
                      {k.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <Label>Nombre</Label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              maxLength={60}
              placeholder="Ej. Préstamo personal Banamex"
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              className={inputCls(nameErr)}
            />
            {nameErr && <ErrText>{nameErr}</ErrText>}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Saldo por pagar</Label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={balance}
                placeholder="25000"
                onChange={(e) => setBalance(e.target.value)}
                onBlur={() => setTouched(true)}
                className={inputCls(balErr)}
              />
              {balErr && <ErrText>{balErr}</ErrText>}
            </div>
            <div>
              <Label>Pago mínimo mensual</Label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={min}
                placeholder="1200"
                onChange={(e) => setMin(e.target.value)}
                onBlur={() => setTouched(true)}
                className={inputCls(minErr)}
              />
              {minErr && <ErrText>{minErr}</ErrText>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>CAT / APR %</Label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="200"
                step="0.01"
                value={apr}
                placeholder="45.5"
                onChange={(e) => setApr(e.target.value)}
                onBlur={() => setTouched(true)}
                className={inputCls(aprErr)}
              />
              {aprErr && <ErrText>{aprErr}</ErrText>}
            </div>
            <div>
              <Label>Día de pago (1-31)</Label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={dueDay}
                placeholder="5"
                onChange={(e) => setDueDay(e.target.value)}
                onBlur={() => setTouched(true)}
                className={inputCls(dueErr)}
              />
              {dueErr && <ErrText>{dueErr}</ErrText>}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-bg/95 backdrop-blur-sm border-t border-line px-5 sm:px-6 py-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="h-11 px-5 rounded-lg font-body font-medium text-sm text-white bg-accent hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {saving && <Loader2 size={14} className="animate-spin" aria-hidden />}
            {editing ? "Guardar" : "Añadir"}
          </button>
        </div>
      </form>
    </div>
  );

  return createPortal(node, document.body);
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
      {children}
    </p>
  );
}
function ErrText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 font-body text-xs text-danger">{children}</p>;
}
function inputCls(err: string | null | undefined) {
  return clsx(
    "mt-1 w-full h-11 px-3 rounded-lg border bg-bg-alt font-body text-[14px] text-ink tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors",
    err ? "border-danger/60" : "border-line focus:border-accent"
  );
}
