"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import type { FinanceTransaction } from "@estoicismo/supabase";
import { formatMoney, toIsoDate } from "../../lib/finance";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Vista de calendario mensual con indicadores por día.
 *
 * - Cada celda muestra el día y, si hubo movimientos, dos puntos
 *   de color: verde (ingreso) y/o rojo (gasto). Tamaño del punto
 *   relativo al máximo del mes para dar densidad visual inmediata.
 * - Navegación prev/next mes.
 * - `selectedDay` controlado por el padre: al hacer click en un día
 *   dispara `onSelectDay(isoDate)`.
 * - El padre es responsable de traer los movimientos para el mes
 *   visible (ver `visibleMonthRange`).
 */
export function CalendarView({
  monthRef,
  onChangeMonth,
  transactions,
  selectedDay,
  onSelectDay,
}: {
  monthRef: Date;
  onChangeMonth: (nextRef: Date) => void;
  transactions: FinanceTransaction[];
  selectedDay?: string | null;
  onSelectDay?: (iso: string) => void;
}) {
  const cells = useMemo(() => buildCells(monthRef), [monthRef]);

  // Sumariza por día.
  const byDay = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();
    let maxIncome = 0;
    let maxExpense = 0;
    for (const tx of transactions) {
      const cur = map.get(tx.occurred_on) ?? { income: 0, expense: 0, count: 0 };
      const amt = Number(tx.amount) || 0;
      if (tx.kind === "income") cur.income += amt;
      else cur.expense += amt;
      cur.count += 1;
      map.set(tx.occurred_on, cur);
      if (cur.income > maxIncome) maxIncome = cur.income;
      if (cur.expense > maxExpense) maxExpense = cur.expense;
    }
    return { map, maxIncome, maxExpense };
  }, [transactions]);

  const monthLabel = monthRef.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
  const todayIso = toIsoDate(new Date());

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display italic text-xl text-ink capitalize">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() =>
              onChangeMonth(
                new Date(monthRef.getFullYear(), monthRef.getMonth() - 1, 1)
              )
            }
            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-bg-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onChangeMonth(new Date())}
            className="h-9 px-3 rounded-full border border-line text-muted hover:text-ink hover:border-accent/40 font-body text-[11px] uppercase tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Hoy
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() =>
              onChangeMonth(
                new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 1)
              )
            }
            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-bg-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="h-7 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} />;
          }
          const sum = byDay.map.get(cell.iso);
          const isToday = cell.iso === todayIso;
          const isSelected = cell.iso === selectedDay;
          const hasIncome = !!sum && sum.income > 0;
          const hasExpense = !!sum && sum.expense > 0;
          const incomeSize =
            byDay.maxIncome > 0 && hasIncome
              ? scaleDotSize(sum.income / byDay.maxIncome)
              : 0;
          const expenseSize =
            byDay.maxExpense > 0 && hasExpense
              ? scaleDotSize(sum.expense / byDay.maxExpense)
              : 0;

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelectDay?.(cell.iso)}
              aria-label={`${cell.day} — ${formatDayAria(sum)}`}
              className={clsx(
                "relative aspect-square min-h-[44px] rounded-lg border transition-colors text-left p-1.5 flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isSelected
                  ? "border-accent bg-accent/10"
                  : isToday
                  ? "border-accent/60 bg-bg"
                  : "border-line bg-bg hover:border-accent/30"
              )}
            >
              <span
                className={clsx(
                  "font-body text-[11px] tabular-nums",
                  isToday ? "text-accent font-semibold" : "text-muted"
                )}
              >
                {cell.day}
              </span>
              <div className="flex-1 flex items-end justify-start gap-1 pb-0.5">
                {hasIncome && (
                  <span
                    aria-hidden
                    className="rounded-full bg-success"
                    style={{ width: incomeSize, height: incomeSize }}
                  />
                )}
                {hasExpense && (
                  <span
                    aria-hidden
                    className="rounded-full bg-danger"
                    style={{ width: expenseSize, height: expenseSize }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" aria-hidden />
          Ingreso
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger" aria-hidden />
          Gasto
        </span>
      </div>
    </div>
  );
}

export function visibleMonthRange(ref: Date): { from: string; to: string } {
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { from: toIsoDate(first), to: toIsoDate(last) };
}

// ─── internals ────────────────────────────────────────────────

type Cell = { day: number; iso: string } | null;

function buildCells(ref: Date): Cell[] {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  // Semana arranca lunes (0=Lun). getDay: 0=Dom..6=Sab. Ajustar:
  const jsFirstDay = first.getDay(); // 0=Dom
  const leading = jsFirstDay === 0 ? 6 : jsFirstDay - 1;
  const cells: Cell[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({ day: d, iso: toIsoDate(new Date(y, m, d)) });
  }
  // Relleno al final para cuadricular a múltiplo de 7
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function scaleDotSize(ratio: number): number {
  // Entre 4 y 10 px para que se vea algo pero no abrume.
  const min = 4;
  const max = 10;
  return Math.round(min + (max - min) * clamp01(ratio));
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function formatDayAria(sum?: { income: number; expense: number; count: number }): string {
  if (!sum || sum.count === 0) return "sin movimientos";
  const parts: string[] = [];
  if (sum.income > 0) parts.push(`ingreso ${formatMoney(sum.income)}`);
  if (sum.expense > 0) parts.push(`gasto ${formatMoney(sum.expense)}`);
  return parts.join(", ");
}
