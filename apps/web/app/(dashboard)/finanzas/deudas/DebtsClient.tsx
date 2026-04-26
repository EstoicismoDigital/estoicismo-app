"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Pencil,
  Trash2,
  Flame,
  Snowflake,
  Settings as SettingsIcon,
  Trophy,
  CreditCard,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { clsx } from "clsx";
import type { FinanceDebt, CreateDebtInput } from "@estoicismo/supabase";
import {
  useDebts,
  useCreateDebt,
  useUpdateDebt,
  useDeleteDebt,
  useDebtPayments,
  useCreateDebtPayment,
} from "../../../../hooks/useDebts";
import {
  useCreateTransaction,
  useFinanceCategories,
} from "../../../../hooks/useFinance";
import {
  orderDebtsByStrategy,
  payoffMonths,
  monthlyInterest,
  type Strategy,
} from "../../../../lib/debt/amortization";
import { formatMoney } from "../../../../lib/finance";
import {
  DebtSimulator,
  SingleDebtSimulator,
} from "../../../../components/finanzas/DebtSimulator";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";

const DebtModal = dynamic(
  () => import("../../../../components/finanzas/DebtModal").then((m) => m.DebtModal),
  { ssr: false }
);
const DebtPaymentModal = dynamic(
  () => import("../../../../components/finanzas/DebtPaymentModal").then((m) => m.DebtPaymentModal),
  { ssr: false }
);

/**
 * Sistema inteligente de deudas.
 *
 * - Ordena por estrategia (avalanche / snowball / custom).
 * - La primera deuda viva en el orden recibe la badge "Pagar primero".
 * - Cada tarjeta muestra balance, APR, mínimo, % pagado del original,
 *   meses al pagar mínimo, próximo pago, interés mensual.
 * - Botón "Registrar pago" → DebtPaymentModal con preview del split
 *   capital/interés.
 * - Slider global "Extra mensual" en Simulador → comparativa
 *   avalanche vs snowball y meses + total interés.
 * - Por deuda, simulador individual: solo-mínimo vs con-extra.
 * - Pagos recientes en la sección expandible.
 */
export function DebtsClient() {
  const { data: debts = [] } = useDebts({ include_paid: false });
  const { data: paidDebts = [] } = useDebts({ include_paid: true });
  const { data: categories = [] } = useFinanceCategories();
  const createM = useCreateDebt();
  const updateM = useUpdateDebt();
  const deleteM = useDeleteDebt();
  const payM = useCreateDebtPayment();
  const createTxM = useCreateTransaction();

  // Categoría "Deuda" para auto-log de gastos.
  const debtCategoryId = useMemo(() => {
    return (
      categories.find((c) => c.kind === "expense" && c.name === "Deuda")?.id ??
      null
    );
  }, [categories]);

  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<FinanceDebt | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FinanceDebt | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<FinanceDebt | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const ordered = useMemo(
    () => orderDebtsByStrategy(debts, strategy),
    [debts, strategy]
  );

  const totals = useMemo(() => {
    const balance = debts.reduce((s, d) => s + Number(d.balance), 0);
    const minimum = debts.reduce((s, d) => s + Number(d.minimum_payment), 0);
    const monthlyInt = debts.reduce((s, d) => s + monthlyInterest(d.balance, d.apr), 0);
    return { balance, minimum, monthlyInt };
  }, [debts]);

  const currency = debts[0]?.currency ?? "MXN";
  const onlyPaidDebts = paidDebts.filter((d) => d.is_paid);

  async function handleSaveDebt(input: CreateDebtInput) {
    try {
      if (editingDebt) {
        await updateM.mutateAsync({ id: editingDebt.id, input });
      } else {
        await createM.mutateAsync(input);
      }
      setDebtModalOpen(false);
      setEditingDebt(null);
    } catch {
      /* hook toasts */
    }
  }

  async function handlePayment(input: {
    amount: number;
    occurred_on: string;
    note: string | null;
    log_as_expense: boolean;
  }) {
    if (!paymentDebt) return;
    let transactionId: string | null = null;

    // Si el user pidió registrarlo también como gasto, creamos la
    // transacción primero para tener el id antes del payment.
    if (input.log_as_expense && debtCategoryId) {
      try {
        const tx = await createTxM.mutateAsync({
          amount: input.amount,
          kind: "expense",
          category_id: debtCategoryId,
          occurred_on: input.occurred_on,
          note: `Pago a ${paymentDebt.name}${input.note ? ` · ${input.note}` : ""}`,
          source: "manual",
        });
        transactionId = tx.id;
      } catch {
        // Si la creación de la transacción falla, igual seguimos
        // con el pago — al usuario le importa más auditar la deuda.
        transactionId = null;
      }
    }

    await payM.mutateAsync({
      debt_id: paymentDebt.id,
      amount: input.amount,
      occurred_on: input.occurred_on,
      note: input.note,
      transaction_id: transactionId,
    });
    setPaymentDebt(null);
  }

  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Finanzas · Deudas
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            La deuda es un arma. Apúntala bien.
          </h1>
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            <Stat label="Total adeudado" value={formatMoney(totals.balance, currency)} tone="danger" />
            <Stat label="Mínimo mensual" value={formatMoney(totals.minimum, currency)} />
            <Stat label="Intereses al mes" value={formatMoney(totals.monthlyInt, currency)} tone="warn" />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-1.5">
            <StrategyButton
              active={strategy === "avalanche"}
              onClick={() => setStrategy("avalanche")}
              icon={<Flame size={12} />}
              label="Avalancha"
            />
            <StrategyButton
              active={strategy === "snowball"}
              onClick={() => setStrategy("snowball")}
              icon={<Snowflake size={12} />}
              label="Bola de nieve"
            />
            <StrategyButton
              active={strategy === "custom"}
              onClick={() => setStrategy("custom")}
              icon={<SettingsIcon size={12} />}
              label="Custom"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingDebt(null);
              setDebtModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus size={12} /> Nueva deuda
          </button>
        </div>

        <div className="text-[12px] text-muted italic px-1">
          {strategy === "avalanche" && "Pagas mínimo en todas + el extra al APR más alto. Matemáticamente óptimo: ahorra el máximo de interés."}
          {strategy === "snowball" && "Pagas mínimo en todas + el extra al saldo más chico. Psicológicamente óptimo: las victorias rápidas te mantienen."}
          {strategy === "custom" && "El orden lo decides tú — útil cuando una deuda es tóxica más allá del APR."}
        </div>

        {debts.length === 0 ? (
          <div className="rounded-card border border-dashed border-line p-8 text-center space-y-2">
            <CreditCard className="mx-auto text-muted" size={32} />
            <p className="text-sm text-ink font-semibold">Sin deudas activas</p>
            <p className="text-[12px] text-muted">
              Si tienes alguna, regístrala para diseñar el plan de salida.
            </p>
          </div>
        ) : (
          <>
            <RecommendationCard debt={ordered[0]} strategy={strategy} />
            <DebtSimulator debts={debts} strategy={strategy} currency={currency} />

            <div className="space-y-3">
              {ordered.map((d, idx) => (
                <DebtCard
                  key={d.id}
                  debt={d}
                  isFirst={idx === 0}
                  expanded={expanded === d.id}
                  onToggleExpanded={() => setExpanded((cur) => (cur === d.id ? null : d.id))}
                  onEdit={() => {
                    setEditingDebt(d);
                    setDebtModalOpen(true);
                  }}
                  onDelete={() => setConfirmDelete(d)}
                  onPay={() => setPaymentDebt(d)}
                />
              ))}
            </div>
          </>
        )}

        {onlyPaidDebts.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-display italic text-lg text-ink flex items-center gap-1.5">
              <Trophy size={14} className="text-success" />
              Liquidadas ({onlyPaidDebts.length})
            </h2>
            <ul className="space-y-2">
              {onlyPaidDebts.map((d) => (
                <li
                  key={d.id}
                  className="rounded-card border border-success/30 bg-success/5 p-3 flex items-center gap-2"
                >
                  <Trophy size={14} className="text-success" />
                  <p className="text-sm text-ink flex-1">{d.name}</p>
                  <span className="text-[11px] text-muted">
                    Original {formatMoney(Number(d.original_balance ?? d.balance), d.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <DebtModal
        open={debtModalOpen}
        editing={editingDebt}
        saving={createM.isPending || updateM.isPending}
        onClose={() => {
          setDebtModalOpen(false);
          setEditingDebt(null);
        }}
        onSave={handleSaveDebt}
      />
      <DebtPaymentModal
        open={!!paymentDebt}
        debt={paymentDebt}
        saving={payM.isPending}
        onClose={() => setPaymentDebt(null)}
        onSave={handlePayment}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Eliminar deuda?"
        description="Borra la deuda y todos sus pagos asociados. No se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteM.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "warn" }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">{label}</p>
      <p
        className={clsx(
          "text-base font-semibold",
          tone === "danger" ? "text-red-300" : tone === "warn" ? "text-amber-300" : "text-white"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StrategyButton(props: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={clsx(
        "px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-widest inline-flex items-center gap-1.5",
        props.active
          ? "bg-accent text-bg border-accent"
          : "border-line text-muted hover:text-ink"
      )}
    >
      {props.icon}
      {props.label}
    </button>
  );
}

function RecommendationCard(props: { debt: FinanceDebt; strategy: Strategy }) {
  const { debt, strategy } = props;
  const months = payoffMonths(debt, debt.minimum_payment);
  const reason =
    strategy === "avalanche"
      ? `APR más alto (${Number(debt.apr).toFixed(1)}%) — cada peso aquí ahorra más en interés.`
      : strategy === "snowball"
      ? `Saldo más chico (${formatMoney(debt.balance, debt.currency)}) — la liquidas pronto y libera el mínimo para la siguiente.`
      : `Marcaste esta como prioridad.`;

  return (
    <section className="rounded-card border border-accent/40 bg-accent/5 p-4 flex items-start gap-3">
      <div className="w-1 self-stretch bg-accent rounded-full" />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Pagar primero
        </p>
        <h3 className="font-display italic text-lg text-ink truncate">{debt.name}</h3>
        <p className="text-[12px] text-muted mt-0.5">{reason}</p>
        {months !== null && (
          <p className="text-[11px] text-muted mt-1">
            Solo con el mínimo, sales en{" "}
            <span className="text-ink font-semibold">
              {months}m ({Math.round(months / 12)}a)
            </span>
            .
          </p>
        )}
        {months === null && (
          <p className="text-[11px] text-orange-400 mt-1">
            ⚠️ El mínimo no cubre el interés mensual — la deuda crece.
          </p>
        )}
      </div>
    </section>
  );
}

function DebtCard(props: {
  debt: FinanceDebt;
  isFirst: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPay: () => void;
}) {
  const { debt, isFirst, expanded, onToggleExpanded, onEdit, onDelete, onPay } = props;
  const monthsToPayoff = useMemo(
    () => payoffMonths(debt, debt.minimum_payment),
    [debt]
  );
  const monthlyInt = monthlyInterest(debt.balance, debt.apr);
  const original = Number(debt.original_balance ?? debt.balance);
  const paid = Math.max(0, original - debt.balance);
  const pctPaid = original > 0 ? (paid / original) * 100 : 0;

  const { data: payments = [] } = useDebtPayments({
    debt_id: expanded ? debt.id : undefined,
    limit: 10,
  });

  return (
    <article
      className={clsx(
        "rounded-card border bg-bg-alt/40 p-4 space-y-3",
        isFirst ? "border-accent/40" : "border-line"
      )}
    >
      <header className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isFirst && (
              <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                Prioridad
              </span>
            )}
            <p className="text-sm font-semibold text-ink truncate">{debt.name}</p>
          </div>
          <p className="text-[11px] text-muted">
            APR {Number(debt.apr).toFixed(1)}% · Mínimo{" "}
            {formatMoney(debt.minimum_payment, debt.currency)} ·{" "}
            {monthsToPayoff !== null
              ? `${monthsToPayoff}m mínimo`
              : "no se paga al mínimo"}
            {debt.due_day ? ` · día ${debt.due_day}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1 text-muted hover:text-ink rounded">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1 text-muted hover:text-danger rounded">
            <Trash2 size={13} />
          </button>
        </div>
      </header>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-display italic text-ink">
            {formatMoney(debt.balance, debt.currency)}
          </span>
          <span className="text-[11px] text-muted">
            {pctPaid.toFixed(0)}% pagado
          </span>
        </div>
        <div className="h-1.5 bg-line/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${Math.min(100, pctPaid)}%` }}
          />
        </div>
        <p className="text-[11px] text-muted flex items-center gap-1.5">
          <TrendingUp size={11} />
          Interés mensual estimado:{" "}
          <span className="text-orange-400 font-mono">
            {formatMoney(monthlyInt, debt.currency)}
          </span>
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPay}
          className="flex-1 py-2 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90"
        >
          Registrar pago
        </button>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="px-3 py-2 rounded-lg border border-line text-muted hover:text-ink inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest"
        >
          {expanded ? "Ocultar" : "Detalle"}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 pt-3 border-t border-line/40">
          <SingleDebtSimulator debt={debt} />

          {payments.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                Últimos pagos ({payments.length})
              </p>
              <ul className="space-y-1">
                {payments.slice(0, 5).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between text-[11px] py-1.5 border-b border-line/30 last:border-b-0"
                  >
                    <span className="text-muted flex items-center gap-1.5">
                      <Calendar size={10} />
                      {new Date(p.occurred_on + "T00:00:00").toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <div className="text-right">
                      <p className="text-ink font-mono">{formatMoney(p.amount, debt.currency)}</p>
                      <p className="text-[10px] text-muted">
                        Capital{" "}
                        <span className="text-success">
                          {formatMoney(p.principal_paid, debt.currency)}
                        </span>{" "}
                        · Interés{" "}
                        <span className="text-danger">
                          {formatMoney(p.interest_paid, debt.currency)}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
