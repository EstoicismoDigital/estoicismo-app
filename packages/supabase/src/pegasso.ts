import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

export type PegassoMessageRole = "user" | "assistant";

export type PegassoConversationKind = "standard" | "weekly_review" | "onboarding";

export type PegassoConversation = {
  id: string;
  user_id: string;
  title: string;
  last_message_at: string;
  is_archived: boolean;
  /** Tipo de conversación. weekly_review = generada por el botón de review. */
  kind: PegassoConversationKind;
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
  /** Si el user marcó este mensaje como insight para revisitar. */
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
};

export type CreateConversationInput = {
  title?: string;
  kind?: PegassoConversationKind;
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
      kind: input.kind ?? "standard",
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

// ─────────────────────────────────────────────────────────────
// PINS — insights del user
// ─────────────────────────────────────────────────────────────

export async function togglePinMessage(
  sb: SB,
  id: string,
  pin: boolean
): Promise<PegassoMessage> {
  const { data, error } = await sb
    .from("pegasso_messages")
    .update({
      is_pinned: pin,
      pinned_at: pin ? new Date().toISOString() : null,
    } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PegassoMessage;
}

/**
 * Trae todos los mensajes pineados del user — incluye conversation_id
 * y title para que la UI pueda enlazar de regreso al hilo original.
 */
export type PinnedMessage = PegassoMessage & {
  conversation_title: string;
};

export async function fetchPinnedMessages(
  sb: SB,
  userId: string
): Promise<PinnedMessage[]> {
  const { data, error } = await sb
    .from("pegasso_messages")
    .select("*, pegasso_conversations!inner(title)")
    .eq("user_id", userId)
    .eq("is_pinned", true)
    .order("pinned_at", { ascending: false });
  if (error) throw error;
  // Flatten conversation title into row
  type Raw = PegassoMessage & {
    pegasso_conversations: { title: string } | null;
  };
  return (data as unknown as Raw[]).map((r) => ({
    ...r,
    conversation_title: r.pegasso_conversations?.title ?? "",
  }));
}

/**
 * Búsqueda de texto en mensajes del user. Usa ILIKE (case-insensitive
 * substring) — suficiente para volúmenes < 10k mensajes. Para escala
 * mayor, considerar pg_trgm o tsvector.
 *
 * Devuelve mensajes que matchean + título de su conversación + un
 * snippet sencillo (texto completo del mensaje recortado a 200 chars
 * con la primera ocurrencia centrada).
 */
export type ConversationSearchResult = PegassoMessage & {
  conversation_title: string;
  snippet: string;
};

export async function searchConversations(
  sb: SB,
  userId: string,
  query: string,
  limit = 30
): Promise<ConversationSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const { data, error } = await sb
    .from("pegasso_messages")
    .select("*, pegasso_conversations!inner(title)")
    .eq("user_id", userId)
    .ilike("content", pattern)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  type Raw = PegassoMessage & {
    pegasso_conversations: { title: string } | null;
  };
  return (data as unknown as Raw[]).map((r) => ({
    ...r,
    conversation_title: r.pegasso_conversations?.title ?? "",
    snippet: buildSnippet(r.content, q),
  }));
}

function buildSnippet(content: string, query: string, around = 80): string {
  const lc = content.toLowerCase();
  const idx = lc.indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, 200);
  const start = Math.max(0, idx - around);
  const end = Math.min(content.length, idx + query.length + around);
  let snippet = content.slice(start, end);
  if (start > 0) snippet = "…" + snippet;
  if (end < content.length) snippet = snippet + "…";
  return snippet;
}
