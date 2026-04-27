"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Landmark,
  Sparkles,
  PiggyBank,
  Wallet,
} from "lucide-react";
import type {
  FinanceTransaction,
  CreateTransactionInput,
} from "@estoicismo/supabase";
import {
  useFinanceCategories,
  useTransactions,
  useRecentTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../../../hooks/useFinance";
import {
  computeMonthStats,
  formatMoney,
  monthBounds,
} from "../../../lib/finance";
import { TransactionModal } from "../../../components/finanzas/TransactionModal";
import { TransactionList } from "../../../components/finanzas/TransactionList";
import { FinanceAdvice } from "../../../components/finanzas/FinanceAdvice";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { DailyQuote } from "../../../components/ui/DailyQuote";
import { BudgetsAlertBanner } from "../../../components/presupuestos/BudgetsAlertBanner";
import { NetWorthCard } from "../../../components/finanzas/NetWorthCard";
import { SavingsRateCard } from "../../../components/finanzas/SavingsRateCard";
import { UpcomingDueBanner } from "../../../components/finanzas/UpcomingDueBanner";
import { ModuleHeroNav } from "../../../components/ui/ModuleHeroNav";
import { FINANCE_QUOTES } from "../../../lib/quotes";

/**
 * Pantalla principal de Finanzas — el "Hoy" del módulo.
 *
 * Secciones (mobile-first, max-w-3xl):
 *   1. Hero editorial (saludo + mes actual)
 *   2. Hero numérico: gasto/ingreso/neto del mes — con barra visual
 *      del gasto vs ingreso para dar contexto rápido.
 *   3. Atajos: Calendario · Tarjetas · Deudas.
 *   4. Lista de movimientos recientes (últimos 20) + botón "Añadir".
 *   5. Consejo financiero rotativo.
 *
 * Performance:
 *   - Dos queries paralelas: month range + recent.
 *   - No bloqueamos la UI mientras cargan; mostramos skeletons.
 */
export function FinanzasClient() {
  const { from, to } = useMemo(() => monthBounds(), []);
  const { data: categories = [] } = useFinanceCategories();
  const { data: monthTx = [], isLoading: loadingMonth } = useTransactions({
    from,
    to,
  });
  const { data: recent = [], isLoading: loadingRecent } =
    useRecentTransactions(20);

  const createM = useCreateTransaction();
  const updateM = useUpdateTransaction();
  const deleteM = useDeleteTransaction();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);
  const [confirmDelete, setConfirmDelete] =
    useState<FinanceTransaction | null>(null);

  const stats = useMemo(() => computeMonthStats(monthTx), [monthTx]);

  const saving = createM.isPending || updateM.isPending;

  async function handleSave(draft: CreateTransactionInput) {
    try {
      if (editing) {
        await updateM.mutateAsync({ id: editing.id, input: draft });
      } else {
        await createM.mutateAsync(draft);
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      // toast ya se muestra en el hook
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteM.mutateAsync(confirmDelete.id);
    } finally {
      setConfirmDelete(null);
    }
  }

  const monthLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  }, []);

  // Barra relativa: qué tan "comido" está el ingreso por el gasto.
  const spentRatio =
    stats.income > 0
      ? Math.min(1, stats.expense / stats.income)
      : stats.expense > 0
      ? 1
      : 0;

  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Finanzas · {monthLabel}
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl leading-tight">
            Tu dinero, con cabeza fría.
          </h1>
          <p className="font-body text-white/60 text-sm mt-3 max-w-prose leading-relaxed">
            Registra cada ingreso y gasto con un gesto. Lee el mes completo de un vistazo.
          </p>
          <ModuleHeroNav
            items={[
              { href: "/finanzas/cuentas", label: "Cuentas", emoji: "💳" },
              { href: "/finanzas/recurrentes", label: "Recurrentes", emoji: "🔁" },
              { href: "/finanzas/tarjetas", label: "Tarjetas", emoji: "💳" },
              { href: "/finanzas/ahorro", label: "Ahorro", emoji: "🐖" },
              { href: "/finanzas/presupuestos", label: "Presupuestos", emoji: "🎯" },
              { href: "/finanzas/deudas", label: "Deudas", emoji: "⚖️" },
              { href: "/finanzas/calendario", label: "Calendario", emoji: "📅" },
            ]}
          />
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Próximos vencimientos (recurrentes + suscripciones) */}
        <UpcomingDueBanner />

        {/* Alerta de presupuestos — solo aparece si hay categorías cerca/excedidas */}
        <BudgetsAlertBanner />

        {/* Net worth — sólo aparece si hay cuentas/deudas/cards/savings con saldo */}
        <NetWorthCard />

        {/* Tasa de ahorro del mes */}
        <SavingsRateCard />

        {/* KPIs del mes */}
        <section aria-label="Resumen del mes">
          <MonthHero
            income={stats.income}
            expense={stats.expense}
            net={stats.net}
            spentRatio={spentRatio}
            loading={loadingMonth}
          />
        </section>

        {/* Reflexión financiera del día — una frase fija, rota en medianoche */}
        <section aria-label="Reflexión financiera del día">
          <div className="rounded-card border border-line bg-bg-alt/30 p-5 sm:p-6">
            <DailyQuote
              quotes={FINANCE_QUOTES}
              label="Reflexión financiera"
            />
          </div>
        </section>

        {/* Atajos */}
        <section aria-label="Accesos rápidos">
          <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3" role="list">
            <ShortcutCard
              href="/finanzas/calendario"
              Icon={Calendar}
              title="Calendario"
              desc="Mes día a día"
            />
            <ShortcutCard
              href="/finanzas/tarjetas"
              Icon={CreditCard}
              title="Tarjetas"
              desc="Límites y uso"
            />
            <ShortcutCard
              href="/finanzas/ahorro"
              Icon={PiggyBank}
              title="Ahorro"
              desc="Tus metas"
            />
            <ShortcutCard
              href="/finanzas/presupuestos"
              Icon={Wallet}
              title="Presupuestos"
              desc="Topes mensuales"
            />
            <ShortcutCard
              href="/finanzas/deudas"
              Icon={Landmark}
              title="Deudas"
              desc="Plan para pagar"
            />
          </ul>
        </section>

        {/* Lista reciente */}
        <section aria-label="Movimientos recientes">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display italic text-xl text-ink">
              Movimientos
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-full bg-accent text-white font-body text-[12px] font-medium hover:opacity-90 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Plus size={14} aria-hidden />
              Añadir
            </button>
          </div>
          {loadingRecent ? (
            <ListSkeleton />
          ) : (
            <TransactionList
              transactions={recent}
              categories={categories}
              onEdit={(tx) => {
                setEditing(tx);
                setModalOpen(true);
              }}
              onDelete={(tx) => setConfirmDelete(tx)}
              emptyMessage="Aún no hay movimientos. Toca 'Añadir' para empezar."
            />
          )}
        </section>

        {/* Consejo */}
        <section aria-label="Consejo financiero">
          <FinanceAdvice />
        </section>
      </div>

      {/* FAB mobile — ingreso rápido */}
      <button
        type="button"
        aria-label="Añadir movimiento"
        onClick={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        className="fixed md:hidden bottom-[calc(3.5rem+env(safe-area-inset-bottom)+12px)] right-4 z-30 w-14 h-14 rounded-full bg-accent text-white inline-flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Plus size={24} aria-hidden />
      </button>

      <TransactionModal
        open={modalOpen}
        editing={editing}
        categories={categories}
        saving={saving}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Borrar este movimiento?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────

function MonthHero({
  income,
  expense,
  net,
  spentRatio,
  loading,
}: {
  income: number;
  expense: number;
  net: number;
  spentRatio: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">
        Balance del mes
      </p>
      <div className="flex items-baseline gap-2 mb-4">
        <p
          className={`font-display italic text-3xl sm:text-4xl tabular-nums ${
            net >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {net >= 0 ? "+" : "−"}
          {formatMoney(net)}
        </p>
        {loading && (
          <span className="font-body text-xs text-muted">cargando…</span>
        )}
      </div>

      {/* Barra: gastado vs ingresado */}
      <div
        aria-label={`${Math.round(spentRatio * 100)}% del ingreso consumido`}
        className="relative h-1.5 rounded-full bg-line overflow-hidden mb-4"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(spentRatio * 100)}
      >
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out ${
            spentRatio >= 1 ? "bg-danger" : "bg-accent"
          }`}
          style={{ width: `${Math.max(2, spentRatio * 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiTile
          label="Ingreso"
          value={income}
          Icon={ArrowUpRight}
          tone="success"
        />
        <KpiTile
          label="Gasto"
          value={expense}
          Icon={ArrowDownRight}
          tone="danger"
        />
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: typeof ArrowUpRight;
  tone: "success" | "danger";
}) {
  const color = tone === "success" ? "text-success" : "text-danger";
  const bg = tone === "success" ? "bg-success/10" : "bg-danger/10";
  return (
    <div className="rounded-lg border border-line bg-bg p-3 flex items-center gap-3">
      <span
        aria-hidden
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${color} ${bg}`}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {label}
        </p>
        <p className="font-body text-[15px] font-medium text-ink tabular-nums truncate">
          {formatMoney(value)}
        </p>
      </div>
    </div>
  );
}

function ShortcutCard({
  href,
  Icon,
  title,
  desc,
}: {
  href: string;
  Icon: typeof Calendar;
  title: string;
  desc: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex flex-col h-full gap-2 p-3 sm:p-4 rounded-card border border-line bg-bg hover:border-accent/40 hover:bg-accent/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent/10 text-accent"
        >
          <Icon size={16} />
        </span>
        <div>
          <p className="font-body text-[13px] font-medium text-ink">{title}</p>
          <p className="font-body text-[11px] text-muted leading-snug">{desc}</p>
        </div>
      </Link>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border border-line bg-bg"
        >
          <div className="w-9 h-9 rounded-full bg-bg-alt animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-bg-alt animate-pulse" />
            <div className="h-3 w-1/4 rounded bg-bg-alt/70 animate-pulse" />
          </div>
          <div className="h-4 w-16 rounded bg-bg-alt animate-pulse" />
        </li>
      ))}
    </ul>
  );
}
