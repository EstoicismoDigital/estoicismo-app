import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type BudgetPeriod = "monthly" | "yearly";

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  period: BudgetPeriod;
  /** NULL = vigente recurrente. */
  period_start: string | null;
  amount: number;
  currency: string;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────

export type UpsertBudgetInput = {
  category_id: string;
  period?: BudgetPeriod;
  period_start?: string | null;
  amount: number;
  currency?: string;
  alert_threshold?: number;
  is_active?: boolean;
};

// ─────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────

export async function fetchBudgets(
  sb: SB,
  userId: string,
  opts: { only_active?: boolean } = {}
): Promise<Budget[]> {
  let q = sb
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (opts.only_active !== false) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Budget[];
}

/**
 * Upsert por (user_id, category_id, period, period_start). Idempotente:
 * si ya existe un presupuesto vigente para esa categoría, actualiza el
 * amount; si no, crea uno nuevo.
 */
export async function upsertBudget(
  sb: SB,
  userId: string,
  input: UpsertBudgetInput
): Promise<Budget> {
  const period = input.period ?? "monthly";
  const period_start = input.period_start ?? null;

  // Buscar existente
  let q = sb
    .from("budgets")
    .select("id")
    .eq("user_id", userId)
    .eq("category_id", input.category_id)
    .eq("period", period);
  if (period_start === null) {
    q = q.is("period_start", null);
  } else {
    q = q.eq("period_start", period_start);
  }
  const { data: existing, error: findErr } = await q.maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    const { data, error } = await sb
      .from("budgets")
      .update({
        amount: input.amount,
        alert_threshold: input.alert_threshold ?? 80,
        currency: input.currency ?? "MXN",
        is_active: input.is_active ?? true,
      } as never)
      .eq("id", (existing as { id: string }).id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Budget;
  } else {
    const { data, error } = await sb
      .from("budgets")
      .insert({
        user_id: userId,
        category_id: input.category_id,
        period,
        period_start,
        amount: input.amount,
        currency: input.currency ?? "MXN",
        alert_threshold: input.alert_threshold ?? 80,
        is_active: input.is_active ?? true,
      } as never)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Budget;
  }
}

export async function deleteBudget(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("budgets").delete().eq("id", id);
  if (error) throw error;
}
