"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Pencil,
  Trash2,
  Repeat,
  Tv,
  CalendarClock,
  CheckCircle2,
  Pause,
  X as XIcon,
  ExternalLink,
} from "lucide-react";
import { clsx } from "clsx";
import {
  useRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  useFinanceCategories,
  useAccounts,
  useCreateTransaction,
} from "../../../../hooks/useFinance";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { formatMoney } from "../../../../lib/finance";
import {
  nextRecurringOccurrence,
  nextSubscriptionRenewal,
  daysUntil,
  monthlySubscriptionsTotal,
  cadenceLabel,
} from "../../../../lib/finance/recurring";
import type {
  FinanceRecurring,
  FinanceSubscription,
  CreateRecurringInput,
  CreateSubscriptionInput,
  SubscriptionStatus,
} from "@estoicismo/supabase";

const RecurringModal = dynamic(
  () =>
    import("../../../../components/finanzas/RecurringModal").then(
      (m) => m.RecurringModal
    ),
  { ssr: false }
);
const SubscriptionModal = dynamic(
  () =>
    import("../../../../components/finanzas/SubscriptionModal").then(
      (m) => m.SubscriptionModal
    ),
  { ssr: false }
);

export function RecurrentesClient() {
  const [tab, setTab] = useState<"recurring" | "subscriptions">("recurring");
  const { data: recurring = [] } = useRecurring();
  const { data: subscriptions = [] } = useSubscriptions();
  const { data: categories = [] } = useFinanceCategories();
  const { data: accounts = [] } = useAccounts();

  const createR = useCreateRecurring();
  const updateR = useUpdateRecurring();
  const deleteR = useDeleteRecurring();
  const createS = useCreateSubscription();
  const updateS = useUpdateSubscription();
  const deleteS = useDeleteSubscription();
  const createTx = useCreateTransaction();

  const [recModalOpen, setRecModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<FinanceRecurring | null>(null);
  const [confirmDelRec, setConfirmDelRec] = useState<FinanceRecurring | null>(null);

  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<FinanceSubscription | null>(null);
  const [confirmDelSub, setConfirmDelSub] = useState<FinanceSubscription | null>(null);

  const subStats = useMemo(() => monthlySubscriptionsTotal(subscriptions), [subscriptions]);
  const currency = subscriptions[0]?.currency ?? recurring[0]?.currency ?? "MXN";

  // Total mensual estimado de TODOS los recurrentes (normalizando cadence)
  const recurringMonthlyByKind = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const r of recurring) {
      if (!r.is_active) continue;
      let monthly = Number(r.amount);
      if (r.cadence === "weekly") monthly *= 4;
      if (r.cadence === "biweekly") monthly *= 2;
      if (r.cadence === "yearly") monthly = monthly / 12;
      if (r.kind === "income") income += monthly;
      else expense += monthly;
    }
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
    };
  }, [recurring]);

  async function handleMaterializeRecurring(r: FinanceRecurring) {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await createTx.mutateAsync({
        amount: r.amount,
        kind: r.kind,
        category_id: r.category_id,
        account_id: r.account_id ?? undefined,
        recurring_id: r.id,
        currency: r.currency,
        occurred_on: today,
        note: `Auto: ${r.name}`,
        source: "manual",
      });
    } catch {
      /* hooks toastean */
    }
  }

  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Finanzas · Recurrencias
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            Lo que entra y sale automático.
          </h1>
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            <Stat
              label="Ingresos/mes"
              value={formatMoney(recurringMonthlyByKind.income, currency)}
              tone="success"
            />
            <Stat
              label="Gastos fijos/mes"
              value={formatMoney(recurringMonthlyByKind.expense, currency)}
              tone="danger"
            />
            <Stat
              label="Suscripciones/mes"
              value={formatMoney(subStats.total, currency)}
              tone="warn"
            />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-line">
          <Tab
            active={tab === "recurring"}
            onClick={() => setTab("recurring")}
            icon={<Repeat size={13} />}
            label={`Recurrencias (${recurring.length})`}
          />
          <Tab
            active={tab === "subscriptions"}
            onClick={() => setTab("subscriptions")}
            icon={<Tv size={13} />}
            label={`Suscripciones (${subscriptions.length})`}
          />
        </div>

        {tab === "recurring" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-muted italic">
                Plantillas de transacciones que se repiten. Click "Registrar" para crear la transacción del mes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingRec(null);
                  setRecModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus size={12} /> Nueva
              </button>
            </div>
            {recurring.length === 0 ? (
              <EmptyState
                icon={<Repeat size={28} className="text-muted" />}
                title="Sin recurrencias"
                desc="Renta, salario, gym, internet… registra lo que se repite."
              />
            ) : (
              <ul className="space-y-2">
                {recurring.map((r) => (
                  <RecurringRow
                    key={r.id}
                    rec={r}
                    onEdit={() => {
                      setEditingRec(r);
                      setRecModalOpen(true);
                    }}
                    onDelete={() => setConfirmDelRec(r)}
                    onTogglePause={() =>
                      updateR.mutate({ id: r.id, input: { is_active: !r.is_active } })
                    }
                    onMaterialize={() => handleMaterializeRecurring(r)}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "subscriptions" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-muted italic">
                Servicios con renovación automática. Marca lo que pagas — pueden parar de tener sentido.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingSub(null);
                  setSubModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus size={12} /> Nueva
              </button>
            </div>
            {subscriptions.length === 0 ? (
              <EmptyState
                icon={<Tv size={28} className="text-muted" />}
                title="Sin suscripciones"
                desc="Netflix, Spotify, gym, software… si renueva sin que lo decidas, va aquí."
              />
            ) : (
              <ul className="space-y-2">
                {subscriptions.map((s) => (
                  <SubscriptionRow
                    key={s.id}
                    sub={s}
                    onEdit={() => {
                      setEditingSub(s);
                      setSubModalOpen(true);
                    }}
                    onDelete={() => setConfirmDelSub(s)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <RecurringModal
        open={recModalOpen}
        recurring={editingRec}
        categories={categories}
        accounts={accounts}
        saving={createR.isPending || updateR.isPending}
        onClose={() => {
          setRecModalOpen(false);
          setEditingRec(null);
        }}
        onSave={async (input: CreateRecurringInput) => {
          try {
            if (editingRec) await updateR.mutateAsync({ id: editingRec.id, input });
            else await createR.mutateAsync(input);
            setRecModalOpen(false);
            setEditingRec(null);
          } catch {
            /* hooks toastean */
          }
        }}
      />
      <SubscriptionModal
        open={subModalOpen}
        subscription={editingSub}
        categories={categories}
        saving={createS.isPending || updateS.isPending}
        onClose={() => {
          setSubModalOpen(false);
          setEditingSub(null);
        }}
        onSave={async (input: CreateSubscriptionInput) => {
          try {
            if (editingSub) await updateS.mutateAsync({ id: editingSub.id, input });
            else await createS.mutateAsync(input);
            setSubModalOpen(false);
            setEditingSub(null);
          } catch {
            /* hooks toastean */
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmDelRec}
        title="¿Eliminar recurrencia?"
        description="Borra la plantilla. Las transacciones que ya se materializaron no se afectan."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelRec(null)}
        onConfirm={async () => {
          if (confirmDelRec) await deleteR.mutateAsync(confirmDelRec.id);
          setConfirmDelRec(null);
        }}
      />
      <ConfirmDialog
        open={!!confirmDelSub}
        title="¿Eliminar suscripción?"
        description="No cancela el servicio en el proveedor — sólo borra el registro local."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelSub(null)}
        onConfirm={async () => {
          if (confirmDelSub) await deleteS.mutateAsync(confirmDelSub.id);
          setConfirmDelSub(null);
        }}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "warn" | "danger" }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">{label}</p>
      <p
        className={clsx(
          "text-base font-semibold",
          tone === "success" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : tone === "danger" ? "text-red-300" : "text-white"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Tab(props: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={clsx(
        "px-3 py-2 -mb-px border-b-2 text-[12px] font-mono uppercase tracking-widest inline-flex items-center gap-1.5 transition-colors",
        props.active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
      )}
    >
      {props.icon}
      {props.label}
    </button>
  );
}

function EmptyState(props: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-card border border-dashed border-line p-8 text-center space-y-2">
      <div className="mx-auto">{props.icon}</div>
      <p className="text-sm text-ink font-semibold">{props.title}</p>
      <p className="text-[12px] text-muted">{props.desc}</p>
    </div>
  );
}

function RecurringRow(props: {
  rec: FinanceRecurring;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePause: () => void;
  onMaterialize: () => void;
}) {
  const { rec, onEdit, onDelete, onTogglePause, onMaterialize } = props;
  const next = rec.is_active ? nextRecurringOccurrence(rec) : null;
  const days = next ? daysUntil(next) : null;

  return (
    <li
      className={clsx(
        "rounded-card border p-3 flex items-center gap-3 group",
        rec.is_active ? "border-line bg-bg-alt/40" : "border-line/40 bg-bg-alt/20 opacity-70"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-sm font-semibold text-ink truncate">{rec.name}</p>
          <span
            className={clsx(
              "text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded",
              rec.kind === "income" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
            )}
          >
            {rec.kind === "income" ? "ingreso" : "gasto"}
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted">
            {cadenceLabel(rec.cadence)}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p
            className={clsx(
              "font-display italic text-lg",
              rec.kind === "income" ? "text-success" : "text-ink"
            )}
          >
            {formatMoney(Number(rec.amount), rec.currency)}
          </p>
          {next && days !== null && (
            <p className="text-[11px] text-muted inline-flex items-center gap-1">
              <CalendarClock size={11} />
              {days === 0 ? "Hoy" : days === 1 ? "Mañana" : `En ${days}d`}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {rec.is_active && (
          <button
            type="button"
            onClick={onMaterialize}
            className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest bg-accent text-bg hover:opacity-90 inline-flex items-center gap-1"
            title="Crear la transacción de este periodo"
          >
            <Plus size={11} /> Registrar
          </button>
        )}
        <button onClick={onTogglePause} className="p-1.5 text-muted hover:text-ink rounded">
          {rec.is_active ? <Pause size={13} /> : <CheckCircle2 size={13} />}
        </button>
        <button onClick={onEdit} className="p-1.5 text-muted hover:text-ink rounded">
          <Pencil size={13} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-muted hover:text-danger rounded">
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}

function SubscriptionRow(props: {
  sub: FinanceSubscription;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { sub, onEdit, onDelete } = props;
  const next = nextSubscriptionRenewal(sub);
  const days = next ? daysUntil(next) : null;
  const isCancelled = sub.status === "cancelled";
  const statusColor: Record<SubscriptionStatus, string> = {
    active: "text-success",
    trial: "text-blue-400",
    paused: "text-amber-400",
    cancelled: "text-muted",
  };

  return (
    <li
      className={clsx(
        "rounded-card border p-3 flex items-center gap-3 group",
        isCancelled ? "border-line/40 bg-bg-alt/20 opacity-60" : "border-line bg-bg-alt/40"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p
            className={clsx(
              "text-sm font-semibold truncate",
              isCancelled ? "text-muted line-through" : "text-ink"
            )}
          >
            {sub.name}
          </p>
          <span
            className={clsx(
              "text-[9px] font-mono uppercase tracking-widest",
              statusColor[sub.status]
            )}
          >
            {sub.status === "active"
              ? "Activa"
              : sub.status === "trial"
              ? "Trial"
              : sub.status === "paused"
              ? "Pausa"
              : "Cancelada"}
          </span>
          <span className="text-[9px] font-mono text-muted">
            {cadenceLabel(sub.cadence)}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="font-display italic text-lg text-ink">
            {formatMoney(Number(sub.amount), sub.currency)}
          </p>
          {next && days !== null && !isCancelled && (
            <p
              className={clsx(
                "text-[11px] inline-flex items-center gap-1",
                days <= 3 ? "text-orange-400" : "text-muted"
              )}
            >
              <CalendarClock size={11} />
              {days === 0
                ? "Renueva hoy"
                : days < 0
                ? `Renovó hace ${Math.abs(days)}d`
                : days === 1
                ? "Renueva mañana"
                : `Renueva en ${days}d`}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {sub.service_url && (
          <a
            href={sub.service_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-muted hover:text-ink rounded"
            title="Abrir servicio"
          >
            <ExternalLink size={13} />
          </a>
        )}
        <button onClick={onEdit} className="p-1.5 text-muted hover:text-ink rounded">
          <Pencil size={13} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-muted hover:text-danger rounded">
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}
