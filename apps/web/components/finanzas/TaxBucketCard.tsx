"use client";
import { useMemo } from "react";
import { Receipt } from "lucide-react";
import { useTransactions, useFinanceCategories } from "../../hooks/useFinance";
import { formatMoney } from "../../lib/finance";

/**
 * TaxBucketCard · muestra el total de transacciones marcadas como
 * tax_deductible en el año en curso, con desglose por categoría.
 * Útil para preparar declaración.
 *
 * Si no hay nada marcado, no renderiza (evita ruido).
 */
export function TaxBucketCard() {
  const range = useMemo(() => {
    const year = new Date().getFullYear();
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }, []);

  const { data: txs = [] } = useTransactions(range);
  const { data: cats = [] } = useFinanceCategories();

  const stats = useMemo(() => {
    const deductible = txs.filter((t) => t.tax_deductible);
    if (deductible.length === 0) return null;
    const total = deductible.reduce((acc, t) => acc + Number(t.amount), 0);
    const currency = deductible[0]?.currency ?? "MXN";
    // Desglose por categoría
    const byCat = new Map<string | null, { name: string; color: string; total: number; count: number }>();
    for (const t of deductible) {
      const cat = cats.find((c) => c.id === t.category_id);
      const key = t.category_id ?? null;
      const existing = byCat.get(key);
      if (existing) {
        existing.total += Number(t.amount);
        existing.count += 1;
      } else {
        byCat.set(key, {
          name: cat?.name ?? "Sin categoría",
          color: cat?.color ?? "#999",
          total: Number(t.amount),
          count: 1,
        });
      }
    }
    const breakdown = Array.from(byCat.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    return { count: deductible.length, total, currency, breakdown };
  }, [txs, cats]);

  if (!stats) return null;

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <Receipt size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Deducible · {new Date().getFullYear()}
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex items-baseline gap-2 flex-wrap mb-3">
        <p className="font-display italic text-2xl text-ink tabular-nums">
          {formatMoney(stats.total, stats.currency)}
        </p>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {stats.count}{" "}
          {stats.count === 1 ? "transacción" : "transacciones"} marcadas
        </span>
      </div>

      {/* Desglose por categoría */}
      <ul className="space-y-1.5 mb-3">
        {stats.breakdown.map((b) => {
          const pct = stats.total > 0 ? (b.total / stats.total) * 100 : 0;
          return (
            <li key={b.name} className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: b.color }}
              />
              <span className="font-body text-xs text-ink truncate flex-1">
                {b.name}
              </span>
              <span className="font-body text-xs text-muted tabular-nums">
                {pct.toFixed(0)}%
              </span>
              <span className="font-body text-xs text-ink tabular-nums w-20 text-right">
                {formatMoney(b.total, stats.currency)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="font-body text-xs text-muted leading-relaxed">
        Marca cada gasto deducible al registrarlo. Tu yo de marzo te
        agradece tener esto listo para la declaración.
      </p>
    </section>
  );
}
