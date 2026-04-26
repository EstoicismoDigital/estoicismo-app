import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type ReadingBook = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  total_pages: number | null;
  current_page: number;
  cover_url: string | null;
  category: string | null;
  is_current: boolean;
  is_finished: boolean;
  rating: number | null;
  notes: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReadingSession = {
  id: string;
  user_id: string;
  book_id: string | null;
  started_at: string;
  duration_seconds: number;
  pages_from: number | null;
  pages_to: number | null;
  summary: string | null;
  highlight: string | null;
  mood: number | null;
  occurred_on: string;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────

export type CreateBookInput = {
  title: string;
  author?: string | null;
  total_pages?: number | null;
  current_page?: number;
  cover_url?: string | null;
  category?: string | null;
  is_current?: boolean;
  notes?: string | null;
  started_at?: string | null;
};

export type UpdateBookInput = Partial<CreateBookInput> & {
  is_finished?: boolean;
  rating?: number | null;
  finished_at?: string | null;
};

export type CreateSessionInput = {
  book_id?: string | null;
  duration_seconds: number;
  pages_from?: number | null;
  pages_to?: number | null;
  summary?: string | null;
  highlight?: string | null;
  mood?: number | null;
  occurred_on?: string;
  started_at?: string;
};

// ─────────────────────────────────────────────────────────────
// BOOKS
// ─────────────────────────────────────────────────────────────

export async function fetchBooks(
  sb: SB,
  userId: string,
  opts: { is_finished?: boolean; limit?: number } = {}
): Promise<ReadingBook[]> {
  let q = sb
    .from("reading_books")
    .select("*")
    .eq("user_id", userId)
    .order("is_current", { ascending: false })
    .order("updated_at", { ascending: false });
  if (typeof opts.is_finished === "boolean") {
    q = q.eq("is_finished", opts.is_finished);
  }
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ReadingBook[];
}

export async function fetchCurrentBook(
  sb: SB,
  userId: string
): Promise<ReadingBook | null> {
  const { data, error } = await sb
    .from("reading_books")
    .select("*")
    .eq("user_id", userId)
    .eq("is_current", true)
    .eq("is_finished", false)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as ReadingBook | null;
}

export async function createBook(
  sb: SB,
  userId: string,
  input: CreateBookInput
): Promise<ReadingBook> {
  // Si nuevo libro va como is_current=true, desmarca los demás del user.
  if (input.is_current) {
    await sb
      .from("reading_books")
      .update({ is_current: false } as never)
      .eq("user_id", userId);
  }
  const { data, error } = await sb
    .from("reading_books")
    .insert({
      user_id: userId,
      title: input.title,
      author: input.author ?? null,
      total_pages: input.total_pages ?? null,
      current_page: input.current_page ?? 0,
      cover_url: input.cover_url ?? null,
      category: input.category ?? null,
      is_current: input.is_current ?? false,
      notes: input.notes ?? null,
      started_at: input.started_at ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ReadingBook;
}

export async function updateBook(
  sb: SB,
  id: string,
  userId: string,
  input: UpdateBookInput
): Promise<ReadingBook> {
  // Si se marca como current, desmarca otros
  if (input.is_current) {
    await sb
      .from("reading_books")
      .update({ is_current: false } as never)
      .eq("user_id", userId)
      .neq("id", id);
  }
  const { data, error } = await sb
    .from("reading_books")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ReadingBook;
}

export async function deleteBook(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("reading_books").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────

export async function fetchSessions(
  sb: SB,
  userId: string,
  opts: { book_id?: string; limit?: number; from?: string; to?: string } = {}
): Promise<ReadingSession[]> {
  let q = sb
    .from("reading_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts.book_id) q = q.eq("book_id", opts.book_id);
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ReadingSession[];
}

export async function createSession(
  sb: SB,
  userId: string,
  input: CreateSessionInput
): Promise<ReadingSession> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("reading_sessions")
    .insert({
      user_id: userId,
      book_id: input.book_id ?? null,
      started_at: input.started_at ?? new Date().toISOString(),
      duration_seconds: input.duration_seconds,
      pages_from: input.pages_from ?? null,
      pages_to: input.pages_to ?? null,
      summary: input.summary ?? null,
      highlight: input.highlight ?? null,
      mood: input.mood ?? null,
      occurred_on: input.occurred_on ?? today,
    } as never)
    .select()
    .single();
  if (error) throw error;

  // Si se proporciona book_id + pages_to → actualizar current_page del libro.
  if (input.book_id && typeof input.pages_to === "number") {
    await sb
      .from("reading_books")
      .update({ current_page: input.pages_to } as never)
      .eq("id", input.book_id);
  }

  return data as unknown as ReadingSession;
}

export async function deleteSession(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("reading_sessions").delete().eq("id", id);
  if (error) throw error;
}
