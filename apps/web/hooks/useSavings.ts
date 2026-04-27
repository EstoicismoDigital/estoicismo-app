"use client";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "../lib/errors";
import { getSupabaseBrowserClient } from "../lib/supabase-client";
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  fetchContributions,
  createContribution,
  deleteContribution,
  type SavingsGoal,
  type SavingsContribution,
  type CreateGoalInput,
  type UpdateGoalInput,
  type CreateContributionInput,
} from "@estoicismo/supabase";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useSavingsGoals(opts: { include_completed?: boolean } = {}): UseQueryResult<SavingsGoal[]> {
  return useQuery<SavingsGoal[]>({
    queryKey: ["savings", "goals", opts.include_completed ?? false],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchGoals(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const sb = getSupabaseBrowserClient();
      return createGoal(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings", "goals"] });
    },
    onError: (err) => {
      toast.error("No se pudo crear la meta.", {
        description: extractErrorMessage(err),
      });
    },
  });
}

export function useUpdateSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateGoalInput }) => {
      const sb = getSupabaseBrowserClient();
      return updateGoal(sb, id, input);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["savings", "goals"] });
      if (variables.input.is_completed) {
        toast.success("¡Meta lograda!", { description: "Disfrútala — te la ganaste." });
      }
    },
  });
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteGoal(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings"] });
    },
  });
}

export function useSavingsContributions(opts: { goal_id?: string; limit?: number } = {}): UseQueryResult<
  SavingsContribution[]
> {
  return useQuery<SavingsContribution[]>({
    queryKey: ["savings", "contributions", opts.goal_id ?? null, opts.limit ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchContributions(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateContributionInput) => {
      const sb = getSupabaseBrowserClient();
      return createContribution(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings"] });
    },
    onError: (err) => {
      toast.error("No se pudo guardar el abono.", {
        description: extractErrorMessage(err),
      });
    },
  });
}

export function useDeleteContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteContribution(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings"] });
    },
  });
}
