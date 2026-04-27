import type { BusinessSale, BusinessClient } from "@estoicismo/supabase";

/**
 * Customer Lifetime Value (LTV).
 *
 * Cálculos básicos sin asumir cohortes:
 *   - LTV por cliente = sum(sales del cliente).
 *   - Avg ticket = sum(sales) / count(sales).
 *   - Avg LTV = sum(sales) / count(distinct clientes).
 *   - Top clientes ordenados por LTV.
 *   - Repeat rate = % de clientes con > 1 compra.
 *
 * No proyecta — solo describe el comportamiento histórico.
 */

export type ClientLtv = {
  clientId: string | null;
  clientName: string;
  totalSpent: number;
  purchaseCount: number;
  avgTicket: number;
  firstPurchase: string | null;
  lastPurchase: string | null;
};

export type LtvSnapshot = {
  /** Clientes ordenados por totalSpent desc. */
  byClient: ClientLtv[];
  /** Avg LTV (entre clientes que sí están en el sistema). */
  avgLtv: number;
  /** Avg ticket por venta. */
  avgTicket: number;
  /** % de clientes con compra repetida. */
  repeatRate: number;
  /** Total ventas (solo identificadas con cliente). */
  totalIdentifiedSales: number;
  /** Total ventas (todas, incluyendo anónimas). */
  totalAllSales: number;
  currency: string;
};

export function computeLtv(
  sales: BusinessSale[],
  clients: BusinessClient[]
): LtvSnapshot {
  const clientMap = new Map<string, BusinessClient>();
  for (const c of clients) clientMap.set(c.id, c);

  const aggregateByClient = new Map<string, ClientLtv>();
  let totalAllSales = 0;
  let totalIdentified = 0;
  let identifiedSalesCount = 0;
  let currency = "MXN";

  for (const s of sales) {
    const amt = Number(s.amount);
    totalAllSales += amt;
    if (s.currency) currency = s.currency;

    if (!s.client_id) continue;

    totalIdentified += amt;
    identifiedSalesCount += 1;
    const client = clientMap.get(s.client_id);
    const id = s.client_id;
    const existing = aggregateByClient.get(id);
    if (existing) {
      existing.totalSpent += amt;
      existing.purchaseCount += 1;
      existing.avgTicket = existing.totalSpent / existing.purchaseCount;
      if (s.occurred_on < (existing.firstPurchase ?? "9999-12-31"))
        existing.firstPurchase = s.occurred_on;
      if (s.occurred_on > (existing.lastPurchase ?? "0000-01-01"))
        existing.lastPurchase = s.occurred_on;
    } else {
      aggregateByClient.set(id, {
        clientId: id,
        clientName: client?.name ?? "Cliente sin nombre",
        totalSpent: amt,
        purchaseCount: 1,
        avgTicket: amt,
        firstPurchase: s.occurred_on,
        lastPurchase: s.occurred_on,
      });
    }
  }

  const byClient = Array.from(aggregateByClient.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent
  );

  const avgLtv = byClient.length > 0 ? totalIdentified / byClient.length : 0;
  const avgTicket =
    identifiedSalesCount > 0 ? totalIdentified / identifiedSalesCount : 0;
  const repeaters = byClient.filter((c) => c.purchaseCount > 1).length;
  const repeatRate = byClient.length > 0 ? repeaters / byClient.length : 0;

  return {
    byClient,
    avgLtv,
    avgTicket,
    repeatRate,
    totalIdentifiedSales: totalIdentified,
    totalAllSales,
    currency,
  };
}
