"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { useRecurring, useSubscriptions } from "../../hooks/useFinance";
import {
  nextRecurringOccurrence,
  nextSubscriptionRenewal,
  daysUntil,
} from "../../lib/finance/recurring";
import { formatMoney } from "../../lib/finance";

/**
 * Banner sutil que aparece SOLO si hay una recurrencia o suscripción
 * que vence en los próximos 5 días. Discreto, accionable.
 *
 * Pensado para vivir arriba en /hoy o /finanzas. Si no hay nada
 * próximo, no renderiza nada.
 */
export function UpcomingDueBanner({ days = 5 }: { days?: number }) {
  const { data: recurring = [] } = useRecurring({ only_active: true });
  const { data: subscriptions = [] } = useSubscriptions({
    status: ["active", "trial"],
  });

  const upcoming = useMemo(() => {
    const items: {
      id: string;
      kind: "recurring" | "subscription";
      label: string;
      dateIso: string;
      amount: number;
      currency: string;
      daysAway: number;
    }[] = [];

    try {
      for (const r of recurring) {
        const next = nextRecurringOccurrence(r);
        if (!next) continue;
        const d = daysUntil(next);
        if (d >= 0 && d <= days) {
          items.push({
            id: r.id,
            kind: "recurring",
            label: r.name,
            dateIso: next,
            amount: Number(r.amount),
            currency: r.currency,
            daysAway: d,
          });
        }
      }
      for (const s of subscriptions) {
        const next = nextSubscriptionRenewal(s);
        if (!next) continue;
        const d = daysUntil(next);
        if (d >= 0 && d <= days) {
          items.push({
            id: s.id,
            kind: "subscription",
            label: s.name,
            dateIso: next,
            amount: Number(s.amount),
            currency: s.currency,
            daysAway: d,
          });
        }
      }
      items.sort((a, b) => a.daysAway - b.daysAway);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("UpcomingDueBanner failed:", err);
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurring, subscriptions, days]);

  if (upcoming.length === 0) return null;

  const top = upcoming[0];
  const others = upcoming.length - 1;

  return (
    <Link
      href="/finanzas/recurrentes"
      className="block rounded-card border border-accent/30 bg-accent/5 p-3 sm:p-4 hover:bg-accent/10 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-accent text-bg flex items-center justify-center shrink-0">
          <Calendar size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-0.5">
            {top.daysAway === 0
              ? "Vence hoy"
              : top.daysAway === 1
                ? "Vence mañana"
                : `Vence en ${top.daysAway} días`}
          </p>
          <p className="font-body text-sm text-ink truncate">
            {top.label} ·{" "}
            <span className="font-display italic">
              {formatMoney(top.amount, top.currency)}
            </span>
            {others > 0 && (
              <span className="font-mono text-[10px] text-muted ml-2">
                +{others} más esta semana
              </span>
            )}
          </p>
        </div>
        <ArrowRight size={14} className="text-accent shrink-0" />
      </div>
    </Link>
  );
}
