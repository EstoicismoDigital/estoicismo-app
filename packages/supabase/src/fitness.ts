import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type FitnessGoal = "fuerza" | "hipertrofia" | "resistencia" | "salud";
export type FitnessUnitSystem = "metric" | "imperial";
export type FitnessSex = "male" | "female" | "other";

export type FitnessUserProfile = {
  user_id: string;
  bodyweight_kg: number | null;
  goal: FitnessGoal;
  unit_system: FitnessUnitSystem;
  sex: FitnessSex | null;
  birth_year: number | null;
  created_at: string;
  updated_at: string;
};

export type FitnessMetric = {
  id: string;
  user_id: string;
  occurred_on: string;
  sleep_hours: number | null;
  calories_intake: number | null;
  weight_kg: number | null;
  steps: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ExerciseMuscleGroup =
  | "pierna"
  | "pecho"
  | "espalda"
  | "hombro"
  | "brazo"
  | "core"
  | "cuerpo-completo"
  | "cardio"
  | "general";

export type ExerciseMeasurement = "weight_reps" | "reps_only" | "duration";

export type FitnessExercise = {
  id: string;
  user_id: string | null;
  slug: string;
  name: string;
  muscle_group: ExerciseMuscleGroup;
  measurement: ExerciseMeasurement;
  is_main_lift: boolean;
  icon: string;
  created_at: string;
};

export type FitnessWorkout = {
  id: string;
  user_id: string;
  occurred_on: string;
  started_at: string | null;
  name: string;
  duration_minutes: number | null;
  mood: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FitnessWorkoutSet = {
  id: string;
  workout_id: string;
  exercise_id: string;
  user_id: string;
  set_index: number;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  notes: string | null;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────

export type UpsertFitnessProfileInput = Partial<
  Omit<FitnessUserProfile, "user_id" | "created_at" | "updated_at">
>;

export type UpsertFitnessMetricInput = {
  occurred_on: string;
  sleep_hours?: number | null;
  calories_intake?: number | null;
  weight_kg?: number | null;
  steps?: number | null;
  notes?: string | null;
};

export type CreateExerciseInput = {
  slug: string;
  name: string;
  muscle_group: ExerciseMuscleGroup;
  measurement?: ExerciseMeasurement;
  icon?: string;
};

export type CreateWorkoutInput = {
  name?: string;
  occurred_on: string;
  started_at?: string | null;
  duration_minutes?: number | null;
  mood?: number | null;
  notes?: string | null;
};

export type CreateWorkoutSetInput = {
  workout_id: string;
  exercise_id: string;
  set_index: number;
  weight_kg?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  rpe?: number | null;
  notes?: string | null;
};

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

export async function fetchFitnessProfile(
  sb: SB,
  userId: string
): Promise<FitnessUserProfile | null> {
  const { data, error } = await sb
    .from("fitness_user_profile")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as FitnessUserProfile | null;
}

export async function upsertFitnessProfile(
  sb: SB,
  userId: string,
  input: UpsertFitnessProfileInput
): Promise<FitnessUserProfile> {
  const { data, error } = await sb
    .from("fitness_user_profile")
    .upsert(
      {
        user_id: userId,
        ...input,
      } as never,
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FitnessUserProfile;
}

// ─────────────────────────────────────────────────────────────
// METRICS (sleep / calories / weight)
// ─────────────────────────────────────────────────────────────

export async function fetchFitnessMetrics(
  sb: SB,
  userId: string,
  opts: { from?: string; to?: string; limit?: number } = {}
): Promise<FitnessMetric[]> {
  let q = sb
    .from("fitness_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false });
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FitnessMetric[];
}

export async function fetchFitnessMetricForDate(
  sb: SB,
  userId: string,
  date: string
): Promise<FitnessMetric | null> {
  const { data, error } = await sb
    .from("fitness_metrics")
    .select("*")
    .eq("user_id", userId)
    .eq("occurred_on", date)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as FitnessMetric | null;
}

export async function upsertFitnessMetric(
  sb: SB,
  userId: string,
  input: UpsertFitnessMetricInput
): Promise<FitnessMetric> {
  const { data, error } = await sb
    .from("fitness_metrics")
    .upsert(
      {
        user_id: userId,
        occurred_on: input.occurred_on,
        sleep_hours: input.sleep_hours ?? null,
        calories_intake: input.calories_intake ?? null,
        weight_kg: input.weight_kg ?? null,
        steps: input.steps ?? null,
        notes: input.notes ?? null,
      } as never,
      { onConflict: "user_id,occurred_on" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FitnessMetric;
}

// ─────────────────────────────────────────────────────────────
// EXERCISES
// ─────────────────────────────────────────────────────────────

export async function fetchExercises(sb: SB): Promise<FitnessExercise[]> {
  const { data, error } = await sb
    .from("fitness_exercises")
    .select("*")
    .order("muscle_group", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as FitnessExercise[];
}

export async function createExercise(
  sb: SB,
  userId: string,
  input: CreateExerciseInput
): Promise<FitnessExercise> {
  const { data, error } = await sb
    .from("fitness_exercises")
    .insert({
      user_id: userId,
      slug: input.slug,
      name: input.name,
      muscle_group: input.muscle_group,
      measurement: input.measurement ?? "weight_reps",
      icon: input.icon ?? "dumbbell",
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FitnessExercise;
}

// ─────────────────────────────────────────────────────────────
// WORKOUTS
// ─────────────────────────────────────────────────────────────

export async function fetchWorkouts(
  sb: SB,
  userId: string,
  opts: { limit?: number; from?: string; to?: string } = {}
): Promise<FitnessWorkout[]> {
  let q = sb
    .from("fitness_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FitnessWorkout[];
}

export async function createWorkout(
  sb: SB,
  userId: string,
  input: CreateWorkoutInput
): Promise<FitnessWorkout> {
  const { data, error } = await sb
    .from("fitness_workouts")
    .insert({
      user_id: userId,
      name: input.name ?? "Sesión",
      occurred_on: input.occurred_on,
      started_at: input.started_at ?? null,
      duration_minutes: input.duration_minutes ?? null,
      mood: input.mood ?? null,
      notes: input.notes ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FitnessWorkout;
}

export async function updateWorkout(
  sb: SB,
  id: string,
  input: Partial<CreateWorkoutInput>
): Promise<FitnessWorkout> {
  const { data, error } = await sb
    .from("fitness_workouts")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FitnessWorkout;
}

export async function deleteWorkout(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("fitness_workouts").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// WORKOUT SETS
// ─────────────────────────────────────────────────────────────

export async function fetchWorkoutSets(
  sb: SB,
  workoutId: string
): Promise<FitnessWorkoutSet[]> {
  const { data, error } = await sb
    .from("fitness_workout_sets")
    .select("*")
    .eq("workout_id", workoutId)
    .order("set_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as FitnessWorkoutSet[];
}

/**
 * Sets de un ejercicio en TODOS los workouts del usuario — útil
 * para mostrar progresión de un ejercicio específico (gráfica de
 * 1RM estimado a lo largo del tiempo).
 */
export async function fetchSetsByExercise(
  sb: SB,
  userId: string,
  exerciseId: string,
  opts: { limit?: number } = {}
): Promise<FitnessWorkoutSet[]> {
  let q = sb
    .from("fitness_workout_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .order("created_at", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FitnessWorkoutSet[];
}

/**
 * Sets de TODOS los workouts del usuario, sin filtro de ejercicio.
 * Sirve para computar niveles globales sin hacer N queries.
 */
export async function fetchAllUserSets(
  sb: SB,
  userId: string,
  opts: { limit?: number } = {}
): Promise<FitnessWorkoutSet[]> {
  let q = sb
    .from("fitness_workout_sets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as FitnessWorkoutSet[];
}

export async function createWorkoutSet(
  sb: SB,
  userId: string,
  input: CreateWorkoutSetInput
): Promise<FitnessWorkoutSet> {
  const { data, error } = await sb
    .from("fitness_workout_sets")
    .insert({
      user_id: userId,
      workout_id: input.workout_id,
      exercise_id: input.exercise_id,
      set_index: input.set_index,
      weight_kg: input.weight_kg ?? null,
      reps: input.reps ?? null,
      duration_seconds: input.duration_seconds ?? null,
      rpe: input.rpe ?? null,
      notes: input.notes ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FitnessWorkoutSet;
}

export async function updateWorkoutSet(
  sb: SB,
  id: string,
  input: Partial<Omit<CreateWorkoutSetInput, "workout_id" | "exercise_id" | "set_index">>
): Promise<FitnessWorkoutSet> {
  const { data, error } = await sb
    .from("fitness_workout_sets")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as FitnessWorkoutSet;
}

export async function deleteWorkoutSet(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("fitness_workout_sets").delete().eq("id", id);
  if (error) throw error;
}
