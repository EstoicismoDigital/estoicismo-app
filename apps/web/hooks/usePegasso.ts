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
  fetchConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  fetchMessages,
  createMessage,
  type PegassoConversation,
  type PegassoMessage,
  type CreateConversationInput,
  type CreateMessageInput,
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
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────

export function useConversations(opts: { include_archived?: boolean } = {}): UseQueryResult<
  PegassoConversation[]
> {
  return useQuery<PegassoConversation[]>({
    queryKey: ["pegasso", "conversations", opts.include_archived ?? false],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchConversations(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateConversationInput = {}) => {
      const sb = getSupabaseBrowserClient();
      return createConversation(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pegasso", "conversations"] }),
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: { title?: string; is_archived?: boolean } }) => {
      const sb = getSupabaseBrowserClient();
      return updateConversation(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pegasso", "conversations"] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteConversation(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pegasso"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────

export function useMessages(conversationId: string | null): UseQueryResult<PegassoMessage[]> {
  return useQuery<PegassoMessage[]>({
    queryKey: ["pegasso", "messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const sb = getSupabaseBrowserClient();
      return fetchMessages(sb, conversationId);
    },
    enabled: !!conversationId,
    staleTime: 1000 * 30,
  });
}

export function useCreateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMessageInput) => {
      const sb = getSupabaseBrowserClient();
      return createMessage(sb, await getUserId(), input);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["pegasso", "messages", variables.conversation_id] });
      qc.invalidateQueries({ queryKey: ["pegasso", "conversations"] });
    },
    onError: (err) => toast.error("No se pudo guardar el mensaje.", {
      description: err instanceof Error ? err.message : undefined,
    }),
  });
}
