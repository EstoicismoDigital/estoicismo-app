"use client";
import { useMemo } from "react";
import { Receipt, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTransactions } from "../../hooks/useFinance";
import { formatMoney } from "../../lib/finance";

/**
 * TaxBucketCard · muestra el total de transacciones marcadas como
 * tax_deductible en el año en curso. Útil para preparar declaración.
 *
 * Si no hay nada marcado, no renderiza (evita ruido).
 */
export function TaxBucketCard() {
  const range = useMemo(() => {
    const year = new Date().getFullYear();
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }, []);

  const { data: txs = [] } = useTransactions(range);

  const stats = useMemo(() => {
    const deductible = txs.filter((t) => t.tax_deductible);
    if (deductible.length === 0) return null;
    const total = deductible.reduce((acc, t) => acc + Number(t.amount), 0);
    const currency = deductible[0]?.currency ?? "MXN";
    return { count: deductible.length, total, currency };
  }, [txs]);

  if (!stats) return null;

  return (
    <Link
      href="/finanzas"
      className="block rounded-card border border-line bg-bg-alt/40 p-4 sm:p-5 hover:border-line-strong transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <Receipt size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Deducible · {new Date().getFullYear()}
        </p>
        <span className="h-px flex-1 bg-line" />
        <ArrowRight size={12} className="text-muted" />
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="font-display italic text-2xl text-ink tabular-nums">
          {formatMoney(stats.total, stats.currency)}
        </p>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          en {stats.count}{" "}
          {stats.count === 1 ? "transacción" : "transacciones"} marcadas
        </span>
      </div>
      <p className="font-body text-xs text-muted mt-2 leading-relaxed">
        Marca cada gasto deducible al registrarlo. Tu yo de marzo te
        agradece tener esto listo para la declaración.
      </p>
    </Link>
  );
}
