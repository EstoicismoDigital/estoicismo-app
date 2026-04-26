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
  const { data, error } = await sb
    .from("business_profile")
    .upsert(
      {
        user_id: userId,
        status: input.status ?? "exploring",
        ...input,
      } as never,
      { onConflict: "user_id" }
    )
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
