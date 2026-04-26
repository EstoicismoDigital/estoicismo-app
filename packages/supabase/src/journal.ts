import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export type JournalArea =
  | "free"
  | "habits"
  | "fitness"
  | "lectura"
  | "finanzas"
  | "mentalidad"
  | "emprendimiento"
  | "pegasso";

export type JournalEntry = {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: number | null;
  area: JournalArea;
  ref_id: string | null;
  ref_type: string | null;
  tags: string[];
  occurred_on: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateJournalEntryInput = {
  title?: string | null;
  content: string;
  mood?: number | null;
  area?: JournalArea;
  ref_id?: string | null;
  ref_type?: string | null;
  tags?: string[];
  occurred_on?: string;
  is_pinned?: boolean;
};

export type UpdateJournalEntryInput = Partial<CreateJournalEntryInput>;

export async function fetchJournalEntries(
  sb: SB,
  userId: string,
  opts: {
    area?: JournalArea;
    from?: string;
    to?: string;
    tag?: string;
    limit?: number;
  } = {}
): Promise<JournalEntry[]> {
  let q = sb
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts.area) q = q.eq("area", opts.area);
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  if (opts.tag) q = q.contains("tags", [opts.tag]);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as JournalEntry[];
}

export async function createJournalEntry(
  sb: SB,
  userId: string,
  input: CreateJournalEntryInput
): Promise<JournalEntry> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("journal_entries")
    .insert({
      user_id: userId,
      title: input.title ?? null,
      content: input.content,
      mood: input.mood ?? null,
      area: input.area ?? "free",
      ref_id: input.ref_id ?? null,
      ref_type: input.ref_type ?? null,
      tags: input.tags ?? [],
      occurred_on: input.occurred_on ?? today,
      is_pinned: input.is_pinned ?? false,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as JournalEntry;
}

export async function updateJournalEntry(
  sb: SB,
  id: string,
  input: UpdateJournalEntryInput
): Promise<JournalEntry> {
  const { data, error } = await sb
    .from("journal_entries")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as JournalEntry;
}

export async function deleteJournalEntry(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("journal_entries").delete().eq("id", id);
  if (error) throw error;
}
