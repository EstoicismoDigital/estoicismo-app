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
  fetchBudgets,
  upsertBudget,
  deleteBudget,
  type Budget,
  type UpsertBudgetInput,
} from "@estoicismo/supabase";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useBudgets(opts: { only_active?: boolean } = {}): UseQueryResult<Budget[]> {
  return useQuery<Budget[]>({
    queryKey: ["budgets", opts.only_active ?? true],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchBudgets(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertBudgetInput) => {
      const sb = getSupabaseBrowserClient();
      return upsertBudget(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err) => {
      toast.error("No se pudo guardar el presupuesto.", {
        description: extractErrorMessage(err),
      });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteBudget(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
