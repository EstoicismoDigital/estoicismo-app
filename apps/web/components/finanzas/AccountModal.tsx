"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type {
  FinanceAccount,
  FinanceAccountKind,
  CreateAccountInput,
} from "@estoicismo/supabase";

const KINDS: { key: FinanceAccountKind; label: string; emoji: string; defaultColor: string }[] = [
  { key: "cash", label: "Efectivo", emoji: "💵", defaultColor: "#22774E" },
  { key: "checking", label: "Cuenta corriente", emoji: "🏦", defaultColor: "#0EA5E9" },
  { key: "savings", label: "Ahorros", emoji: "🐖", defaultColor: "#7C3AED" },
  { key: "investment", label: "Inversión", emoji: "📈", defaultColor: "#CA8A04" },
  { key: "crypto", label: "Cripto", emoji: "₿", defaultColor: "#F97316" },
  { key: "other", label: "Otra", emoji: "🪙", defaultColor: "#6B7280" },
];

export function AccountModal(props: {
  open: boolean;
  account?: FinanceAccount | null;
  onClose: () => void;
  onSave: (input: CreateAccountInput) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, account, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [name, setName] = useState(account?.name ?? "");
  const [kind, setKind] = useState<FinanceAccountKind>(account?.kind ?? "cash");
  const [balance, setBalance] = useState(
    account?.current_balance !== undefined ? String(account.current_balance) : "0"
  );
  const [includeNw, setIncludeNw] = useState(account?.include_in_net_worth ?? true);
  const [notes, setNotes] = useState(account?.notes ?? "");
  const [color, setColor] = useState(account?.color ?? KINDS[0].defaultColor);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setKind(account?.kind ?? "cash");
    setBalance(account?.current_balance !== undefined ? String(account.current_balance) : "0");
    setIncludeNw(account?.include_in_net_worth ?? true);
    setNotes(account?.notes ?? "");
    setColor(account?.color ?? KINDS[0].defaultColor);
  }, [open, account]);

  // Si cambia kind y no hay color custom, usa el default del kind
  useEffect(() => {
    if (!account) {
      const k = KINDS.find((x) => x.key === kind);
      if (k) setColor(k.defaultColor);
    }
  }, [kind, account]);

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
          <h2 className="font-display italic text-lg text-ink">
            {account ? "Editar cuenta" : "Nueva cuenta"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="BBVA Débito · Efectivo · Cetes Cetes…"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {KINDS.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => setKind(k.key)}
                  className={clsx(
                    "py-2 rounded-lg border text-[11px] inline-flex flex-col items-center gap-0.5 transition-colors",
                    kind === k.key
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  <span className="text-base">{k.emoji}</span>
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Saldo actual
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full bg-bg border-2 border-line focus:border-accent rounded-lg px-3 py-3 text-2xl font-display italic text-ink focus:outline-none"
            />
          </div>
          <label className="flex items-start gap-2 cursor-pointer p-2 -mx-2 rounded hover:bg-line/30">
            <input
              type="checkbox"
              checked={includeNw}
              onChange={(e) => setIncludeNw(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div className="text-[11px]">
              <p className="text-ink font-semibold">Incluir en net worth</p>
              <p className="text-muted">
                El saldo cuenta para calcular tu patrimonio neto.
              </p>
            </div>
          </label>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink resize-none focus:outline-none focus:border-accent"
            />
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
            disabled={!name.trim() || saving}
            onClick={async () => {
              if (!name.trim()) return;
              await onSave({
                name: name.trim(),
                kind,
                current_balance: Number(balance) || 0,
                include_in_net_worth: includeNw,
                color,
                notes: notes.trim() || null,
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
