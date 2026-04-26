import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export type PegassoMessageRole = "user" | "assistant";

export type PegassoConversation = {
  id: string;
  user_id: string;
  title: string;
  last_message_at: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type PegassoMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: PegassoMessageRole;
  content: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  error: string | null;
  created_at: string;
};

export type CreateConversationInput = {
  title?: string;
};

export type CreateMessageInput = {
  conversation_id: string;
  role: PegassoMessageRole;
  content: string;
  model?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  error?: string | null;
};

// ─────────────────────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────

export async function fetchConversations(
  sb: SB,
  userId: string,
  opts: { include_archived?: boolean } = {}
): Promise<PegassoConversation[]> {
  let q = sb
    .from("pegasso_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });
  if (!opts.include_archived) q = q.eq("is_archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as PegassoConversation[];
}

export async function createConversation(
  sb: SB,
  userId: string,
  input: CreateConversationInput = {}
): Promise<PegassoConversation> {
  const { data, error } = await sb
    .from("pegasso_conversations")
    .insert({
      user_id: userId,
      title: input.title ?? "Conversación con Pegasso",
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PegassoConversation;
}

export async function updateConversation(
  sb: SB,
  id: string,
  input: { title?: string; is_archived?: boolean; last_message_at?: string }
): Promise<PegassoConversation> {
  const { data, error } = await sb
    .from("pegasso_conversations")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PegassoConversation;
}

export async function deleteConversation(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("pegasso_conversations").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────

export async function fetchMessages(
  sb: SB,
  conversationId: string
): Promise<PegassoMessage[]> {
  const { data, error } = await sb
    .from("pegasso_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PegassoMessage[];
}

export async function createMessage(
  sb: SB,
  userId: string,
  input: CreateMessageInput
): Promise<PegassoMessage> {
  const { data, error } = await sb
    .from("pegasso_messages")
    .insert({
      user_id: userId,
      conversation_id: input.conversation_id,
      role: input.role,
      content: input.content,
      model: input.model ?? null,
      input_tokens: input.input_tokens ?? null,
      output_tokens: input.output_tokens ?? null,
      error: input.error ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;

  // Bumpea last_message_at de la conversación.
  await sb
    .from("pegasso_conversations")
    .update({ last_message_at: new Date().toISOString() } as never)
    .eq("id", input.conversation_id);

  return data as unknown as PegassoMessage;
}

export async function deleteMessage(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("pegasso_messages").delete().eq("id", id);
  if (error) throw error;
}
