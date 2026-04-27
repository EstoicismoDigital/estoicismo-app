"use client";
import { useMemo } from "react";
import { Users2, Trophy, Repeat } from "lucide-react";
import { useBusinessSales, useClients } from "../../hooks/useBusiness";
import { computeLtv } from "../../lib/business/ltv";
import { formatMoney } from "../../lib/finance";

/**
 * Customer LTV Card.
 *
 * Muestra:
 *  - Top 5 clientes por gasto total
 *  - Avg LTV + Avg ticket
 *  - Repeat rate (% de clientes con > 1 compra)
 *
 * Si no hay ventas con cliente identificado, no renderiza.
 */
export function CustomerLtvCard() {
  const { data: sales = [] } = useBusinessSales({ limit: 1000 });
  const { data: clients = [] } = useClients({ include_archived: true });

  const ltv = useMemo(() => {
    try {
      return computeLtv(sales, clients);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("LTV computation failed:", err);
      return null;
    }
  }, [sales, clients]);

  if (!ltv || ltv.byClient.length === 0) return null;

  const top5 = ltv.byClient.slice(0, 5);
  const repeatPct = Math.round(ltv.repeatRate * 100);

  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users2 size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Clientes · LTV
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat
          label="Avg LTV"
          value={formatMoney(ltv.avgLtv, ltv.currency)}
        />
        <Stat
          label="Avg ticket"
          value={formatMoney(ltv.avgTicket, ltv.currency)}
        />
        <Stat
          label="Repetición"
          value={`${repeatPct}%`}
          icon={<Repeat size={11} />}
        />
      </div>

      {/* Top clients */}
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2 inline-flex items-center gap-1">
        <Trophy size={11} className="text-accent" /> Top {top5.length}
      </p>
      <ul className="space-y-1.5">
        {top5.map((c, i) => (
          <li
            key={c.clientId ?? i}
            className="flex items-center gap-2 rounded-lg border border-line bg-bg p-2.5"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted tabular-nums w-5 text-center shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-ink truncate">
                {c.clientName}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
                {c.purchaseCount} compras · ticket{" "}
                {formatMoney(c.avgTicket, ltv.currency)}
              </p>
            </div>
            <p className="font-display italic text-base text-ink tabular-nums shrink-0">
              {formatMoney(c.totalSpent, ltv.currency)}
            </p>
          </li>
        ))}
      </ul>

      {/* Footer insight */}
      {repeatPct > 0 && (
        <p className="font-body text-xs text-muted mt-4 leading-relaxed border-l-2 border-accent/30 pl-3">
          {repeatPct >= 40
            ? "Tienes recurrencia sólida. Conservar a un cliente cuesta menos que conseguir uno nuevo."
            : repeatPct >= 20
              ? "La mitad de tus clientes vuelven. Contacta a los que no — un mensaje vale oro."
              : "La mayoría compra una vez y no vuelve. Pregúntate qué falta para que regresen."}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted inline-flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </p>
      <p className="font-display italic text-base text-ink tabular-nums">
        {value}
      </p>
    </div>
  );
}
