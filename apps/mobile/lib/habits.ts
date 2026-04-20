// apps/mobile/lib/habits.ts
import { supabase } from './supabase';
import type { Habit, HabitLog, CreateHabitInput } from '../types/habits';

/** Fetches all non-archived habits for the user, oldest first */
export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Habit[];
}

/**
 * Fetches habit_logs for a user between two dates (inclusive).
 * @param from - "YYYY-MM-DD" start
 * @param to   - "YYYY-MM-DD" end
 */
export async function fetchHabitLogs(
  userId: string,
  from: string,
  to: string,
): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_at', from)
    .lte('completed_at', to);
  if (error) throw error;
  return (data ?? []) as HabitLog[];
}

/** Creates a new habit and returns it */
export async function createHabit(
  userId: string,
  input: CreateHabitInput,
): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

/** Updates an existing habit and returns it */
export async function updateHabit(
  id: string,
  input: Partial<CreateHabitInput>,
): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

/** Soft-deletes a habit by setting is_archived = true */
export async function archiveHabit(id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ is_archived: true })
    .eq('id', id);
  if (error) throw error;
}

/** Inserts a habit_log for a given date (marks habit as done) */
export async function insertHabitLog(
  habitId: string,
  userId: string,
  date: string, // "YYYY-MM-DD"
): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .insert({ habit_id: habitId, user_id: userId, completed_at: date });
  if (error) throw error;
}

/** Deletes a habit_log for a given date (un-marks habit as done) */
export async function deleteHabitLog(
  habitId: string,
  date: string, // "YYYY-MM-DD"
): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('completed_at', date);
  if (error) throw error;
}
