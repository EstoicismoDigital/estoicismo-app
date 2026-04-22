import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type FinanceCurrency = "MXN" | "USD" | "EUR" | "COP" | "ARS" | "CLP" | "PEN" | "GTQ";

export type FinanceKind = "income" | "expense";
export type FinanceSource = "manual" | "voice" | "import";

export type FinanceCategory = {
  id: string;
  /** NULL = categoría por defecto compartida; UUID = custom del usuario. */
  user_id: string | null;
  name: string;
  kind: FinanceKind;
  icon: string;
  color: string;
  keywords: string[];
  position: number;
  created_at: string;
};

export type FinanceTransaction = {
  id: string;
  user_id: string;
  /** Siempre positivo; el signo lo da `kind`. */
  amount: number;
  currency: string;
  kind: FinanceKind;
  category_id: string | null;
  credit_card_id: string | null;
  /** YYYY-MM-DD (fecha local del usuario). */
  occurred_on: string;
  note: string | null;
  source: FinanceSource;
  created_at: string;
  updated_at: string;
};

export type FinanceCreditCard = {
  id: string;
  user_id: string;
  name: string;
  last4: string | null;
  credit_limit: number;
  current_balance: number;
  apr: number;
  cut_day: number | null;
  due_day: number | null;
  color: string;
  currency: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type FinanceDebtKind =
  | "credit_card"
  | "personal_loan"
  | "mortgage"
  | "auto"
  | "student"
  | "family"
  | "other";

export type FinanceDebt = {
  id: string;
  user_id: string;
  name: string;
  kind: FinanceDebtKind;
  credit_card_id: string | null;
  balance: number;
  minimum_payment: number;
  apr: number;
  due_day: number | null;
  currency: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
};

export type FinanceQuoteTag =
  | "general"
  | "savings"
  | "debt"
  | "invest"
  | "mindset"
  | "budget";

export type FinanceQuote = {
  id: string;
  text: string;
  author: string;
  source: string | null;
  lang: string;
  tag: FinanceQuoteTag;
};

// ─────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────

export type CreateTransactionInput = {
  amount: number;
  kind: FinanceKind;
  category_id: string | null;
  credit_card_id?: string | null;
  occurred_on: string; // YYYY-MM-DD
  note?: string | null;
  currency?: string;
  source?: FinanceSource;
};

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export type CreateCreditCardInput = {
  name: string;
  last4?: string | null;
  credit_limit: number;
  current_balance?: number;
  apr?: number;
  cut_day?: number | null;
  due_day?: number | null;
  color?: string;
  currency?: string;
};

export type UpdateCreditCardInput = Partial<CreateCreditCardInput> & {
  is_archived?: boolean;
};

export type CreateDebtInput = {
  name: string;
  kind: FinanceDebtKind;
  credit_card_id?: string | null;
  balance: number;
  minimum_payment?: number;
  apr?: number;
  due_day?: number | null;
  currency?: string;
};

export type UpdateDebtInput = Partial<CreateDebtInput> & {
  is_paid?: boolean;
};

export type CreateCategoryInput = {
  name: string;
  kind: FinanceKind;
  icon?: string;
  color?: string;
  keywords?: string[];
};

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────

/**
 * Devuelve TODAS las categorías visibles para el usuario — defaults
 * (user_id IS NULL) y las propias. RLS ya filtra ajenas.
 */
export async function fetchFinanceCategories(
  sb: SB
): Promise<FinanceCategory[]> {
  const { data, error } = await sb
    .from("finance_categories")
    .select("*")
    .order("kind", { ascending: true })
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as FinanceCategory[];
}

export async function createFinanceCategory(
  sb: SB,
  userId: string,
  input: CreateCategoryInput
): Promise<FinanceCategory> {
  const { data, error } = await sb
    .from("finance_categories")
    .insert({
      user_id: userId,
      name: input.name,
      kind: input.kind,
      icon: input.icon ?? "circle",
      color: input.color ?? "#6B7280",
      keywords: input.keywords ?? [],
      position: 50,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceCategory;
}

export async function deleteFinanceCategory(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("finance_categories").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────────────────────

export async function fetchTransactions(
  sb: SB,
  userId: string,
  opts: { from?: string; to?: string; limit?: number } = {}
): Promise<FinanceTransaction[]> {
  let q = sb
    .from("finance_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FinanceTransaction[];
}

export async function createTransaction(
  sb: SB,
  userId: string,
  input: CreateTransactionInput
): Promise<FinanceTransaction> {
  const { data, error } = await sb
    .from("finance_transactions")
    .insert({
      user_id: userId,
      amount: input.amount,
      kind: input.kind,
      category_id: input.category_id,
      credit_card_id: input.credit_card_id ?? null,
      occurred_on: input.occurred_on,
      note: input.note ?? null,
      currency: input.currency ?? "MXN",
      source: input.source ?? "manual",
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceTransaction;
}

export async function updateTransaction(
  sb: SB,
  id: string,
  input: UpdateTransactionInput
): Promise<FinanceTransaction> {
  const { data, error } = await sb
    .from("finance_transactions")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceTransaction;
}

export async function deleteTransaction(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("finance_transactions").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// CREDIT CARDS
// ─────────────────────────────────────────────────────────────

export async function fetchCreditCards(
  sb: SB,
  userId: string
): Promise<FinanceCreditCard[]> {
  const { data, error } = await sb
    .from("finance_credit_cards")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as FinanceCreditCard[];
}

export async function createCreditCard(
  sb: SB,
  userId: string,
  input: CreateCreditCardInput
): Promise<FinanceCreditCard> {
  const { data, error } = await sb
    .from("finance_credit_cards")
    .insert({
      user_id: userId,
      name: input.name,
      last4: input.last4 ?? null,
      credit_limit: input.credit_limit,
      current_balance: input.current_balance ?? 0,
      apr: input.apr ?? 0,
      cut_day: input.cut_day ?? null,
      due_day: input.due_day ?? null,
      color: input.color ?? "#22774E",
      currency: input.currency ?? "MXN",
      is_archived: false,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceCreditCard;
}

export async function updateCreditCard(
  sb: SB,
  id: string,
  input: UpdateCreditCardInput
): Promise<FinanceCreditCard> {
  const { data, error } = await sb
    .from("finance_credit_cards")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceCreditCard;
}

export async function deleteCreditCard(sb: SB, id: string): Promise<void> {
  // Archivamos en vez de borrar para preservar el historial de transacciones.
  const { error } = await sb
    .from("finance_credit_cards")
    .update({ is_archived: true } as never)
    .eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// DEBTS
// ─────────────────────────────────────────────────────────────

export async function fetchDebts(sb: SB, userId: string): Promise<FinanceDebt[]> {
  const { data, error } = await sb
    .from("finance_debts")
    .select("*")
    .eq("user_id", userId)
    .order("is_paid", { ascending: true })
    .order("apr", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as FinanceDebt[];
}

export async function createDebt(
  sb: SB,
  userId: string,
  input: CreateDebtInput
): Promise<FinanceDebt> {
  const { data, error } = await sb
    .from("finance_debts")
    .insert({
      user_id: userId,
      name: input.name,
      kind: input.kind,
      credit_card_id: input.credit_card_id ?? null,
      balance: input.balance,
      minimum_payment: input.minimum_payment ?? 0,
      apr: input.apr ?? 0,
      due_day: input.due_day ?? null,
      currency: input.currency ?? "MXN",
      is_paid: false,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceDebt;
}

export async function updateDebt(
  sb: SB,
  id: string,
  input: UpdateDebtInput
): Promise<FinanceDebt> {
  const { data, error } = await sb
    .from("finance_debts")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceDebt;
}

export async function deleteDebt(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("finance_debts").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// QUOTES
// ─────────────────────────────────────────────────────────────

export async function fetchFinanceQuotes(
  sb: SB,
  tag?: FinanceQuoteTag
): Promise<FinanceQuote[]> {
  let q = sb.from("finance_quotes").select("*");
  if (tag) q = q.eq("tag", tag);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FinanceQuote[];
}
