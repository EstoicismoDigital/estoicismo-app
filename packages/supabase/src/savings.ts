import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  currency: string;
  deadline: string | null;
  image_url: string | null;
  icon: string;
  color: string;
  notes: string | null;
  is_completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type SavingsContribution = {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  transaction_id: string | null;
  occurred_on: string;
  note: string | null;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────

export type CreateGoalInput = {
  name: string;
  target_amount: number;
  currency?: string;
  deadline?: string | null;
  image_url?: string | null;
  icon?: string;
  color?: string;
  notes?: string | null;
};

export type UpdateGoalInput = Partial<CreateGoalInput> & {
  is_completed?: boolean;
  position?: number;
};

export type CreateContributionInput = {
  goal_id: string;
  amount: number;
  occurred_on?: string;
  note?: string | null;
  transaction_id?: string | null;
};

// ─────────────────────────────────────────────────────────────
// GOALS
// ─────────────────────────────────────────────────────────────

export async function fetchGoals(
  sb: SB,
  userId: string,
  opts: { include_completed?: boolean } = {}
): Promise<SavingsGoal[]> {
  let q = sb
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (!opts.include_completed) q = q.eq("is_completed", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as SavingsGoal[];
}

export async function createGoal(
  sb: SB,
  userId: string,
  input: CreateGoalInput
): Promise<SavingsGoal> {
  const { data, error } = await sb
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: input.name,
      target_amount: input.target_amount,
      currency: input.currency ?? "MXN",
      deadline: input.deadline ?? null,
      image_url: input.image_url ?? null,
      icon: input.icon ?? "piggy-bank",
      color: input.color ?? "#22774E",
      notes: input.notes ?? null,
      position: 0,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SavingsGoal;
}

export async function updateGoal(
  sb: SB,
  id: string,
  input: UpdateGoalInput
): Promise<SavingsGoal> {
  const update: Record<string, unknown> = { ...input };
  // Si is_completed pasa a true, marcamos completed_at.
  if (input.is_completed === true) {
    update.completed_at = new Date().toISOString();
  } else if (input.is_completed === false) {
    update.completed_at = null;
  }
  const { data, error } = await sb
    .from("savings_goals")
    .update(update as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SavingsGoal;
}

export async function deleteGoal(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("savings_goals").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// CONTRIBUTIONS
// ─────────────────────────────────────────────────────────────

export async function fetchContributions(
  sb: SB,
  userId: string,
  opts: { goal_id?: string; limit?: number } = {}
): Promise<SavingsContribution[]> {
  let q = sb
    .from("savings_contributions")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts.goal_id) q = q.eq("goal_id", opts.goal_id);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as SavingsContribution[];
}

export async function createContribution(
  sb: SB,
  userId: string,
  input: CreateContributionInput
): Promise<SavingsContribution> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("savings_contributions")
    .insert({
      user_id: userId,
      goal_id: input.goal_id,
      amount: input.amount,
      occurred_on: input.occurred_on ?? today,
      note: input.note ?? null,
      transaction_id: input.transaction_id ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SavingsContribution;
}

export async function deleteContribution(sb: SB, id: string): Promise<void> {
  const { error } = await sb
    .from("savings_contributions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/**
 * Suma de aportes por meta — resuelto del lado cliente para evitar
 * un trigger SQL. Devuelve un mapa { goal_id: total }.
 */
export function sumContributionsByGoal(
  contributions: SavingsContribution[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of contributions) {
    map.set(c.goal_id, (map.get(c.goal_id) ?? 0) + Number(c.amount));
  }
  return map;
}
