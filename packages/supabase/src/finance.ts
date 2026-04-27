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
  /** Cuenta (efectivo/banco/ahorros) opcional. */
  account_id: string | null;
  /** Si la transacción nació de un recurring template. */
  recurring_id: string | null;
  /** YYYY-MM-DD (fecha local del usuario). */
  occurred_on: string;
  note: string | null;
  source: FinanceSource;
  /** Marca para deducción fiscal — el user lo agrupa en /finanzas/impuestos. */
  tax_deductible: boolean;
  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────────────────────
// ACCOUNTS — cuentas (efectivo, banco, ahorros, etc)
// ─────────────────────────────────────────────────────────────

export type FinanceAccountKind =
  | "cash"
  | "checking"
  | "savings"
  | "investment"
  | "crypto"
  | "other";

export type FinanceAccount = {
  id: string;
  user_id: string;
  name: string;
  kind: FinanceAccountKind;
  current_balance: number;
  currency: string;
  color: string;
  icon: string;
  include_in_net_worth: boolean;
  is_archived: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAccountInput = {
  name: string;
  kind?: FinanceAccountKind;
  current_balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  include_in_net_worth?: boolean;
  notes?: string | null;
};

export type UpdateAccountInput = Partial<CreateAccountInput> & {
  is_archived?: boolean;
};

// ─────────────────────────────────────────────────────────────
// RECURRING — plantilla de transacción recurrente
// ─────────────────────────────────────────────────────────────

export type RecurringCadence = "weekly" | "biweekly" | "monthly" | "yearly";

export type FinanceRecurring = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  kind: FinanceKind;
  category_id: string | null;
  account_id: string | null;
  cadence: RecurringCadence;
  day_of_period: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateRecurringInput = {
  name: string;
  amount: number;
  kind: FinanceKind;
  category_id?: string | null;
  account_id?: string | null;
  cadence?: RecurringCadence;
  day_of_period: number;
  start_date?: string;
  end_date?: string | null;
  currency?: string;
  notes?: string | null;
};

export type UpdateRecurringInput = Partial<CreateRecurringInput> & {
  is_active?: boolean;
};

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTIONS — Netflix, Spotify, software, gym, etc.
// ─────────────────────────────────────────────────────────────

export type SubscriptionCadence = "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "trial";

export type FinanceSubscription = {
  id: string;
  user_id: string;
  name: string;
  vendor: string | null;
  amount: number;
  currency: string;
  cadence: SubscriptionCadence;
  renewal_day: number;
  category_id: string | null;
  status: SubscriptionStatus;
  trial_ends_on: string | null;
  notes: string | null;
  service_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSubscriptionInput = {
  name: string;
  vendor?: string | null;
  amount: number;
  currency?: string;
  cadence?: SubscriptionCadence;
  renewal_day: number;
  category_id?: string | null;
  status?: SubscriptionStatus;
  trial_ends_on?: string | null;
  notes?: string | null;
  service_url?: string | null;
};

export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>;

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
  /** Snapshot del balance al crear la deuda. Sirve para "% pagado". */
  original_balance: number;
  minimum_payment: number;
  apr: number;
  due_day: number | null;
  currency: string;
  is_paid: boolean;
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FinanceDebtPayment = {
  id: string;
  user_id: string;
  debt_id: string;
  amount: number;
  principal_paid: number;
  interest_paid: number;
  transaction_id: string | null;
  occurred_on: string;
  note: string | null;
  created_at: string;
};

export type PayoffStrategy = "avalanche" | "snowball" | "custom";

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
  account_id?: string | null;
  recurring_id?: string | null;
  occurred_on: string; // YYYY-MM-DD
  note?: string | null;
  currency?: string;
  source?: FinanceSource;
  tax_deductible?: boolean;
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
  original_balance?: number;
  minimum_payment?: number;
  apr?: number;
  due_day?: number | null;
  currency?: string;
  start_date?: string | null;
  notes?: string | null;
};

export type UpdateDebtInput = Partial<CreateDebtInput> & {
  is_paid?: boolean;
};

export type CreateDebtPaymentInput = {
  debt_id: string;
  amount: number;
  /** Si no se da, el cliente debe calcular split a partir de balance × APR. */
  principal_paid?: number;
  interest_paid?: number;
  occurred_on?: string;
  note?: string | null;
  transaction_id?: string | null;
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
      account_id: input.account_id ?? null,
      recurring_id: input.recurring_id ?? null,
      occurred_on: input.occurred_on,
      note: input.note ?? null,
      currency: input.currency ?? "MXN",
      source: input.source ?? "manual",
      tax_deductible: input.tax_deductible ?? false,
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

export async function fetchDebts(
  sb: SB,
  userId: string,
  opts: { include_paid?: boolean } = {}
): Promise<FinanceDebt[]> {
  let q = sb
    .from("finance_debts")
    .select("*")
    .eq("user_id", userId)
    .order("is_paid", { ascending: true })
    .order("apr", { ascending: false })
    .order("created_at", { ascending: true });
  if (!opts.include_paid) q = q.eq("is_paid", false);
  const { data, error } = await q;
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
      original_balance: input.original_balance ?? input.balance,
      minimum_payment: input.minimum_payment ?? 0,
      apr: input.apr ?? 0,
      due_day: input.due_day ?? null,
      currency: input.currency ?? "MXN",
      is_paid: false,
      start_date: input.start_date ?? null,
      notes: input.notes ?? null,
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
// DEBT PAYMENTS
// ─────────────────────────────────────────────────────────────

/**
 * Lista de pagos del usuario, opcionalmente filtrados por deuda.
 * Ordenados por fecha desc.
 */
export async function fetchDebtPayments(
  sb: SB,
  userId: string,
  opts: { debt_id?: string; limit?: number; from?: string; to?: string } = {}
): Promise<FinanceDebtPayment[]> {
  let q = sb
    .from("finance_debt_payments")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts.debt_id) q = q.eq("debt_id", opts.debt_id);
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FinanceDebtPayment[];
}

/**
 * Registra un pago a una deuda. Si NO se proveen los splits
 * (principal_paid / interest_paid), se calculan en función del
 * balance vigente y la APR mensual aproximada.
 *
 * Después actualiza el balance de la deuda restando el principal.
 * Si el balance llega a 0 o menos, marca is_paid = true.
 */
export async function createDebtPayment(
  sb: SB,
  userId: string,
  input: CreateDebtPaymentInput
): Promise<{ payment: FinanceDebtPayment; debt: FinanceDebt }> {
  // 1. Leer deuda actual.
  const { data: debt, error: debtErr } = await sb
    .from("finance_debts")
    .select("*")
    .eq("id", input.debt_id)
    .eq("user_id", userId)
    .single();
  if (debtErr) throw debtErr;
  const d = debt as unknown as FinanceDebt;

  // 2. Calcular split si no viene.
  // Interés mensual ≈ balance × APR/12 (APR en %, así que /100).
  const monthlyInterestRaw = (d.balance * (d.apr ?? 0)) / 100 / 12;
  const interestRaw = input.interest_paid ?? Math.min(monthlyInterestRaw, input.amount);
  const principalRaw = input.principal_paid ?? Math.max(0, input.amount - interestRaw);
  const interest_paid = Math.round(interestRaw * 100) / 100;
  const principal_paid = Math.round(principalRaw * 100) / 100;

  // 3. Crear el payment.
  const today = new Date().toISOString().slice(0, 10);
  const { data: payment, error: payErr } = await sb
    .from("finance_debt_payments")
    .insert({
      user_id: userId,
      debt_id: input.debt_id,
      amount: input.amount,
      principal_paid,
      interest_paid,
      transaction_id: input.transaction_id ?? null,
      occurred_on: input.occurred_on ?? today,
      note: input.note ?? null,
    } as never)
    .select()
    .single();
  if (payErr) throw payErr;

  // 4. Update balance de la deuda.
  const newBalance = Math.max(0, Math.round((d.balance - principal_paid) * 100) / 100);
  const isPaid = newBalance <= 0;
  const { data: updatedDebt, error: updErr } = await sb
    .from("finance_debts")
    .update({ balance: newBalance, is_paid: isPaid } as never)
    .eq("id", d.id)
    .select()
    .single();
  if (updErr) throw updErr;

  return {
    payment: payment as unknown as FinanceDebtPayment,
    debt: updatedDebt as unknown as FinanceDebt,
  };
}

export async function deleteDebtPayment(sb: SB, id: string): Promise<void> {
  // Nota: NO revierte el balance — lo dejamos así porque los pagos
  // del histórico real no deberían "deshacer" el cambio de balance
  // automáticamente; si el usuario quiere revertir, debe editar la
  // deuda manualmente. Mantiene auditoría limpia.
  const { error } = await sb.from("finance_debt_payments").delete().eq("id", id);
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

// ─────────────────────────────────────────────────────────────
// ACCOUNTS — queries
// ─────────────────────────────────────────────────────────────

export async function fetchAccounts(
  sb: SB,
  userId: string,
  opts: { include_archived?: boolean } = {}
): Promise<FinanceAccount[]> {
  let q = sb
    .from("finance_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("is_archived", { ascending: true })
    .order("created_at", { ascending: true });
  if (!opts.include_archived) q = q.eq("is_archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FinanceAccount[];
}

export async function createAccount(
  sb: SB,
  userId: string,
  input: CreateAccountInput
): Promise<FinanceAccount> {
  const { data, error } = await sb
    .from("finance_accounts")
    .insert({
      user_id: userId,
      name: input.name,
      kind: input.kind ?? "cash",
      current_balance: input.current_balance ?? 0,
      currency: input.currency ?? "MXN",
      color: input.color ?? "#22774E",
      icon: input.icon ?? "wallet",
      include_in_net_worth: input.include_in_net_worth ?? true,
      notes: input.notes ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceAccount;
}

export async function updateAccount(
  sb: SB,
  id: string,
  input: UpdateAccountInput
): Promise<FinanceAccount> {
  const { data, error } = await sb
    .from("finance_accounts")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceAccount;
}

export async function deleteAccount(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("finance_accounts").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// RECURRING — queries
// ─────────────────────────────────────────────────────────────

export async function fetchRecurring(
  sb: SB,
  userId: string,
  opts: { only_active?: boolean } = {}
): Promise<FinanceRecurring[]> {
  let q = sb
    .from("finance_recurring")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (opts.only_active !== false) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FinanceRecurring[];
}

export async function createRecurring(
  sb: SB,
  userId: string,
  input: CreateRecurringInput
): Promise<FinanceRecurring> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("finance_recurring")
    .insert({
      user_id: userId,
      name: input.name,
      amount: input.amount,
      kind: input.kind,
      category_id: input.category_id ?? null,
      account_id: input.account_id ?? null,
      cadence: input.cadence ?? "monthly",
      day_of_period: input.day_of_period,
      start_date: input.start_date ?? today,
      end_date: input.end_date ?? null,
      currency: input.currency ?? "MXN",
      notes: input.notes ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceRecurring;
}

export async function updateRecurring(
  sb: SB,
  id: string,
  input: UpdateRecurringInput
): Promise<FinanceRecurring> {
  const { data, error } = await sb
    .from("finance_recurring")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceRecurring;
}

export async function deleteRecurring(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("finance_recurring").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTIONS — queries
// ─────────────────────────────────────────────────────────────

export async function fetchSubscriptions(
  sb: SB,
  userId: string,
  opts: { status?: SubscriptionStatus[] } = {}
): Promise<FinanceSubscription[]> {
  let q = sb
    .from("finance_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("renewal_day", { ascending: true });
  if (opts.status && opts.status.length > 0) {
    q = q.in("status", opts.status);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FinanceSubscription[];
}

export async function createSubscription(
  sb: SB,
  userId: string,
  input: CreateSubscriptionInput
): Promise<FinanceSubscription> {
  const { data, error } = await sb
    .from("finance_subscriptions")
    .insert({
      user_id: userId,
      name: input.name,
      vendor: input.vendor ?? null,
      amount: input.amount,
      currency: input.currency ?? "MXN",
      cadence: input.cadence ?? "monthly",
      renewal_day: input.renewal_day,
      category_id: input.category_id ?? null,
      status: input.status ?? "active",
      trial_ends_on: input.trial_ends_on ?? null,
      notes: input.notes ?? null,
      service_url: input.service_url ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceSubscription;
}

export async function updateSubscription(
  sb: SB,
  id: string,
  input: UpdateSubscriptionInput
): Promise<FinanceSubscription> {
  const { data, error } = await sb
    .from("finance_subscriptions")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceSubscription;
}

export async function deleteSubscription(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("finance_subscriptions").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// INVESTMENTS — portafolio manual (#54)
// ─────────────────────────────────────────────────────────────

export type InvestmentKind =
  | "stock"
  | "etf"
  | "crypto"
  | "real_estate"
  | "fund"
  | "other";

export type FinanceInvestment = {
  id: string;
  user_id: string;
  name: string;
  kind: InvestmentKind;
  symbol: string | null;
  quantity: number | null;
  avg_buy_price: number | null;
  current_value: number;
  currency: string;
  include_in_net_worth: boolean;
  notes: string | null;
  last_priced_at: string | null;
  is_archived: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type CreateInvestmentInput = {
  name: string;
  kind?: InvestmentKind;
  symbol?: string | null;
  quantity?: number | null;
  avg_buy_price?: number | null;
  current_value: number;
  currency?: string;
  include_in_net_worth?: boolean;
  notes?: string | null;
  position?: number;
};

export type UpdateInvestmentInput = Partial<CreateInvestmentInput> & {
  is_archived?: boolean;
  last_priced_at?: string | null;
};

export async function fetchInvestments(
  sb: SB,
  userId: string,
  opts: { include_archived?: boolean } = {}
): Promise<FinanceInvestment[]> {
  let q = sb
    .from("finance_investments")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (!opts.include_archived) q = q.eq("is_archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FinanceInvestment[];
}

export async function createInvestment(
  sb: SB,
  userId: string,
  input: CreateInvestmentInput
): Promise<FinanceInvestment> {
  const { data, error } = await sb
    .from("finance_investments")
    .insert({
      user_id: userId,
      name: input.name,
      kind: input.kind ?? "stock",
      symbol: input.symbol ?? null,
      quantity: input.quantity ?? null,
      avg_buy_price: input.avg_buy_price ?? null,
      current_value: input.current_value,
      currency: input.currency ?? "MXN",
      include_in_net_worth: input.include_in_net_worth ?? true,
      notes: input.notes ?? null,
      last_priced_at: new Date().toISOString(),
      position: input.position ?? 0,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceInvestment;
}

export async function updateInvestment(
  sb: SB,
  id: string,
  input: UpdateInvestmentInput
): Promise<FinanceInvestment> {
  const update: Record<string, unknown> = { ...input };
  // Si cambia current_value, marcamos last_priced_at = now (a menos
  // que el caller lo sobreescriba explícitamente).
  if (input.current_value !== undefined && !("last_priced_at" in input)) {
    update.last_priced_at = new Date().toISOString();
  }
  const { data, error } = await sb
    .from("finance_investments")
    .update(update as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FinanceInvestment;
}

export async function deleteInvestment(sb: SB, id: string): Promise<void> {
  const { error } = await sb
    .from("finance_investments")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
