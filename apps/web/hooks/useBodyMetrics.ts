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
  fetchBodyMetrics,
  upsertBodyMetric,
  type FitnessBodyMetric,
  type UpsertBodyMetricInput,
} from "@estoicismo/supabase";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useBodyMetrics(opts: { limit?: number } = {}): UseQueryResult<FitnessBodyMetric[]> {
  return useQuery<FitnessBodyMetric[]>({
    queryKey: ["fitness", "body-metrics", opts.limit ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchBodyMetrics(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpsertBodyMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertBodyMetricInput) => {
      const sb = getSupabaseBrowserClient();
      return upsertBodyMetric(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fitness", "body-metrics"] }),
    onError: (err) => toast.error("No se pudieron guardar las medidas.", {
      description: extractErrorMessage(err),
    }),
  });
}
