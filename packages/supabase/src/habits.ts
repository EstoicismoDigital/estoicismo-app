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
    // Manual order first (lower = higher in list), then creation date as
    // a stable tiebreak for habits that share a position.
    .order("position", { ascending: true })
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

/**
 * Persist a new manual ordering. Takes an array of habit ids in the desired
 * order and writes position 0..N-1 to each row. RLS scopes writes to the
 * signed-in user; passing an id that doesn't belong to them is a no-op.
 *
 * Supabase-js doesn't expose a bulk UPDATE with a CASE expression, so we
 * issue N parallel updates. N is small (free tier caps at 3, premium users
 * realistically stay under 30), so the roundtrip cost is acceptable.
 */
export async function reorderHabits(
  sb: SB,
  orderedIds: string[]
): Promise<void> {
  if (orderedIds.length === 0) return;
  const updates = orderedIds.map((id, index) =>
    sb
      .from("habits")
      .update({ position: index } as never)
      .eq("id", id)
  );
  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) throw firstError.error;
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

// ─────────────────────────────────────────────────────────────
// STREAK FREEZES
// ─────────────────────────────────────────────────────────────

export type HabitStreakFreeze = {
  id: string;
  user_id: string;
  habit_id: string;
  frozen_on: string;
  reason: string | null;
  created_at: string;
};

export async function fetchStreakFreezes(
  sb: SB,
  userId: string,
  opts: { habit_id?: string; limit?: number } = {}
): Promise<HabitStreakFreeze[]> {
  let q = sb
    .from("habit_streak_freezes")
    .select("*")
    .eq("user_id", userId)
    .order("frozen_on", { ascending: false });
  if (opts.habit_id) q = q.eq("habit_id", opts.habit_id);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as HabitStreakFreeze[];
}

export async function createStreakFreeze(
  sb: SB,
  userId: string,
  input: { habit_id: string; frozen_on: string; reason?: string | null }
): Promise<HabitStreakFreeze> {
  const { data, error } = await sb
    .from("habit_streak_freezes")
    .insert({
      user_id: userId,
      habit_id: input.habit_id,
      frozen_on: input.frozen_on,
      reason: input.reason ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as HabitStreakFreeze;
}

export async function deleteStreakFreeze(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("habit_streak_freezes").delete().eq("id", id);
  if (error) throw error;
}
