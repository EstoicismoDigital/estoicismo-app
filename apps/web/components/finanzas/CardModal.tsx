"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type {
  FinanceCreditCard,
  CreateCreditCardInput,
} from "@estoicismo/supabase";

const PRESET_COLORS = [
  "#22774E",
  "#0E7490",
  "#7C3AED",
  "#D97706",
  "#DC2626",
  "#1F2937",
  "#EC4899",
  "#15803D",
];

/**
 * Modal para crear / editar una tarjeta de crédito.
 *
 * Políticas:
 *  - last4 se valida como 4 dígitos (DB tiene el mismo check).
 *  - Solo alias + last4. NUNCA pedimos el número completo.
 *  - APR es opcional pero útil para la estrategia de pago.
 */
export function CardModal({
  open,
  editing,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing?: FinanceCreditCard | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: CreateCreditCardInput) => void | Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [limit, setLimit] = useState("");
  const [balance, setBalance] = useState("");
  const [apr, setApr] = useState("");
  const [cutDay, setCutDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [touched, setTouched] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    if (editing) {
      setName(editing.name);
      setLast4(editing.last4 ?? "");
      setLimit(String(editing.credit_limit));
      setBalance(String(editing.current_balance));
      setApr(String(editing.apr));
      setCutDay(editing.cut_day != null ? String(editing.cut_day) : "");
      setDueDay(editing.due_day != null ? String(editing.due_day) : "");
      setColor(editing.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setLast4("");
      setLimit("");
      setBalance("");
      setApr("");
      setCutDay("");
      setDueDay("");
      setColor(PRESET_COLORS[0]);
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

  const limitN = Number.parseFloat(limit);
  const balanceN = balance === "" ? 0 : Number.parseFloat(balance);
  const aprN = apr === "" ? 0 : Number.parseFloat(apr);
  const cutN = cutDay === "" ? null : Number.parseInt(cutDay, 10);
  const dueN = dueDay === "" ? null : Number.parseInt(dueDay, 10);

  const nameError = touched && !name.trim() ? "Dale un nombre a la tarjeta." : null;
  const last4Error =
    touched && last4 && !/^[0-9]{4}$/.test(last4) ? "Exactamente 4 dígitos." : null;
  const limitError =
    touched && (!Number.isFinite(limitN) || limitN <= 0)
      ? "El límite debe ser mayor a 0."
      : null;
  const balanceError =
    touched && (!Number.isFinite(balanceN) || balanceN < 0)
      ? "El saldo no puede ser negativo."
      : null;
  const cutError =
    touched && cutN !== null && (cutN < 1 || cutN > 31)
      ? "Día inválido (1–31)."
      : null;
  const dueError =
    touched && dueN !== null && (dueN < 1 || dueN > 31)
      ? "Día inválido (1–31)."
      : null;

  const canSave =
    !!name.trim() &&
    Number.isFinite(limitN) &&
    limitN > 0 &&
    !nameError &&
    !last4Error &&
    !limitError &&
    !balanceError &&
    !cutError &&
    !dueError &&
    !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSave) return;
    await onSave({
      name: name.trim(),
      last4: last4 || null,
      credit_limit: Number(limitN.toFixed(2)),
      current_balance: Number.isFinite(balanceN) ? Number(balanceN.toFixed(2)) : 0,
      apr: Number.isFinite(aprN) ? Number(aprN.toFixed(2)) : 0,
      cut_day: cutN,
      due_day: dueN,
      color,
    });
  }

  const titleId = "card-modal-title";
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
            {editing ? "Editar tarjeta" : "Nueva tarjeta"}
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
          {/* Preview */}
          <div
            className="rounded-xl p-4 text-white font-body"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -20)} 100%)`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
              Tarjeta
            </p>
            <p className="font-display italic text-lg mt-1 truncate">
              {name || "Alias"}
            </p>
            <div className="mt-6 flex items-end justify-between">
              <p className="font-mono text-[11px] tracking-[0.3em] opacity-80">
                •••• {last4 || "0000"}
              </p>
              <p className="font-body text-xs opacity-80">
                ${limit ? Number(limit).toLocaleString("es-MX") : "0"}
              </p>
            </div>
          </div>

          {/* Name + last4 */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label>Alias</Label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                maxLength={40}
                placeholder="Ej. BBVA Oro"
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                className={inputCls(nameError)}
              />
              {nameError && <ErrText>{nameError}</ErrText>}
            </div>
            <div>
              <Label>Últimos 4</Label>
              <input
                type="text"
                inputMode="numeric"
                value={last4}
                placeholder="1234"
                maxLength={4}
                onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, ""))}
                onBlur={() => setTouched(true)}
                className={inputCls(last4Error)}
              />
              {last4Error && <ErrText>{last4Error}</ErrText>}
            </div>
          </div>

          {/* Limit + balance */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Límite de crédito</Label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={limit}
                placeholder="50000"
                onChange={(e) => setLimit(e.target.value)}
                onBlur={() => setTouched(true)}
                className={inputCls(limitError)}
              />
              {limitError && <ErrText>{limitError}</ErrText>}
            </div>
            <div>
              <Label>Saldo actual (deuda)</Label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={balance}
                placeholder="0"
                onChange={(e) => setBalance(e.target.value)}
                onBlur={() => setTouched(true)}
                className={inputCls(balanceError)}
              />
              {balanceError && <ErrText>{balanceError}</ErrText>}
            </div>
          </div>

          {/* APR + days */}
          <div className="grid sm:grid-cols-3 gap-3">
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
                className={inputCls(null)}
              />
            </div>
            <div>
              <Label>Día de corte</Label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={cutDay}
                placeholder="15"
                onChange={(e) => setCutDay(e.target.value)}
                onBlur={() => setTouched(true)}
                className={inputCls(cutError)}
              />
              {cutError && <ErrText>{cutError}</ErrText>}
            </div>
            <div>
              <Label>Día de pago</Label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={dueDay}
                placeholder="5"
                onChange={(e) => setDueDay(e.target.value)}
                onBlur={() => setTouched(true)}
                className={inputCls(dueError)}
              />
              {dueError && <ErrText>{dueError}</ErrText>}
            </div>
          </div>

          {/* Color */}
          <div>
            <Label>Color</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => {
                const active = c === color;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setColor(c)}
                    className={clsx(
                      "w-8 h-8 rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      active ? "ring-2 ring-accent scale-110" : "hover:scale-105"
                    )}
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                  />
                );
              })}
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

/** Ajuste lineal simple de luminosidad (sin depender de una lib de color).
 *  Positivo aclara, negativo oscurece. */
function shade(hex: string, pct: number): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.max(0, Math.min(255, parseInt(n.slice(0, 2), 16) + pct));
  const g = Math.max(0, Math.min(255, parseInt(n.slice(2, 4), 16) + pct));
  const b = Math.max(0, Math.min(255, parseInt(n.slice(4, 6), 16) + pct));
  return (
    "#" +
    [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  );
}
