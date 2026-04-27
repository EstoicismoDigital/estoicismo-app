"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type {
  FinanceSubscription,
  SubscriptionCadence,
  SubscriptionStatus,
  CreateSubscriptionInput,
  FinanceCategory,
} from "@estoicismo/supabase";

const CADENCES: { key: SubscriptionCadence; label: string }[] = [
  { key: "monthly", label: "Mensual" },
  { key: "quarterly", label: "Trimestral" },
  { key: "yearly", label: "Anual" },
];

const STATUSES: { key: SubscriptionStatus; label: string; color: string }[] = [
  { key: "active", label: "Activa", color: "#22774E" },
  { key: "trial", label: "Trial", color: "#0EA5E9" },
  { key: "paused", label: "En pausa", color: "#CA8A04" },
  { key: "cancelled", label: "Cancelada", color: "#6B7280" },
];

export function SubscriptionModal(props: {
  open: boolean;
  subscription?: FinanceSubscription | null;
  categories: FinanceCategory[];
  onClose: () => void;
  onSave: (input: CreateSubscriptionInput) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, subscription, categories, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [name, setName] = useState(subscription?.name ?? "");
  const [vendor, setVendor] = useState(subscription?.vendor ?? "");
  const [amount, setAmount] = useState(
    subscription?.amount ? String(subscription.amount) : ""
  );
  const [cadence, setCadence] = useState<SubscriptionCadence>(subscription?.cadence ?? "monthly");
  const [renewalDay, setRenewalDay] = useState(
    subscription?.renewal_day ? String(subscription.renewal_day) : "1"
  );
  const [status, setStatus] = useState<SubscriptionStatus>(subscription?.status ?? "active");
  const [trialEndsOn, setTrialEndsOn] = useState(subscription?.trial_ends_on ?? "");
  const [categoryId, setCategoryId] = useState(subscription?.category_id ?? "");
  const [serviceUrl, setServiceUrl] = useState(subscription?.service_url ?? "");
  const [notes, setNotes] = useState(subscription?.notes ?? "");

  useEffect(() => {
    if (!open) return;
    setName(subscription?.name ?? "");
    setVendor(subscription?.vendor ?? "");
    setAmount(subscription?.amount ? String(subscription.amount) : "");
    setCadence(subscription?.cadence ?? "monthly");
    setRenewalDay(subscription?.renewal_day ? String(subscription.renewal_day) : "1");
    setStatus(subscription?.status ?? "active");
    setTrialEndsOn(subscription?.trial_ends_on ?? "");
    setCategoryId(subscription?.category_id ?? "");
    setServiceUrl(subscription?.service_url ?? "");
    setNotes(subscription?.notes ?? "");
  }, [open, subscription]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const expCats = categories.filter((c) => c.kind === "expense");

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between z-10">
          <h2 className="font-display italic text-lg text-ink">
            {subscription ? "Editar suscripción" : "Nueva suscripción"}
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
              placeholder="Netflix · Spotify · ChatGPT Plus…"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              autoFocus
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

          <div className="grid grid-cols-3 gap-1">
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

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Día de renovación (1-31)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={renewalDay}
              onChange={(e) => setRenewalDay(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
              Estado
            </label>
            <div className="grid grid-cols-4 gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key)}
                  className={clsx(
                    "py-2 rounded-lg border text-[10px] font-mono uppercase tracking-widest",
                    status === s.key ? "border-current font-semibold" : "border-line text-muted hover:text-ink"
                  )}
                  style={status === s.key ? { color: s.color, backgroundColor: `${s.color}15` } : undefined}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {status === "trial" && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Trial termina el
              </label>
              <input
                type="date"
                value={trialEndsOn}
                onChange={(e) => setTrialEndsOn(e.target.value)}
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
          )}

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
              {expCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Vendor
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Netflix Inc."
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                URL para cancelar
              </label>
              <input
                type="url"
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                placeholder="https://netflix.com/account"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent text-[11px]"
              />
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
              placeholder="Dudas si vale la pena, alternativas…"
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
                vendor: vendor.trim() || null,
                amount: Number(amount),
                cadence,
                renewal_day: Number(renewalDay) || 1,
                status,
                trial_ends_on: status === "trial" ? trialEndsOn || null : null,
                category_id: categoryId || null,
                service_url: serviceUrl.trim() || null,
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
