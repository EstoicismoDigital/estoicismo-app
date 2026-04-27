/**
 * Net Worth = activos - pasivos.
 *
 * Activos:
 *   - Sumar `current_balance` de finance_accounts donde
 *     `include_in_net_worth = true` y `is_archived = false`.
 *   - Sumar `saved_amount` de savings_goals (computado del lado
 *     cliente con sumContributionsByGoal).
 *
 * Pasivos:
 *   - Sumar `balance` de finance_debts donde `is_paid = false`.
 *   - Sumar `current_balance` de finance_credit_cards (la deuda en
 *     tarjetas que aún no se ha pagado).
 *
 * Net worth = activos - pasivos.
 *
 * Sin conversión de moneda (asume que todas están en la misma).
 * En MVP simplificamos — si el user mezcla MXN y USD lo notará.
 */

import type {
  FinanceAccount,
  FinanceDebt,
  FinanceCreditCard,
  SavingsGoal,
  SavingsContribution,
} from "@estoicismo/supabase";
import { sumContributionsByGoal } from "@estoicismo/supabase";

export type NetWorthSnapshot = {
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  breakdown: {
    accounts: { name: string; balance: number; color: string }[];
    savings: { name: string; balance: number; color: string }[];
    debts: { name: string; balance: number }[];
    cards: { name: string; balance: number }[];
  };
  /** Currencies presentes — para warning si hay mezcla. */
  currencies: Set<string>;
};

export function computeNetWorth(args: {
  accounts: FinanceAccount[];
  goals: SavingsGoal[];
  contributions: SavingsContribution[];
  debts: FinanceDebt[];
  cards: FinanceCreditCard[];
}): NetWorthSnapshot {
  const { accounts, goals, contributions, debts, cards } = args;
  const currencies = new Set<string>();

  // Cuentas (solo include_in_net_worth)
  const accountBreakdown: { name: string; balance: number; color: string }[] = [];
  let assetsTotal = 0;
  for (const a of accounts) {
    if (!a.include_in_net_worth || a.is_archived) continue;
    const b = Number(a.current_balance);
    accountBreakdown.push({ name: a.name, balance: b, color: a.color });
    assetsTotal += b;
    currencies.add(a.currency);
  }

  // Savings goals — su saldo cuenta como activo (es dinero "guardado")
  const savingsByGoal = sumContributionsByGoal(contributions);
  const savingsBreakdown: { name: string; balance: number; color: string }[] = [];
  for (const g of goals) {
    if (g.is_completed) continue; // ya cobraste, ya no es activo
    const b = savingsByGoal.get(g.id) ?? 0;
    if (b > 0) {
      savingsBreakdown.push({ name: g.name, balance: b, color: g.color });
      assetsTotal += b;
      currencies.add(g.currency);
    }
  }

  // Pasivos
  const debtBreakdown: { name: string; balance: number }[] = [];
  let liabilitiesTotal = 0;
  for (const d of debts) {
    if (d.is_paid) continue;
    const b = Number(d.balance);
    debtBreakdown.push({ name: d.name, balance: b });
    liabilitiesTotal += b;
    currencies.add(d.currency);
  }
  const cardBreakdown: { name: string; balance: number }[] = [];
  for (const c of cards) {
    if (c.is_archived) continue;
    const b = Number(c.current_balance);
    if (b > 0) {
      cardBreakdown.push({ name: c.name, balance: b });
      liabilitiesTotal += b;
      currencies.add(c.currency);
    }
  }

  return {
    assetsTotal: Math.round(assetsTotal * 100) / 100,
    liabilitiesTotal: Math.round(liabilitiesTotal * 100) / 100,
    netWorth: Math.round((assetsTotal - liabilitiesTotal) * 100) / 100,
    breakdown: {
      accounts: accountBreakdown,
      savings: savingsBreakdown,
      debts: debtBreakdown,
      cards: cardBreakdown,
    },
    currencies,
  };
}
