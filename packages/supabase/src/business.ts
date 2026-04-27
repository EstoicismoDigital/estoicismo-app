import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type BusinessStatus = "exploring" | "starting" | "active" | "paused";
export type TaskPriority = "low" | "medium" | "high";

export type BusinessProfile = {
  user_id: string;
  status: BusinessStatus;
  name: string | null;
  description: string | null;
  category: string | null;
  purpose_link: string | null;
  started_on: string | null;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessProduct = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  currency: string;
  kind: string | null;
  is_active: boolean;
  position: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessClient = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tag: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessTask = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type IdeaMeta = {
  /** Flujo del wizard que generó la idea. */
  kind?: "have-idea" | "exploring" | "manual";
  /** Scores Ikigai 1-5 — null si el user los saltó. */
  ikigai?: {
    love: number | null;
    good_at: number | null;
    needed: number | null;
    paid_for: number | null;
  };
  /** Cascada de "5 porqués" — el WHY profundo más allá del dinero. */
  whys?: string[];
  /** Pre-mortem: imagina 1 año fracasada, qué la mató. */
  premortem?: string;
  /** Para flujo "exploring" — respuestas crudas del wizard. */
  energy_gives?: string;
  energy_drains?: string;
  free_8h?: string;
  called_to_help?: string;
  frustrating_problem?: string;
};

export type BusinessIdea = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  excitement: number | null;
  feasibility: number | null;
  startup_cost_text: string | null;
  validation_notes: string | null;
  is_favorite: boolean;
  position: number;
  /** JSONB — output del wizard (ikigai, 5 whys, premortem, etc). */
  meta: IdeaMeta;
  created_at: string;
  updated_at: string;
};

export type BusinessSale = {
  id: string;
  user_id: string;
  product_id: string | null;
  client_id: string | null;
  quantity: number;
  amount: number;
  currency: string;
  transaction_id: string | null;
  occurred_on: string;
  note: string | null;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────

export type UpsertBusinessProfileInput = Partial<
  Omit<BusinessProfile, "user_id" | "created_at" | "updated_at">
>;

export type CreateProductInput = {
  name: string;
  description?: string | null;
  price?: number;
  cost?: number | null;
  currency?: string;
  kind?: string | null;
  notes?: string | null;
};

export type CreateClientInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  tag?: string | null;
  notes?: string | null;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  is_completed?: boolean;
};

export type CreateIdeaInput = {
  title: string;
  description?: string | null;
  category?: string | null;
  excitement?: number | null;
  feasibility?: number | null;
  startup_cost_text?: string | null;
  validation_notes?: string | null;
  meta?: IdeaMeta;
};

export type UpdateIdeaInput = Partial<CreateIdeaInput> & {
  is_favorite?: boolean;
};

export type CreateSaleInput = {
  product_id?: string | null;
  client_id?: string | null;
  quantity?: number;
  amount: number;
  currency?: string;
  occurred_on?: string;
  note?: string | null;
  transaction_id?: string | null;
};

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

export async function fetchBusinessProfile(
  sb: SB,
  userId: string
): Promise<BusinessProfile | null> {
  const { data, error } = await sb
    .from("business_profile")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as BusinessProfile | null;
}

export async function upsertBusinessProfile(
  sb: SB,
  userId: string,
  input: UpsertBusinessProfileInput
): Promise<BusinessProfile> {
  // SOLO pasamos las columnas explícitamente definidas en input.
  // Importante: no defaulteamos `status` aquí porque eso machacaría
  // un status "active" existente cuando el caller sólo quiere editar
  // el name (caso típico del ProfileCard).
  const payload: Record<string, unknown> = { user_id: userId };
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) payload[k] = v;
  }
  // Si NO existe la fila aún (primer insert) y no se pasó status,
  // PostgreSQL usa el default 'exploring' del schema — limpio.

  const { data, error } = await sb
    .from("business_profile")
    .upsert(payload as never, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessProfile;
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────

export async function fetchProducts(
  sb: SB,
  userId: string,
  opts: { include_inactive?: boolean } = {}
): Promise<BusinessProduct[]> {
  let q = sb
    .from("business_products")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (!opts.include_inactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as BusinessProduct[];
}

export async function createProduct(
  sb: SB,
  userId: string,
  input: CreateProductInput
): Promise<BusinessProduct> {
  const { data, error } = await sb
    .from("business_products")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      price: input.price ?? 0,
      cost: input.cost ?? null,
      currency: input.currency ?? "MXN",
      kind: input.kind ?? null,
      notes: input.notes ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessProduct;
}

export async function updateProduct(
  sb: SB,
  id: string,
  input: Partial<CreateProductInput> & { is_active?: boolean }
): Promise<BusinessProduct> {
  const { data, error } = await sb
    .from("business_products")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessProduct;
}

export async function deleteProduct(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("business_products").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────

export async function fetchClients(
  sb: SB,
  userId: string,
  opts: { include_archived?: boolean } = {}
): Promise<BusinessClient[]> {
  let q = sb
    .from("business_clients")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!opts.include_archived) q = q.eq("is_archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as BusinessClient[];
}

export async function createClient(
  sb: SB,
  userId: string,
  input: CreateClientInput
): Promise<BusinessClient> {
  const { data, error } = await sb
    .from("business_clients")
    .insert({
      user_id: userId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      tag: input.tag ?? null,
      notes: input.notes ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessClient;
}

export async function updateClient(
  sb: SB,
  id: string,
  input: Partial<CreateClientInput> & { is_archived?: boolean }
): Promise<BusinessClient> {
  const { data, error } = await sb
    .from("business_clients")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessClient;
}

export async function deleteClient(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("business_clients").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────

export async function fetchTasks(
  sb: SB,
  userId: string,
  opts: { include_completed?: boolean } = {}
): Promise<BusinessTask[]> {
  let q = sb
    .from("business_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("is_completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("position", { ascending: true });
  if (!opts.include_completed) q = q.eq("is_completed", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as BusinessTask[];
}

export async function createTask(
  sb: SB,
  userId: string,
  input: CreateTaskInput
): Promise<BusinessTask> {
  const { data, error } = await sb
    .from("business_tasks")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "medium",
      due_date: input.due_date ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessTask;
}

export async function updateTask(
  sb: SB,
  id: string,
  input: UpdateTaskInput
): Promise<BusinessTask> {
  const update: Record<string, unknown> = { ...input };
  if (input.is_completed === true) {
    update.completed_at = new Date().toISOString();
  } else if (input.is_completed === false) {
    update.completed_at = null;
  }
  const { data, error } = await sb
    .from("business_tasks")
    .update(update as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessTask;
}

export async function deleteTask(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("business_tasks").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// IDEAS
// ─────────────────────────────────────────────────────────────

export async function fetchIdeas(
  sb: SB,
  userId: string
): Promise<BusinessIdea[]> {
  const { data, error } = await sb
    .from("business_ideas")
    .select("*")
    .eq("user_id", userId)
    .order("is_favorite", { ascending: false })
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as BusinessIdea[];
}

export async function createIdea(
  sb: SB,
  userId: string,
  input: CreateIdeaInput
): Promise<BusinessIdea> {
  const { data, error } = await sb
    .from("business_ideas")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      excitement: input.excitement ?? null,
      feasibility: input.feasibility ?? null,
      startup_cost_text: input.startup_cost_text ?? null,
      validation_notes: input.validation_notes ?? null,
      meta: input.meta ?? {},
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessIdea;
}

export async function updateIdea(
  sb: SB,
  id: string,
  input: UpdateIdeaInput
): Promise<BusinessIdea> {
  const { data, error } = await sb
    .from("business_ideas")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessIdea;
}

export async function deleteIdea(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("business_ideas").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────────────────────

export async function fetchSales(
  sb: SB,
  userId: string,
  opts: { from?: string; to?: string; limit?: number } = {}
): Promise<BusinessSale[]> {
  let q = sb
    .from("business_sales")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as BusinessSale[];
}

export async function createSale(
  sb: SB,
  userId: string,
  input: CreateSaleInput
): Promise<BusinessSale> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("business_sales")
    .insert({
      user_id: userId,
      product_id: input.product_id ?? null,
      client_id: input.client_id ?? null,
      quantity: input.quantity ?? 1,
      amount: input.amount,
      currency: input.currency ?? "MXN",
      transaction_id: input.transaction_id ?? null,
      occurred_on: input.occurred_on ?? today,
      note: input.note ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessSale;
}

export async function deleteSale(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("business_sales").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// MILESTONES — hitos del negocio
// ─────────────────────────────────────────────────────────────

export type BusinessMilestoneKind =
  | "sales_total"
  | "sales_count"
  | "clients_count"
  | "product_launch"
  | "custom";

export type BusinessMilestoneStatus = "open" | "achieved" | "abandoned";

export type BusinessMilestone = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  kind: BusinessMilestoneKind;
  target_amount: number | null;
  target_date: string | null;
  status: BusinessMilestoneStatus;
  achieved_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type CreateMilestoneInput = {
  title: string;
  description?: string | null;
  kind?: BusinessMilestoneKind;
  target_amount?: number | null;
  target_date?: string | null;
  position?: number;
};

export type UpdateMilestoneInput = Partial<CreateMilestoneInput> & {
  status?: BusinessMilestoneStatus;
};

export async function fetchMilestones(
  sb: SB,
  userId: string,
  opts: { status?: BusinessMilestoneStatus } = {}
): Promise<BusinessMilestone[]> {
  let q = sb
    .from("business_milestones")
    .select("*")
    .eq("user_id", userId)
    .order("status", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as BusinessMilestone[];
}

export async function createMilestone(
  sb: SB,
  userId: string,
  input: CreateMilestoneInput
): Promise<BusinessMilestone> {
  const { data, error } = await sb
    .from("business_milestones")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      kind: input.kind ?? "custom",
      target_amount: input.target_amount ?? null,
      target_date: input.target_date ?? null,
      position: input.position ?? 0,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessMilestone;
}

export async function updateMilestone(
  sb: SB,
  id: string,
  input: UpdateMilestoneInput
): Promise<BusinessMilestone> {
  const update: Record<string, unknown> = { ...input };
  if (input.status === "achieved") {
    update.achieved_at = new Date().toISOString();
  } else if (input.status === "open" || input.status === "abandoned") {
    update.achieved_at = null;
  }
  const { data, error } = await sb
    .from("business_milestones")
    .update(update as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessMilestone;
}

export async function deleteMilestone(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("business_milestones").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// OKRs TRIMESTRALES — goal-setting lite
// ─────────────────────────────────────────────────────────────

export type BusinessOkrStatus = "active" | "done" | "dropped";

export type BusinessOkr = {
  id: string;
  user_id: string;
  /** Formato: "2026-Q1" */
  quarter: string;
  title: string;
  description: string | null;
  /** 0-100 */
  progress: number;
  status: BusinessOkrStatus;
  position: number;
  created_at: string;
  updated_at: string;
};

export type CreateOkrInput = {
  quarter: string;
  title: string;
  description?: string | null;
  progress?: number;
  position?: number;
};

export type UpdateOkrInput = Partial<CreateOkrInput> & {
  status?: BusinessOkrStatus;
};

export async function fetchOkrs(
  sb: SB,
  userId: string,
  quarter?: string
): Promise<BusinessOkr[]> {
  let q = sb
    .from("business_okrs")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (quarter) q = q.eq("quarter", quarter);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as BusinessOkr[];
}

export async function createOkr(
  sb: SB,
  userId: string,
  input: CreateOkrInput
): Promise<BusinessOkr> {
  const { data, error } = await sb
    .from("business_okrs")
    .insert({
      user_id: userId,
      quarter: input.quarter,
      title: input.title,
      description: input.description ?? null,
      progress: input.progress ?? 0,
      position: input.position ?? 0,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessOkr;
}

export async function updateOkr(
  sb: SB,
  id: string,
  input: UpdateOkrInput
): Promise<BusinessOkr> {
  const { data, error } = await sb
    .from("business_okrs")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BusinessOkr;
}

export async function deleteOkr(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("business_okrs").delete().eq("id", id);
  if (error) throw error;
}

/** Helper: trimestre actual en formato "YYYY-QN". */
export function currentQuarter(date: Date = new Date()): string {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}
