"use client";
import { useEffect, useMemo, useState } from "react";
import { Receipt, Check, X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import {
  useRecurring,
  useSubscriptions,
  useCreateTransaction,
} from "../../hooks/useFinance";
import { useDefaultCurrency } from "../../hooks/useDefaultCurrency";
import { findUpcomingDue, type UpcomingDue } from "../../lib/finance/upcoming";
import { formatMoney } from "../../lib/finance";

/**
 * BillsTodayPrompt · "¿pagaste tu Netflix?"
 *
 * Muestra los recurring/subscriptions que vencen HOY o están atrasados
 * (ayer/anteayer). Cada uno tiene botones [Sí, lo pagué] / [Saltar].
 *
 *   - Confirmar → crea una finance_transaction con el monto + nombre
 *     en la nota.
 *   - Saltar → marca como ignorado en localStorage para no insistir hoy.
 *
 * Si no hay nada pendiente, no renderiza.
 *
 * Reduce la fricción de "olvido qué pagué este mes" — el user solo
 * confirma con 1 toque cuando ya pagó por afuera (transferencia,
 * cargo automático, etc.) y la transacción queda registrada.
 */

const SKIP_KEY_PREFIX = "bill-skipped:";
const CONFIRM_KEY_PREFIX = "bill-confirmed:";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readDecision(billId: string, date: string): "skip" | "confirm" | null {
  if (typeof window === "undefined") return null;
  try {
    const k = `${billId}:${date}`;
    if (window.localStorage.getItem(SKIP_KEY_PREFIX + k) === "1") return "skip";
    if (window.localStorage.getItem(CONFIRM_KEY_PREFIX + k) === "1")
      return "confirm";
    return null;
  } catch {
    return null;
  }
}

function writeDecision(
  billId: string,
  date: string,
  decision: "skip" | "confirm"
): void {
  if (typeof window === "undefined") return;
  try {
    const k = `${billId}:${date}`;
    window.localStorage.setItem(
      (decision === "skip" ? SKIP_KEY_PREFIX : CONFIRM_KEY_PREFIX) + k,
      "1"
    );
  } catch {
    /* ignore */
  }
}

export function BillsTodayPrompt() {
  const { data: recurring = [] } = useRecurring({ only_active: true });
  const { data: subscriptions = [] } = useSubscriptions({
    status: ["active", "trial"],
  });
  const createTx = useCreateTransaction();
  const defaultCurrency = useDefaultCurrency();

  const [_, setRefresh] = useState(0);
  // Re-mount cuando se confirma/skip para que reaparezca la UI sin
  // el item ya decidido.
  useEffect(() => {
    setRefresh((r) => r + 1);
  }, []);

  // Bills due today + last 2 days (overdue)
  const dueBills = useMemo(() => {
    // Buscamos en una ventana de "ayer y hoy" para captura overdue
    // de 1-2 días. Más allá los marcamos como manualmente atrasados.
    const all = findUpcomingDue({
      recurring,
      subscriptions,
      daysAhead: 0,
    });
    // Filter: only expense bills (no incomes — esos son cobros que no
    // requieren confirmación nuestra).
    const today = todayIso();
    return all.filter((b) => {
      if (b.kind === "income") return false;
      if (b.dueDate !== today) return false;
      const decision = readDecision(b.id, b.dueDate);
      return decision === null;
    });
  }, [recurring, subscriptions]);

  if (dueBills.length === 0) return null;

  return (
    <section className="rounded-card border border-line bg-bg-alt/30 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Receipt size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Pagos del día
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="font-body text-xs text-muted leading-relaxed mb-3">
        Estos recurring/subscripciones tocan hoy. Si ya cobraron por
        afuera (transferencia, cargo automático), confirma y se registra
        como gasto. Si aún no, salta y aparece de nuevo mañana.
      </p>

      <ul className="space-y-2">
        {dueBills.map((b) => (
          <BillRow
            key={b.id}
            bill={b}
            onConfirm={async () => {
              try {
                await createTx.mutateAsync({
                  amount: b.amount,
                  kind: "expense",
                  category_id: null,
                  occurred_on: b.dueDate,
                  note: `Pago automático · ${b.name}`,
                  currency: b.currency || defaultCurrency,
                });
                writeDecision(b.id, b.dueDate, "confirm");
                setRefresh((r) => r + 1);
              } catch {
                /* hook ya muestra error */
              }
            }}
            onSkip={() => {
              writeDecision(b.id, b.dueDate, "skip");
              setRefresh((r) => r + 1);
            }}
          />
        ))}
      </ul>
    </section>
  );
}

function BillRow({
  bill,
  onConfirm,
  onSkip,
}: {
  bill: UpcomingDue;
  onConfirm: () => Promise<void>;
  onSkip: () => void;
}) {
  const [busy, setBusy] = useState<"confirm" | "skip" | null>(null);

  return (
    <li className="flex items-center gap-3 py-2 px-3 rounded-md bg-bg border border-line/60">
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-ink truncate">{bill.name}</p>
        <p className="font-body text-xs text-muted">
          {formatMoney(bill.amount, bill.currency)}
          {bill.source === "subscription" && " · suscripción"}
          {bill.source === "recurring" && " · recurrente"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setBusy("skip");
          onSkip();
        }}
        disabled={!!busy}
        aria-label="Saltar"
        title="Saltar — vuelvo mañana"
        className={clsx(
          "h-8 w-8 rounded-md text-muted hover:text-ink hover:bg-bg-alt",
          "flex items-center justify-center transition-colors disabled:opacity-40"
        )}
      >
        {busy === "skip" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <X size={14} />
        )}
      </button>
      <button
        type="button"
        onClick={async () => {
          setBusy("confirm");
          try {
            await onConfirm();
          } finally {
            setBusy(null);
          }
        }}
        disabled={!!busy}
        className={clsx(
          "inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-accent text-bg",
          "font-mono text-[10px] uppercase tracking-widest",
          "hover:opacity-90 disabled:opacity-40 transition-opacity"
        )}
      >
        {busy === "confirm" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Check size={12} />
        )}
        Pagado
      </button>
    </li>
  );
}
