"use client";
import { useMemo, useState } from "react";
import {
  TrendingUp,
  Plus,
  Loader2,
  X,
  Trash2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import {
  useInvestments,
  useCreateInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
} from "../../hooks/useFinance";
import { formatMoney } from "../../lib/finance";
import type {
  FinanceInvestment,
  InvestmentKind,
} from "@estoicismo/supabase";

const KIND_LABELS: Record<InvestmentKind, { label: string; emoji: string }> = {
  stock: { label: "Acción", emoji: "📈" },
  etf: { label: "ETF", emoji: "📊" },
  crypto: { label: "Crypto", emoji: "₿" },
  real_estate: { label: "Inmueble", emoji: "🏠" },
  fund: { label: "Fondo", emoji: "🏦" },
  other: { label: "Otro", emoji: "💼" },
};

/**
 * Investments Card · portafolio manual.
 *
 * El user agrega holdings (stocks, crypto, real estate, etc.) y
 * actualiza el valor cuando quiera. La suma cuenta en Net Worth.
 *
 * No hay precios live — el user es responsable de mantener
 * `current_value` actualizado. Botón "Actualizar valor" facilita
 * el ritual mensual.
 */
export function InvestmentsCard() {
  const { data: investments = [] } = useInvestments();
  const create = useCreateInvestment();
  const update = useUpdateInvestment();
  const del = useDeleteInvestment();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<FinanceInvestment | null>(null);
  const [updatingValue, setUpdatingValue] = useState<string | null>(null);

  const total = useMemo(() => {
    return investments
      .filter((i) => i.include_in_net_worth)
      .reduce((acc, i) => acc + Number(i.current_value), 0);
  }, [investments]);

  const currency = investments[0]?.currency ?? "MXN";

  if (investments.length === 0) {
    return (
      <div className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Inversiones
          </p>
          <span className="h-px flex-1 bg-line" />
        </div>
        <p className="font-body text-sm text-muted mb-4 leading-relaxed">
          Stocks, crypto, fondos, real estate. Sin precios live —
          actualizas el valor cuando quieras. Cuenta en tu Net Worth.
        </p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 h-9 px-4 rounded-full bg-accent text-bg font-body text-xs font-medium"
        >
          <Plus size={12} /> Mi primera inversión
        </button>
        {adding && (
          <InvestmentModal
            initial={null}
            onClose={() => setAdding(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Inversiones · {investments.length}
        </p>
        <span className="h-px flex-1 bg-line" />
        <span className="font-display italic text-base text-ink tabular-nums">
          {formatMoney(total, currency)}
        </span>
      </div>

      <ul className="space-y-2">
        {investments.map((inv) => (
          <InvestmentRow
            key={inv.id}
            inv={inv}
            updating={updatingValue === inv.id}
            onUpdateValue={async (value) => {
              setUpdatingValue(inv.id);
              try {
                await update.mutateAsync({
                  id: inv.id,
                  input: { current_value: value },
                });
              } finally {
                setUpdatingValue(null);
              }
            }}
            onEdit={() => setEditing(inv)}
            onDelete={() => {
              if (confirm(`¿Eliminar "${inv.name}"?`)) del.mutate(inv.id);
            }}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink"
      >
        <Plus size={12} /> Agregar
      </button>

      {(adding || editing) && (
        <InvestmentModal
          initial={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function InvestmentRow({
  inv,
  updating,
  onUpdateValue,
  onEdit,
  onDelete,
}: {
  inv: FinanceInvestment;
  updating: boolean;
  onUpdateValue: (value: number) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [editingValue, setEditingValue] = useState(false);
  const [valueDraft, setValueDraft] = useState(String(inv.current_value));
  const meta = KIND_LABELS[inv.kind];

  // Calcular ganancia/pérdida si tenemos avg_buy_price + quantity
  const costBasis =
    inv.quantity && inv.avg_buy_price
      ? Number(inv.quantity) * Number(inv.avg_buy_price)
      : null;
  const gain =
    costBasis !== null ? Number(inv.current_value) - costBasis : null;
  const gainPct =
    costBasis !== null && costBasis > 0 && gain !== null
      ? (gain / costBasis) * 100
      : null;

  async function saveValue() {
    const v = parseFloat(valueDraft.replace(",", "."));
    if (!isFinite(v) || v < 0) {
      setValueDraft(String(inv.current_value));
      setEditingValue(false);
      return;
    }
    await onUpdateValue(v);
    setEditingValue(false);
  }

  return (
    <li className="rounded-lg border border-line bg-bg p-3 group">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base shrink-0">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-ink truncate">{inv.name}</p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
            {meta.label}
            {inv.symbol && <span> · {inv.symbol}</span>}
            {inv.quantity != null && (
              <span> · {inv.quantity}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="h-7 w-7 rounded-full text-muted hover:text-ink hover:bg-bg-alt flex items-center justify-center"
            title="Editar"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-7 w-7 rounded-full text-muted hover:text-danger hover:bg-bg-alt flex items-center justify-center"
            title="Eliminar"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <div className="flex items-baseline gap-3 flex-wrap mt-2">
        {editingValue ? (
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={valueDraft}
            onChange={(e) =>
              setValueDraft(e.target.value.replace(/[^0-9.,]/g, ""))
            }
            onBlur={saveValue}
            onKeyDown={(e) => {
              if (e.key === "Enter") void saveValue();
              if (e.key === "Escape") {
                setValueDraft(String(inv.current_value));
                setEditingValue(false);
              }
            }}
            className="font-display italic text-lg text-ink tabular-nums bg-bg-alt border border-accent rounded px-2 py-0.5 w-32 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setValueDraft(String(inv.current_value));
              setEditingValue(true);
            }}
            className="font-display italic text-lg text-ink tabular-nums hover:text-accent transition-colors inline-flex items-center gap-1"
            title="Tap para editar valor"
          >
            {formatMoney(Number(inv.current_value), inv.currency)}
            {updating ? (
              <Loader2 size={11} className="animate-spin text-muted" />
            ) : (
              <RefreshCw
                size={11}
                className="text-muted/50 group-hover:text-muted"
              />
            )}
          </button>
        )}
        {gain !== null && gainPct !== null && (
          <span
            className={clsx(
              "font-mono text-[10px] tabular-nums",
              gain >= 0 ? "text-success" : "text-danger"
            )}
          >
            {gain >= 0 ? "+" : ""}
            {formatMoney(gain, inv.currency)} ({gainPct >= 0 ? "+" : ""}
            {gainPct.toFixed(1)}%)
          </span>
        )}
        {inv.last_priced_at && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted/60 ml-auto">
            {formatRelative(inv.last_priced_at)}
          </span>
        )}
      </div>
    </li>
  );
}

function InvestmentModal({
  initial,
  onClose,
}: {
  initial: FinanceInvestment | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<InvestmentKind>(initial?.kind ?? "stock");
  const [symbol, setSymbol] = useState(initial?.symbol ?? "");
  const [quantity, setQuantity] = useState(
    initial?.quantity != null ? String(initial.quantity) : ""
  );
  const [avgBuyPrice, setAvgBuyPrice] = useState(
    initial?.avg_buy_price != null ? String(initial.avg_buy_price) : ""
  );
  const [currentValue, setCurrentValue] = useState(
    initial?.current_value != null ? String(initial.current_value) : ""
  );
  const [includeInNetWorth, setIncludeInNetWorth] = useState(
    initial?.include_in_net_worth ?? true
  );
  const create = useCreateInvestment();
  const update = useUpdateInvestment();
  const saving = create.isPending || update.isPending;

  async function save() {
    const value = parseFloat(currentValue.replace(",", "."));
    if (!name.trim() || !isFinite(value) || value < 0) return;
    const payload = {
      name: name.trim(),
      kind,
      symbol: symbol.trim() || null,
      quantity: quantity ? parseFloat(quantity) : null,
      avg_buy_price: avgBuyPrice ? parseFloat(avgBuyPrice) : null,
      current_value: value,
      include_in_net_worth: includeInNetWorth,
    };
    if (initial) {
      await update.mutateAsync({ id: initial.id, input: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-bg rounded-card border border-line shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h3 className="font-display italic text-xl text-ink">
            {initial ? "Editar inversión" : "Nueva inversión"}
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Nombre
            </p>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="Apple, Bitcoin, Departamento centro…"
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Tipo
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(KIND_LABELS) as InvestmentKind[]).map((k) => {
                const active = kind === k;
                const m = KIND_LABELS[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={clsx(
                      "h-10 rounded-lg border font-body text-xs inline-flex items-center justify-center gap-1",
                      active
                        ? "border-accent bg-accent/10 text-ink"
                        : "border-line bg-bg text-muted hover:text-ink"
                    )}
                  >
                    <span>{m.emoji}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                Símbolo (opcional)
              </p>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                maxLength={20}
                placeholder="AAPL"
                className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                Cantidad
              </p>
              <input
                type="text"
                inputMode="decimal"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="10"
                className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                Precio compra prom.
              </p>
              <input
                type="text"
                inputMode="decimal"
                value={avgBuyPrice}
                onChange={(e) =>
                  setAvgBuyPrice(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="150.50"
                className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                Valor actual TOTAL
              </p>
              <input
                type="text"
                inputMode="decimal"
                value={currentValue}
                onChange={(e) =>
                  setCurrentValue(e.target.value.replace(/[^0-9.,]/g, ""))
                }
                placeholder="2500"
                className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-display italic text-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInNetWorth}
              onChange={(e) => setIncludeInNetWorth(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            <span className="font-body text-sm text-ink">
              Contar en Net Worth
            </span>
          </label>
        </div>
        <div className="p-4 border-t border-line flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg-alt"
          >
            Cancelar
          </button>
          <button
            disabled={saving || !name.trim() || !currentValue}
            onClick={save}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-accent text-bg font-body text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {initial ? "Guardar" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months}m`;
  return date.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}
