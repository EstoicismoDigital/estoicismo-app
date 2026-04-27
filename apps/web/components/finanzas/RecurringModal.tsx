"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type {
  FinanceRecurring,
  RecurringCadence,
  CreateRecurringInput,
  FinanceCategory,
  FinanceAccount,
  FinanceKind,
} from "@estoicismo/supabase";

const CADENCES: { key: RecurringCadence; label: string }[] = [
  { key: "weekly", label: "Semanal" },
  { key: "biweekly", label: "Quincenal" },
  { key: "monthly", label: "Mensual" },
  { key: "yearly", label: "Anual" },
];

export function RecurringModal(props: {
  open: boolean;
  recurring?: FinanceRecurring | null;
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  onClose: () => void;
  onSave: (input: CreateRecurringInput) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, recurring, categories, accounts, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [name, setName] = useState(recurring?.name ?? "");
  const [amount, setAmount] = useState(recurring?.amount ? String(recurring.amount) : "");
  const [kind, setKind] = useState<FinanceKind>(recurring?.kind ?? "expense");
  const [cadence, setCadence] = useState<RecurringCadence>(recurring?.cadence ?? "monthly");
  const [dayOfPeriod, setDayOfPeriod] = useState(
    recurring?.day_of_period ? String(recurring.day_of_period) : "1"
  );
  const [categoryId, setCategoryId] = useState(recurring?.category_id ?? "");
  const [accountId, setAccountId] = useState(recurring?.account_id ?? "");
  const [notes, setNotes] = useState(recurring?.notes ?? "");

  useEffect(() => {
    if (!open) return;
    setName(recurring?.name ?? "");
    setAmount(recurring?.amount ? String(recurring.amount) : "");
    setKind(recurring?.kind ?? "expense");
    setCadence(recurring?.cadence ?? "monthly");
    setDayOfPeriod(recurring?.day_of_period ? String(recurring.day_of_period) : "1");
    setCategoryId(recurring?.category_id ?? "");
    setAccountId(recurring?.account_id ?? "");
    setNotes(recurring?.notes ?? "");
  }, [open, recurring]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const filteredCats = categories.filter((c) => c.kind === kind);
  const dayLabel = (() => {
    if (cadence === "monthly") return "Día del mes (1-31)";
    if (cadence === "yearly") return "Día del año (1-365)";
    return "Día de la semana (0=dom, 6=sáb)";
  })();
  const dayMax = cadence === "monthly" ? 31 : cadence === "yearly" ? 365 : 6;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between z-10">
          <h2 className="font-display italic text-lg text-ink">
            {recurring ? "Editar recurrencia" : "Nueva recurrencia"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind("expense")}
              className={clsx(
                "py-2 rounded-lg border text-sm",
                kind === "expense"
                  ? "border-danger bg-danger/10 text-danger font-semibold"
                  : "border-line text-muted hover:text-ink"
              )}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setKind("income")}
              className={clsx(
                "py-2 rounded-lg border text-sm",
                kind === "income"
                  ? "border-success bg-success/10 text-success font-semibold"
                  : "border-line text-muted hover:text-ink"
              )}
            >
              Ingreso
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Renta, salario, gym, Netflix…"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
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
              className="w-full bg-bg border-2 border-line focus:border-accent rounded-lg px-3 py-3 text-2xl font-display italic text-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
              Frecuencia
            </label>
            <div className="grid grid-cols-4 gap-1">
              {CADENCES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCadence(c.key)}
                  className={clsx(
                    "py-2 rounded-lg border text-[11px] font-mono",
                    cadence === c.key
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              {dayLabel}
            </label>
            <input
              type="number"
              min={cadence === "weekly" || cadence === "biweekly" ? 0 : 1}
              max={dayMax}
              value={dayOfPeriod}
              onChange={(e) => setDayOfPeriod(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Categoría
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              >
                <option value="">— Sin categoría —</option>
                {filteredCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Cuenta
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              >
                <option value="">— Sin cuenta —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
            disabled={!name.trim() || !amount || saving}
            onClick={async () => {
              if (!name.trim() || !amount) return;
              await onSave({
                name: name.trim(),
                amount: Number(amount),
                kind,
                cadence,
                day_of_period: Number(dayOfPeriod) || 1,
                category_id: categoryId || null,
                account_id: accountId || null,
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
