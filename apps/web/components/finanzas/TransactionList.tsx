"use client";
import { useState } from "react";
import { MoreVertical, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { clsx } from "clsx";
import type { FinanceCategory, FinanceTransaction } from "@estoicismo/supabase";
import { formatMoney } from "../../lib/finance";

/**
 * Lista de movimientos con acciones por fila (editar / borrar).
 *
 * - Agrupada por día (más reciente arriba).
 * - Cada fila muestra: monto con signo, categoría (punto de color + nombre),
 *   nota opcional, hora no se muestra (solo fecha).
 * - Menú contextual por fila. No hay swipe-to-delete (puede volar con un
 *   toque accidental); preferimos el menú + confirmación en ConfirmDialog.
 */
export function TransactionList({
  transactions,
  categories,
  onEdit,
  onDelete,
  emptyMessage = "Sin movimientos todavía.",
  currency = "MXN",
}: {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  onEdit?: (tx: FinanceTransaction) => void;
  onDelete?: (tx: FinanceTransaction) => void;
  emptyMessage?: string;
  currency?: string;
}) {
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  if (transactions.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-bg-alt/40 p-6 text-center">
        <p className="font-body text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  const grouped = groupByDay(transactions);

  return (
    <ul className="space-y-5" role="list">
      {grouped.map(([day, items]) => (
        <li key={day}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
            {formatDayHeader(day)}
          </p>
          <ul className="space-y-1.5" role="list">
            {items.map((tx) => {
              const cat = tx.category_id ? catMap.get(tx.category_id) : undefined;
              const isIncome = tx.kind === "income";
              const menuOpen = menuOpenFor === tx.id;
              return (
                <li
                  key={tx.id}
                  className="group relative flex items-center gap-3 p-3 rounded-lg border border-line bg-bg hover:border-accent/30 transition-colors"
                >
                  <span
                    aria-hidden
                    className={clsx(
                      "inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0",
                      isIncome ? "text-success bg-success/10" : "text-danger bg-danger/10"
                    )}
                  >
                    {isIncome ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {cat && (
                        <span
                          aria-hidden
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: cat.color }}
                        />
                      )}
                      <p className="font-body text-[14px] text-ink truncate">
                        {cat?.name ?? (isIncome ? "Ingreso" : "Gasto")}
                      </p>
                    </div>
                    {tx.note && (
                      <p className="font-body text-xs text-muted truncate">
                        {tx.note}
                      </p>
                    )}
                  </div>
                  <p
                    className={clsx(
                      "font-body tabular-nums text-[15px] font-medium shrink-0",
                      isIncome ? "text-success" : "text-ink"
                    )}
                  >
                    {isIncome ? "+" : "−"}
                    {formatMoney(Number(tx.amount), tx.currency || currency)}
                  </p>
                  {(onEdit || onDelete) && (
                    <div className="relative">
                      <button
                        type="button"
                        aria-label="Acciones"
                        aria-expanded={menuOpen}
                        onClick={() =>
                          setMenuOpenFor(menuOpen ? null : tx.id)
                        }
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted hover:text-ink hover:bg-bg-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <MoreVertical size={14} aria-hidden />
                      </button>
                      {menuOpen && (
                        <>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-hidden
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpenFor(null)}
                          />
                          <div
                            role="menu"
                            className="absolute right-0 top-full mt-1 z-20 bg-bg shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-line rounded-lg overflow-hidden min-w-[140px]"
                          >
                            {onEdit && (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenFor(null);
                                  onEdit(tx);
                                }}
                                className="w-full px-3 py-2 text-left font-body text-sm text-ink hover:bg-bg-alt inline-flex items-center gap-2"
                              >
                                <Pencil size={14} aria-hidden />
                                Editar
                              </button>
                            )}
                            {onDelete && (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenFor(null);
                                  onDelete(tx);
                                }}
                                className="w-full px-3 py-2 text-left font-body text-sm text-danger hover:bg-danger/5 inline-flex items-center gap-2"
                              >
                                <Trash2 size={14} aria-hidden />
                                Borrar
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function groupByDay(
  txs: FinanceTransaction[]
): [string, FinanceTransaction[]][] {
  const map = new Map<string, FinanceTransaction[]>();
  for (const tx of txs) {
    const key = tx.occurred_on;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function formatDayHeader(isoDay: string): string {
  // isoDay = YYYY-MM-DD — hoy/ayer/formatead largo.
  const parts = isoDay.split("-");
  if (parts.length !== 3) return isoDay;
  const [y, m, d] = parts.map((p) => Number.parseInt(p, 10));
  const target = new Date(y, m - 1, d);
  const today = new Date();
  const tDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round(
    (tDate.getTime() - target.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return target.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
