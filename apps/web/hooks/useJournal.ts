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
  fetchJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  type JournalEntry,
  type JournalArea,
  type CreateJournalEntryInput,
  type UpdateJournalEntryInput,
} from "@estoicismo/supabase";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useJournal(opts: {
  area?: JournalArea;
  tag?: string;
  from?: string;
  to?: string;
  limit?: number;
} = {}): UseQueryResult<JournalEntry[]> {
  return useQuery<JournalEntry[]>({
    queryKey: [
      "journal",
      opts.area ?? null,
      opts.tag ?? null,
      opts.from ?? null,
      opts.to ?? null,
      opts.limit ?? null,
    ],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchJournalEntries(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateJournalEntryInput) => {
      const sb = getSupabaseBrowserClient();
      return createJournalEntry(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
    onError: (err) =>
      toast.error("No se pudo guardar la entrada.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useUpdateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateJournalEntryInput }) => {
      const sb = getSupabaseBrowserClient();
      return updateJournalEntry(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteJournalEntry(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
  });
}
