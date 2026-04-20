import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Habit, HabitLog } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export type CreateHabitInput = {
  name: string;
  icon: string;
  color: string;
  frequency: Habit["frequency"];
  reminder_time: string | null;
};

export async function fetchHabits(sb: SB, userId: string): Promise<Habit[]> {
  const { data, error } = await sb
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Habit[];
}

export async function fetchHabitLogs(
  sb: SB,
  userId: string,
  from: string,
  to: string
): Promise<HabitLog[]> {
  const { data, error } = await sb
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("completed_at", from)
    .lte("completed_at", to);
  if (error) throw error;
  return (data ?? []) as HabitLog[];
}

export async function createHabit(
  sb: SB,
  userId: string,
  input: CreateHabitInput
): Promise<Habit> {
  const { data, error } = await sb
    .from("habits")
    .insert({ ...input, user_id: userId, is_archived: false } as never)
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function updateHabit(
  sb: SB,
  id: string,
  input: Partial<CreateHabitInput>
): Promise<Habit> {
  const { data, error } = await sb
    .from("habits")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function archiveHabit(sb: SB, id: string): Promise<void> {
  const { error } = await sb
    .from("habits")
    .update({ is_archived: true } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function unarchiveHabit(sb: SB, id: string): Promise<void> {
  const { error } = await sb
    .from("habits")
    .update({ is_archived: false } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function fetchArchivedHabits(
  sb: SB,
  userId: string
): Promise<Habit[]> {
  const { data, error } = await sb
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Habit[];
}

export async function deleteHabit(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("habits").delete().eq("id", id);
  if (error) throw error;
}

export async function insertHabitLog(
  sb: SB,
  habitId: string,
  userId: string,
  date: string
): Promise<void> {
  const { error } = await sb
    .from("habit_logs")
    .insert({ habit_id: habitId, user_id: userId, completed_at: date, note: null } as never);
  if (error) throw error;
}

export async function deleteHabitLog(
  sb: SB,
  habitId: string,
  date: string
): Promise<void> {
  const { error } = await sb
    .from("habit_logs")
    .delete()
    .eq("habit_id", habitId)
    .eq("completed_at", date);
  if (error) throw error;
}

/**
 * Update the note on an existing habit_log row.
 * Empty strings are normalized to null. Returns silently if no row matches
 * (i.e. the user hasn't completed the habit on that date yet).
 */
export async function upsertHabitLogNote(
  sb: SB,
  habitId: string,
  date: string,
  note: string | null
): Promise<void> {
  const normalized = note && note.trim().length > 0 ? note.trim() : null;
  const { error } = await sb
    .from("habit_logs")
    .update({ note: normalized } as never)
    .eq("habit_id", habitId)
    .eq("completed_at", date);
  if (error) throw error;
}

export const HABIT_COLORS = [
  "#4F8EF7",
  "#3DBF8A",
  "#E8714A",
  "#A56CF0",
  "#F0B429",
  "#E85D7A",
  "#2BBDCE",
  "#8B6F47",
] as const;

export const HABIT_EMOJIS = [
  "🎯",
  "🧘",
  "📚",
  "🏃",
  "💧",
  "✍️",
  "🌿",
  "💪",
  "🧠",
  "⭐",
  "🎨",
  "🎵",
  "🍎",
  "😴",
  "🧹",
  "💊",
  "🚴",
  "🧗",
  "📝",
  "🌅",
] as const;
