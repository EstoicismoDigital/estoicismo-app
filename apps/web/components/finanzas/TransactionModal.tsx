"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Mic, MicOff, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { clsx } from "clsx";
import type {
  FinanceCategory,
  FinanceKind,
  FinanceTransaction,
  CreateTransactionInput,
} from "@estoicismo/supabase";
import { parseVoiceTransaction } from "../../lib/finance";

/**
 * Modal para crear o editar un movimiento.
 *
 * Diseño:
 *  - Monto primero y XL — es el dato más importante.
 *  - Botón de voz al lado del monto: dispara Web Speech API (es-ES),
 *    parsea monto + categoría + kind del dictado. Si el navegador no
 *    soporta reconocimiento, el botón se oculta en vez de mostrar error.
 *  - Toggle Ingreso/Gasto grande, accesible por teclado.
 *  - Categorías como chips seleccionables, filtradas por kind.
 *  - Fecha default hoy; nota opcional.
 *
 * A11y:
 *  - Focus trap tipo ConfirmDialog
 *  - ESC cierra
 *  - aria-live region para feedback de voz
 */

type SpeechRec =
  | (new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      start: () => void;
      stop: () => void;
      abort: () => void;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: ((e: { error: string }) => void) | null;
      onend: (() => void) | null;
    })
  | undefined;

function getSpeechRecognition(): SpeechRec {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRec;
}

export type TransactionDraft = {
  amount: number;
  kind: FinanceKind;
  category_id: string | null;
  occurred_on: string;
  note: string | null;
  credit_card_id?: string | null;
};

export function TransactionModal({
  open,
  editing,
  categories,
  defaultKind = "expense",
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing?: FinanceTransaction | null;
  categories: FinanceCategory[];
  defaultKind?: FinanceKind;
  saving?: boolean;
  onClose: () => void;
  onSave: (draft: CreateTransactionInput) => void | Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  const [kind, setKind] = useState<FinanceKind>(defaultKind);
  const [amountText, setAmountText] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [occurredOn, setOccurredOn] = useState(() => todayIso());
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);

  // Voice state
  const [listening, setListening] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState<string | null>(null);
  const recRef = useRef<InstanceType<NonNullable<SpeechRec>> | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => setMounted(true), []);

  // Seed state on open
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    if (editing) {
      setKind(editing.kind);
      setAmountText(String(editing.amount));
      setCategoryId(editing.category_id);
      setOccurredOn(editing.occurred_on);
      setNote(editing.note ?? "");
    } else {
      setKind(defaultKind);
      setAmountText("");
      setCategoryId(null);
      setOccurredOn(todayIso());
      setNote("");
    }
    setTouched(false);
    setVoiceMsg(null);
    const focusTimer = window.setTimeout(
      () => amountRef.current?.focus(),
      30
    );
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, editing, defaultKind]);

  // Esc + focus trap
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Stop voice rec on close
  useEffect(() => {
    if (!open && recRef.current) {
      recRef.current.abort();
      recRef.current = null;
      setListening(false);
    }
  }, [open]);

  if (!mounted || !open) return null;

  const speechCtor = getSpeechRecognition();
  const canUseVoice = !!speechCtor;

  function handleVoiceClick() {
    if (!speechCtor) return;
    if (listening && recRef.current) {
      recRef.current.stop();
      return;
    }
    try {
      const rec = new speechCtor();
      rec.lang = "es-ES";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map((r) => r[0]?.transcript ?? "")
          .join(" ")
          .trim();
        if (transcript) handleVoiceTranscript(transcript);
      };
      rec.onerror = (e) => {
        setVoiceMsg(
          e.error === "not-allowed"
            ? "Permite el micrófono para dictar."
            : "No pude escucharte. Intenta de nuevo."
        );
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
        recRef.current = null;
      };
      recRef.current = rec;
      setVoiceMsg("Escuchando…");
      setListening(true);
      rec.start();
    } catch {
      setVoiceMsg("Este navegador no soporta dictado.");
    }
  }

  function handleVoiceTranscript(text: string) {
    const parsed = parseVoiceTransaction(text, categories);
    setKind(parsed.kind);
    if (parsed.amount !== undefined) {
      setAmountText(String(parsed.amount));
    }
    if (parsed.category) {
      setCategoryId(parsed.category.id);
    }
    setNote((prev) => (prev ? prev + " · " + text : text));
    setVoiceMsg(
      parsed.amount !== undefined
        ? `Entendí: ${parsed.amount} ${parsed.kind === "income" ? "ingreso" : "gasto"}${parsed.category ? " · " + parsed.category.name : ""}`
        : "Entendí tu dictado pero no el monto. Ajústalo."
    );
  }

  const amountNumber = parseAmount(amountText);
  const amountError = touched && (!amountNumber || amountNumber <= 0)
    ? "Escribe un monto mayor a 0."
    : null;
  const canSave =
    !!amountNumber && amountNumber > 0 && !!occurredOn && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSave || !amountNumber) return;
    const draft: CreateTransactionInput = {
      amount: Number(amountNumber.toFixed(2)),
      kind,
      category_id: categoryId,
      occurred_on: occurredOn,
      note: note.trim() ? note.trim() : null,
      source: "manual",
    };
    await onSave(draft);
  }

  const kindCats = categories.filter((c) => c.kind === kind);
  const titleId = "tx-modal-title";

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
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm px-5 sm:px-6 py-4 flex items-center justify-between border-b border-line">
          <h2 id={titleId} className="font-display italic text-xl sm:text-2xl text-ink">
            {editing ? "Editar movimiento" : "Nuevo movimiento"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-ink hover:bg-bg-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          {/* Kind toggle */}
          <div
            role="group"
            aria-label="Tipo de movimiento"
            className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-bg-alt"
          >
            <button
              type="button"
              onClick={() => setKind("expense")}
              aria-pressed={kind === "expense"}
              className={clsx(
                "h-11 rounded-lg font-body text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-all duration-150",
                kind === "expense"
                  ? "bg-bg text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              )}
            >
              <ArrowDownCircle size={16} aria-hidden />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setKind("income")}
              aria-pressed={kind === "income"}
              className={clsx(
                "h-11 rounded-lg font-body text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-all duration-150",
                kind === "income"
                  ? "bg-bg text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              )}
            >
              <ArrowUpCircle size={16} aria-hidden />
              Ingreso
            </button>
          </div>

          {/* Amount + voice */}
          <div>
            <label
              htmlFor="tx-amount"
              className="font-mono text-[10px] uppercase tracking-widest text-muted"
            >
              Monto
            </label>
            <div className="mt-1 flex items-stretch gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display italic text-2xl text-muted pointer-events-none">
                  $
                </span>
                <input
                  ref={amountRef}
                  id="tx-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  onBlur={() => setTouched(true)}
                  className={clsx(
                    "w-full h-14 pl-8 pr-3 rounded-xl border bg-bg-alt font-display italic text-2xl text-ink tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors",
                    amountError
                      ? "border-danger/60"
                      : "border-line focus:border-accent"
                  )}
                  aria-invalid={!!amountError}
                  aria-describedby={amountError ? "tx-amount-err" : undefined}
                />
              </div>
              {canUseVoice && (
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  aria-pressed={listening}
                  aria-label={listening ? "Detener dictado" : "Dictar movimiento por voz"}
                  className={clsx(
                    "h-14 w-14 rounded-xl inline-flex items-center justify-center border transition-colors",
                    listening
                      ? "bg-accent text-bg border-accent animate-pulse"
                      : "bg-bg-alt text-ink border-line hover:border-accent hover:text-accent"
                  )}
                >
                  {listening ? <MicOff size={20} aria-hidden /> : <Mic size={20} aria-hidden />}
                </button>
              )}
            </div>
            {amountError && (
              <p id="tx-amount-err" className="mt-1 font-body text-xs text-danger">
                {amountError}
              </p>
            )}
            <p
              aria-live="polite"
              className="mt-1 min-h-[1.1em] font-body text-[11px] text-muted"
            >
              {voiceMsg ?? (canUseVoice ? "Toca el micrófono para dictar: 'gasté 350 en comida'." : "")}
            </p>
          </div>

          {/* Categories */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Categoría
            </label>
            <ul className="mt-2 flex flex-wrap gap-1.5" role="listbox" aria-label="Categorías">
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={categoryId === null}
                  onClick={() => setCategoryId(null)}
                  className={clsx(
                    "px-3 h-9 rounded-full border font-body text-[12px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    categoryId === null
                      ? "bg-ink text-bg border-ink"
                      : "border-line text-muted hover:text-ink hover:border-accent/50"
                  )}
                >
                  Sin categoría
                </button>
              </li>
              {kindCats.map((c) => {
                const active = c.id === categoryId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setCategoryId(c.id)}
                      className={clsx(
                        "px-3 h-9 rounded-full border font-body text-[12px] inline-flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        active
                          ? "border-accent text-ink bg-accent/10"
                          : "border-line text-muted hover:text-ink hover:border-accent/50"
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: c.color }}
                        aria-hidden
                      />
                      {c.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Date + note */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-date"
                className="font-mono text-[10px] uppercase tracking-widest text-muted"
              >
                Fecha
              </label>
              <input
                id="tx-date"
                type="date"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-line bg-bg-alt font-body text-[14px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
              />
            </div>
            <div>
              <label
                htmlFor="tx-note"
                className="font-mono text-[10px] uppercase tracking-widest text-muted"
              >
                Nota <span className="text-muted/70 normal-case tracking-normal">(opcional)</span>
              </label>
              <input
                id="tx-note"
                type="text"
                placeholder="Ej. comida con Sofía"
                value={note}
                maxLength={140}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-line bg-bg-alt font-body text-[14px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-bg/95 backdrop-blur-sm border-t border-line px-5 sm:px-6 py-3 flex items-center justify-between gap-2">
          <p className="font-body text-xs text-muted">
            {amountNumber && amountNumber > 0 ? (
              <>
                Vas a registrar{" "}
                <span className="text-ink font-medium">
                  {kind === "income" ? "+" : "−"}${amountNumber.toFixed(2)}
                </span>
              </>
            ) : (
              "Monto y fecha son requeridos."
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="h-11 px-5 rounded-lg font-body font-medium text-sm text-white bg-accent hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" aria-hidden />}
              {editing ? "Guardar" : "Añadir"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  return createPortal(node, document.body);
}

// ─── helpers ──────────────────────────────────────────────────

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Permite entradas como "350", "350.50", "1,500.00", "1.500,00".
 * Coma antes de 3 dígitos al final se trata como miles; coma antes de
 * 1-2 dígitos se trata como decimal.
 */
function parseAmount(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  // Si hay punto y coma, asumir latino: . miles, , decimal
  if (t.includes(",") && t.includes(".")) {
    const norm = t.replace(/\./g, "").replace(",", ".");
    const n = Number.parseFloat(norm);
    return Number.isFinite(n) ? n : undefined;
  }
  // Solo coma — puede ser decimal o miles
  if (t.includes(",") && !t.includes(".")) {
    const afterComma = t.split(",").pop() ?? "";
    const norm =
      afterComma.length <= 2 && !/^\d{3}$/.test(afterComma)
        ? t.replace(",", ".")
        : t.replace(/,/g, "");
    const n = Number.parseFloat(norm);
    return Number.isFinite(n) ? n : undefined;
  }
  // Solo punto o solo dígitos
  const n = Number.parseFloat(t.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

