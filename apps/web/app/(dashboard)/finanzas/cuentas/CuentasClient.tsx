"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Pencil, Archive, ArchiveRestore, Trash2, Wallet } from "lucide-react";
import { clsx } from "clsx";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "../../../../hooks/useFinance";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { NetWorthCard } from "../../../../components/finanzas/NetWorthCard";
import { formatMoney } from "../../../../lib/finance";
import type { FinanceAccount, CreateAccountInput } from "@estoicismo/supabase";

const AccountModal = dynamic(
  () =>
    import("../../../../components/finanzas/AccountModal").then((m) => m.AccountModal),
  { ssr: false }
);

const KIND_LABELS: Record<string, string> = {
  cash: "Efectivo",
  checking: "Corriente",
  savings: "Ahorros",
  investment: "Inversión",
  crypto: "Cripto",
  other: "Otra",
};

export function CuentasClient() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data: accounts = [] } = useAccounts({ include_archived: includeArchived });
  const createM = useCreateAccount();
  const updateM = useUpdateAccount();
  const deleteM = useDeleteAccount();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceAccount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FinanceAccount | null>(null);

  const totals = useMemo(() => {
    let assets = 0;
    let included = 0;
    for (const a of accounts) {
      if (a.is_archived) continue;
      assets += Number(a.current_balance);
      if (a.include_in_net_worth) included++;
    }
    return { assets, included, count: accounts.filter((a) => !a.is_archived).length };
  }, [accounts]);

  const currency = accounts[0]?.currency ?? "MXN";
  const visible = accounts.filter((a) => includeArchived || !a.is_archived);

  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Finanzas · Cuentas
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            Donde vive tu dinero.
          </h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
            <Stat label="Activos" value={formatMoney(totals.assets, currency)} />
            <Stat label="Cuentas" value={`${totals.count}`} />
            <Stat label="En net worth" value={`${totals.included}`} />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <NetWorthCard />

        <div className="flex items-center justify-between">
          <h2 className="font-display italic text-xl text-ink">Mis cuentas</h2>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded"
              />
              Incluir archivadas
            </label>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Plus size={12} /> Nueva cuenta
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-card border border-dashed border-line p-8 text-center space-y-2">
            <Wallet className="mx-auto text-muted" size={32} />
            <p className="text-sm text-ink font-semibold">Sin cuentas registradas</p>
            <p className="text-[12px] text-muted">
              Una cuenta = un lugar donde vive dinero (efectivo, banco, ahorros, cripto…)
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                onEdit={() => {
                  setEditing(a);
                  setModalOpen(true);
                }}
                onArchive={() =>
                  updateM.mutate({ id: a.id, input: { is_archived: !a.is_archived } })
                }
                onDelete={() => setConfirmDelete(a)}
              />
            ))}
          </ul>
        )}
      </div>

      <AccountModal
        open={modalOpen}
        account={editing}
        saving={createM.isPending || updateM.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={async (input: CreateAccountInput) => {
          try {
            if (editing) {
              await updateM.mutateAsync({ id: editing.id, input });
            } else {
              await createM.mutateAsync(input);
            }
            setModalOpen(false);
            setEditing(null);
          } catch {
            /* hooks toastean */
          }
        }}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Eliminar cuenta?"
        description="Las transacciones asociadas no se borran, sólo pierden la referencia. Mejor archivar."
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function AccountRow(props: {
  account: FinanceAccount;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const { account, onEdit, onArchive, onDelete } = props;
  return (
    <li
      className={clsx(
        "rounded-card border p-4 flex items-center gap-3 group",
        account.is_archived ? "border-line/40 bg-bg-alt/20 opacity-60" : "border-line bg-bg-alt/40"
      )}
    >
      <div
        className="w-2 self-stretch rounded-full"
        style={{ backgroundColor: account.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-sm font-semibold text-ink truncate">{account.name}</p>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
            {KIND_LABELS[account.kind] ?? account.kind}
          </span>
          {!account.include_in_net_worth && (
            <span className="text-[9px] text-muted italic">no cuenta para NW</span>
          )}
        </div>
        <p className="font-display italic text-2xl text-ink mt-0.5">
          {formatMoney(Number(account.current_balance), account.currency)}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 text-muted hover:text-ink rounded"
          aria-label="Editar"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onArchive}
          className="p-1.5 text-muted hover:text-ink rounded"
          aria-label={account.is_archived ? "Restaurar" : "Archivar"}
        >
          {account.is_archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-muted hover:text-danger rounded"
          aria-label="Eliminar"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}
