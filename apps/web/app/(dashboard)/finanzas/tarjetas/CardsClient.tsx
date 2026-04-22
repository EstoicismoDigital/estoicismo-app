"use client";
import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { clsx } from "clsx";
import type {
  FinanceCreditCard,
  CreateCreditCardInput,
} from "@estoicismo/supabase";
import {
  useCreditCards,
  useCreateCreditCard,
  useUpdateCreditCard,
  useDeleteCreditCard,
} from "../../../../hooks/useFinance";
import {
  formatMoney,
  cardUtilization,
  utilizationLevel,
  nextDueDate,
  daysUntil,
} from "../../../../lib/finance";
import { CardModal } from "../../../../components/finanzas/CardModal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { FinanceAdvice } from "../../../../components/finanzas/FinanceAdvice";

/**
 * CRUD de tarjetas de crédito con tablero de utilización.
 *
 * - Cada tarjeta muestra alias, últimos 4, saldo vs límite, barra de uso,
 *   y próximo pago (si due_day está definido).
 * - El "borrado" en realidad archiva la tarjeta para preservar el historial
 *   de transacciones ligadas.
 */
export function CardsClient() {
  const { data: cards = [], isLoading } = useCreditCards();
  const createM = useCreateCreditCard();
  const updateM = useUpdateCreditCard();
  const deleteM = useDeleteCreditCard();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceCreditCard | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<FinanceCreditCard | null>(
    null
  );

  const totals = useMemo(() => {
    let limit = 0;
    let balance = 0;
    for (const c of cards) {
      limit += Number(c.credit_limit) || 0;
      balance += Number(c.current_balance) || 0;
    }
    return {
      limit,
      balance,
      available: Math.max(0, limit - balance),
      utilization: cardUtilization(balance, limit),
    };
  }, [cards]);

  async function handleSave(input: CreateCreditCardInput) {
    try {
      if (editing) {
        await updateM.mutateAsync({ id: editing.id, input });
      } else {
        await createM.mutateAsync(input);
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      /* toast in hook */
    }
  }

  async function handleArchive() {
    if (!confirmArchive) return;
    try {
      await deleteM.mutateAsync(confirmArchive.id);
    } finally {
      setConfirmArchive(null);
    }
  }

  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Finanzas · Tarjetas
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            Lo que debes, claro a la vista.
          </h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Totales */}
        {cards.length > 0 && (
          <section className="rounded-card border border-line bg-bg-alt/40 p-5 grid grid-cols-3 gap-3">
            <Total label="Límite" value={totals.limit} />
            <Total label="Saldo" value={totals.balance} tone="danger" />
            <Total label="Disponible" value={totals.available} tone="success" />
            <div className="col-span-3 mt-1">
              <UtilizationBar value={totals.utilization} />
            </div>
          </section>
        )}

        {/* Header + botón */}
        <div className="flex items-center justify-between">
          <h2 className="font-display italic text-xl text-ink">Mis tarjetas</h2>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-full bg-accent text-white font-body text-[12px] font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus size={14} aria-hidden />
            Añadir
          </button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <CardListSkeleton />
        ) : cards.length === 0 ? (
          <EmptyState onAdd={() => setModalOpen(true)} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2" role="list">
            {cards.map((c) => (
              <CardTile
                key={c.id}
                card={c}
                onEdit={() => {
                  setEditing(c);
                  setModalOpen(true);
                }}
                onArchive={() => setConfirmArchive(c)}
              />
            ))}
          </ul>
        )}

        <FinanceAdvice tag="debt" />
      </div>

      <CardModal
        open={modalOpen}
        editing={editing}
        saving={createM.isPending || updateM.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmArchive}
        title="¿Archivar esta tarjeta?"
        description="El historial de transacciones se conserva. Puedes volver a darla de alta después."
        confirmLabel="Archivar"
        destructive
        onCancel={() => setConfirmArchive(null)}
        onConfirm={handleArchive}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────

function CardTile({
  card,
  onEdit,
  onArchive,
}: {
  card: FinanceCreditCard;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const util = cardUtilization(
    Number(card.current_balance) || 0,
    Number(card.credit_limit) || 0
  );
  const level = utilizationLevel(util);
  const tone =
    level === "healthy"
      ? "text-success"
      : level === "warning"
      ? "text-[rgb(217_119_6)]"
      : "text-danger";
  const bar =
    level === "healthy"
      ? "bg-success"
      : level === "warning"
      ? "bg-[rgb(217_119_6)]"
      : "bg-danger";

  const next = card.due_day ? nextDueDate(card.due_day) : null;
  const daysLeft = next ? daysUntil(next) : null;

  return (
    <li className="rounded-card border border-line bg-bg overflow-hidden">
      <div
        className="p-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, ${shade(
            card.color,
            -25
          )} 100%)`,
        }}
      >
        <div className="flex items-start justify-between mb-6 gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
              Tarjeta
            </p>
            <p className="font-display italic text-lg truncate">{card.name}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label="Editar tarjeta"
              className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Pencil size={13} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onArchive}
              aria-label="Archivar tarjeta"
              className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Trash2 size={13} aria-hidden />
            </button>
          </div>
        </div>
        <p className="font-mono text-[11px] tracking-[0.3em] opacity-80">
          •••• {card.last4 ?? "····"}
        </p>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-body text-xs text-muted">Saldo / Límite</p>
            <p className={clsx("font-body text-xs font-medium", tone)}>
              {Math.round(util * 100)}% usado
            </p>
          </div>
          <p className="font-body text-[13px] text-ink tabular-nums mt-0.5">
            <span className={tone}>
              {formatMoney(Number(card.current_balance) || 0, card.currency)}
            </span>
            <span className="text-muted">
              {" "}
              / {formatMoney(Number(card.credit_limit) || 0, card.currency)}
            </span>
          </p>
          <div className="mt-1.5 h-1.5 bg-line rounded-full overflow-hidden">
            <div
              className={clsx("h-full rounded-full transition-all duration-500", bar)}
              style={{ width: `${Math.max(2, util * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between font-body text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted">
            {next && daysLeft != null ? (
              <>
                <CalendarIcon size={12} aria-hidden />
                Paga{" "}
                {daysLeft <= 0
                  ? "hoy"
                  : daysLeft === 1
                  ? "mañana"
                  : `en ${daysLeft} días`}
              </>
            ) : (
              <span className="opacity-60">Configura día de pago</span>
            )}
          </span>
          {level === "danger" && (
            <span className="inline-flex items-center gap-1 text-danger font-medium">
              <AlertCircle size={12} aria-hidden />
              Uso alto
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function Total({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "danger"
      ? "text-danger"
      : "text-ink";
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className={clsx("font-body text-[15px] font-medium tabular-nums", color)}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

function UtilizationBar({ value }: { value: number }) {
  const level = utilizationLevel(value);
  const bar =
    level === "healthy"
      ? "bg-success"
      : level === "warning"
      ? "bg-[rgb(217_119_6)]"
      : "bg-danger";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Uso total
        </p>
        <p className="font-body text-xs text-ink">{Math.round(value * 100)}%</p>
      </div>
      <div className="h-1.5 bg-line rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", bar)}
          style={{ width: `${Math.max(2, value * 100)}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-bg-alt/40 p-6 text-center">
      <p className="font-display italic text-lg text-ink">Sin tarjetas todavía</p>
      <p className="font-body text-sm text-muted mt-1 max-w-prose mx-auto">
        Añade tus tarjetas (sin el número completo — solo alias y últimos 4) y podrás
        ver su utilización y planear pagos.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 h-10 px-4 rounded-lg bg-accent text-white font-body text-sm font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex items-center gap-2"
      >
        <Plus size={14} aria-hidden /> Añadir tarjeta
      </button>
    </div>
  );
}

function CardListSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: 2 }).map((_, i) => (
        <li
          key={i}
          className="rounded-card border border-line bg-bg overflow-hidden h-[220px] animate-pulse"
        >
          <div className="h-28 bg-bg-alt" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-1/2 bg-bg-alt rounded" />
            <div className="h-3 w-1/3 bg-bg-alt rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function shade(hex: string, pct: number): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.max(0, Math.min(255, parseInt(n.slice(0, 2), 16) + pct));
  const g = Math.max(0, Math.min(255, parseInt(n.slice(2, 4), 16) + pct));
  const b = Math.max(0, Math.min(255, parseInt(n.slice(4, 6), 16) + pct));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
