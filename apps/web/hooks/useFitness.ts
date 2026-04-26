"use client";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "../lib/supabase-client";
import {
  fetchFitnessProfile,
  upsertFitnessProfile,
  fetchFitnessMetrics,
  fetchFitnessMetricForDate,
  upsertFitnessMetric,
  fetchExercises,
  createExercise,
  fetchWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  fetchWorkoutSets,
  fetchSetsByExercise,
  fetchAllUserSets,
  createWorkoutSet,
  updateWorkoutSet,
  deleteWorkoutSet,
  type FitnessUserProfile,
  type FitnessMetric,
  type FitnessExercise,
  type FitnessWorkout,
  type FitnessWorkoutSet,
  type UpsertFitnessProfileInput,
  type UpsertFitnessMetricInput,
  type CreateExerciseInput,
  type CreateWorkoutInput,
  type CreateWorkoutSetInput,
} from "@estoicismo/supabase";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

export function useFitnessProfile(): UseQueryResult<FitnessUserProfile | null> {
  return useQuery<FitnessUserProfile | null>({
    queryKey: ["fitness", "profile"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchFitnessProfile(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpsertFitnessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertFitnessProfileInput) => {
      const sb = getSupabaseBrowserClient();
      return upsertFitnessProfile(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitness", "profile"] });
    },
    onError: (err) => {
      toast.error("No se pudo guardar tu perfil de fitness.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// METRICS
// ─────────────────────────────────────────────────────────────

export function useFitnessMetrics(opts: { from?: string; to?: string; limit?: number } = {}): UseQueryResult<
  FitnessMetric[]
> {
  return useQuery<FitnessMetric[]>({
    queryKey: ["fitness", "metrics", opts.from ?? null, opts.to ?? null, opts.limit ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchFitnessMetrics(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useFitnessMetricForDate(date: string): UseQueryResult<FitnessMetric | null> {
  return useQuery<FitnessMetric | null>({
    queryKey: ["fitness", "metric", date],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchFitnessMetricForDate(sb, await getUserId(), date);
    },
    staleTime: 1000 * 30,
  });
}

export function useUpsertFitnessMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertFitnessMetricInput) => {
      const sb = getSupabaseBrowserClient();
      return upsertFitnessMetric(sb, await getUserId(), input);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["fitness", "metric", variables.occurred_on] });
      qc.invalidateQueries({ queryKey: ["fitness", "metrics"] });
    },
    onError: (err) => {
      toast.error("No se pudo guardar la métrica.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// EXERCISES
// ─────────────────────────────────────────────────────────────

export function useExercises(): UseQueryResult<FitnessExercise[]> {
  return useQuery<FitnessExercise[]>({
    queryKey: ["fitness", "exercises"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchExercises(sb);
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateExerciseInput) => {
      const sb = getSupabaseBrowserClient();
      return createExercise(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitness", "exercises"] });
    },
    onError: (err) => {
      toast.error("No se pudo crear el ejercicio.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// WORKOUTS
// ─────────────────────────────────────────────────────────────

export function useWorkouts(opts: { limit?: number; from?: string; to?: string } = {}): UseQueryResult<
  FitnessWorkout[]
> {
  return useQuery<FitnessWorkout[]>({
    queryKey: ["fitness", "workouts", opts.from ?? null, opts.to ?? null, opts.limit ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchWorkouts(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWorkoutInput) => {
      const sb = getSupabaseBrowserClient();
      return createWorkout(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitness", "workouts"] });
    },
    onError: (err) => {
      toast.error("No se pudo crear el workout.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateWorkoutInput> }) => {
      const sb = getSupabaseBrowserClient();
      return updateWorkout(sb, id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitness", "workouts"] });
    },
    onError: (err) => {
      toast.error("No se pudo actualizar el workout.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteWorkout(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitness", "workouts"] });
      qc.invalidateQueries({ queryKey: ["fitness", "sets"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// WORKOUT SETS
// ─────────────────────────────────────────────────────────────

export function useWorkoutSets(workoutId: string | null): UseQueryResult<FitnessWorkoutSet[]> {
  return useQuery<FitnessWorkoutSet[]>({
    queryKey: ["fitness", "sets", "workout", workoutId],
    queryFn: async () => {
      if (!workoutId) return [];
      const sb = getSupabaseBrowserClient();
      return fetchWorkoutSets(sb, workoutId);
    },
    enabled: !!workoutId,
    staleTime: 1000 * 60,
  });
}

export function useSetsByExercise(exerciseId: string | null, opts: { limit?: number } = {}): UseQueryResult<
  FitnessWorkoutSet[]
> {
  return useQuery<FitnessWorkoutSet[]>({
    queryKey: ["fitness", "sets", "exercise", exerciseId, opts.limit ?? null],
    queryFn: async () => {
      if (!exerciseId) return [];
      const sb = getSupabaseBrowserClient();
      return fetchSetsByExercise(sb, await getUserId(), exerciseId, opts);
    },
    enabled: !!exerciseId,
    staleTime: 1000 * 60,
  });
}

export function useAllUserSets(opts: { limit?: number } = {}): UseQueryResult<FitnessWorkoutSet[]> {
  return useQuery<FitnessWorkoutSet[]>({
    queryKey: ["fitness", "sets", "all", opts.limit ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchAllUserSets(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateWorkoutSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWorkoutSetInput) => {
      const sb = getSupabaseBrowserClient();
      return createWorkoutSet(sb, await getUserId(), input);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["fitness", "sets", "workout", variables.workout_id] });
      qc.invalidateQueries({ queryKey: ["fitness", "sets", "exercise", variables.exercise_id] });
      qc.invalidateQueries({ queryKey: ["fitness", "sets", "all"] });
    },
    onError: (err) => {
      toast.error("No se pudo guardar la serie.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useUpdateWorkoutSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Omit<CreateWorkoutSetInput, "workout_id" | "exercise_id" | "set_index">>;
    }) => {
      const sb = getSupabaseBrowserClient();
      return updateWorkoutSet(sb, id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitness", "sets"] });
    },
  });
}

export function useDeleteWorkoutSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteWorkoutSet(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitness", "sets"] });
    },
  });
}
