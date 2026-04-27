"use client";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
  Printer,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useUpdateConversation,
  useMessages,
  useCreateMessage,
} from "../../../hooks/usePegasso";
import { ConversationList } from "../../../components/pegasso/ConversationList";
import { MessageBubble } from "../../../components/pegasso/MessageBubble";
import { streamPegassoChat } from "../../../lib/pegasso/stream-client";
import { usePegassoPersona } from "../../../hooks/usePegassoPersona";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";
import {
  gatherWeeklySnapshot,
  buildWeeklyReviewPrompt,
} from "../../../lib/pegasso/weekly-review";
import type { PegassoMessage } from "@estoicismo/supabase";

/**
 * Cliente del módulo Pegasso.
 *
 * UX:
 *   - Sidebar (móvil: colapsable arriba; desktop: fijo izquierdo).
 *   - Mensajes en cascada con bubbles.
 *   - Input al fondo, fixed.
 *   - Streaming: mensaje del assistant aparece carácter a carácter.
 *   - Cuando no hay conversación activa, mostrar onboarding con
 *     algunas "starter prompts".
 */
export function PegassoClient() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { persona, setPersona } = usePegassoPersona();

  const { data: conversations = [] } = useConversations();
  const currentConv = conversations.find((c) => c.id === activeId);
  const { data: messages = [], refetch: refetchMessages } = useMessages(activeId);
  const createConvM = useCreateConversation();
  const updateConvM = useUpdateConversation();
  const deleteConvM = useDeleteConversation();
  const createMessageM = useCreateMessage();

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Si no hay conversación activa pero existen, abrir la primera.
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  // Reset estado streaming cuando cambia la conv.
  useEffect(() => {
    setStreamingText("");
    setStreamingError(null);
    setIsStreaming(false);
    abortRef.current?.abort();
  }, [activeId]);

  // Auto-scroll al final cuando llegan mensajes nuevos.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingText]);

  async function handleNewConv() {
    const c = await createConvM.mutateAsync({});
    setActiveId(c.id);
  }

  const [weeklyReviewLoading, setWeeklyReviewLoading] = useState(false);
  async function handleWeeklyReview() {
    if (weeklyReviewLoading || isStreaming) return;
    setWeeklyReviewLoading(true);
    try {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        toast.error("Sesión expirada");
        return;
      }
      const snapshot = await gatherWeeklySnapshot(sb, user.id);
      const prompt = buildWeeklyReviewPrompt(snapshot);
      const c = await createConvM.mutateAsync({
        title: `Review · ${snapshot.weekStart} – ${snapshot.weekEnd}`,
        kind: "weekly_review",
      });
      setActiveId(c.id);
      // Use a microtask so activeId state takes effect before send
      setTimeout(() => void handleSend(prompt), 50);
    } catch (err) {
      toast.error("No se pudo generar el review", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setWeeklyReviewLoading(false);
    }
  }

  async function handleSend(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || isStreaming) return;

    let convId = activeId;
    // Crear conversación si no hay activa.
    if (!convId) {
      const c = await createConvM.mutateAsync({});
      convId = c.id;
      setActiveId(convId);
    }

    setInput("");
    setStreamingText("");
    setStreamingError(null);

    // 1. Persistir mensaje del user.
    try {
      await createMessageM.mutateAsync({
        conversation_id: convId,
        role: "user",
        content: text,
      });
    } catch {
      return;
    }

    // 2. Stream Anthropic.
    setIsStreaming(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    await streamPegassoChat(
      convId,
      {
        onText: (_, full) => setStreamingText(full),
        onDone: async () => {
          setIsStreaming(false);
          setStreamingText("");
          await refetchMessages();
        },
        onError: async (msg) => {
          setIsStreaming(false);
          setStreamingError(msg);
          await refetchMessages();
        },
      },
      { signal: abortRef.current.signal, persona }
    );

    // Si es el primer mensaje del user, intentamos auto-titular la
    // conversación con un fragmento del prompt (después de que la
    // API respondió, para no bloquear).
    if (messages.length === 0) {
      const title = text.slice(0, 60) + (text.length > 60 ? "…" : "");
      updateConvM.mutate({ id: convId, input: { title } });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div data-module="pegasso" className="min-h-screen bg-bg flex flex-col lg:flex-row">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => setActiveId(id)}
        onCreate={handleNewConv}
        onDelete={(id) => {
          deleteConvM.mutate(id);
          if (activeId === id) setActiveId(null);
        }}
        onArchive={(id) => {
          updateConvM.mutate({ id, input: { is_archived: true } });
          if (activeId === id) setActiveId(null);
        }}
        onWeeklyReview={handleWeeklyReview}
        weeklyReviewLoading={weeklyReviewLoading}
        persona={persona}
        onPersonaChange={setPersona}
      />

      <main className="flex-1 flex flex-col h-screen min-h-screen">
        {/* Header */}
        <header className="px-4 sm:px-6 py-3 border-b border-line bg-bg-alt/40 flex items-center gap-3 print:hidden">
          <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Pegasso
            </p>
            <p className="text-sm font-display italic text-ink truncate">
              Tu consejero estoico
            </p>
          </div>
          {activeId && messages.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              title="Imprimir / Guardar PDF de esta conversación"
              aria-label="Exportar conversación"
              className="h-8 w-8 rounded-full text-muted hover:text-ink hover:bg-bg-alt flex items-center justify-center"
            >
              <Printer size={14} />
            </button>
          )}
        </header>

        {/* Mensajes */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {/* Print-only header — identifica la conversación cuando se exporta a PDF */}
          {activeId && messages.length > 0 && (
            <div className="hidden print:block mb-6 pb-4 border-b border-line">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
                Pegasso · {currentConv?.title ?? "Conversación"}
              </p>
              <p className="font-mono text-[10px] text-muted">
                Exportado{" "}
                {new Date().toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {messages.length}{" "}
                {messages.length === 1 ? "mensaje" : "mensajes"}
              </p>
            </div>
          )}

          {!activeId && messages.length === 0 ? (
            <Onboarding onPick={(p) => void handleSend(p)} />
          ) : (
            <>
              {messages.map((m: PegassoMessage) => (
                <MessageBubble
                  key={m.id}
                  id={m.id}
                  role={m.role}
                  content={m.content}
                  error={m.error}
                  pinned={m.is_pinned}
                />
              ))}
              {isStreaming && (
                <MessageBubble
                  role="assistant"
                  content={streamingText || "·"}
                  streaming
                />
              )}
              {streamingError && !isStreaming && (
                <div className="rounded-card border border-danger/30 bg-danger/5 p-3 flex gap-2 items-start text-[12px]">
                  <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ink font-semibold">Pegasso no pudo responder</p>
                    <p className="text-muted">{streamingError}</p>
                    <p className="text-muted mt-1">
                      Verifica que la variable <code className="font-mono text-[11px] bg-bg/40 px-1 rounded">ANTHROPIC_API_KEY</code> está configurada en <code className="font-mono text-[11px] bg-bg/40 px-1 rounded">.env.local</code>.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-line bg-bg-alt/40 px-4 sm:px-6 py-3 sticky bottom-0 print:hidden" data-print-hide>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cuéntale a Pegasso lo que cargas hoy…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-bg border border-line rounded-2xl px-4 py-2.5 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent disabled:opacity-50 max-h-32"
              style={{ minHeight: 44 }}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isStreaming}
              className={clsx(
                "h-11 w-11 rounded-full flex items-center justify-center text-bg",
                "bg-accent hover:opacity-90 disabled:opacity-40 transition-opacity"
              )}
              aria-label="Enviar"
            >
              {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-muted text-center mt-1.5 italic">
            Pegasso es un consejero, no un terapeuta. Si necesitas ayuda profesional, búscala.
          </p>
        </div>
      </main>
    </div>
  );
}

const STARTERS = [
  "Tengo miedo al futuro y no sé por dónde empezar.",
  "Llevo días sin energía. ¿Qué hago?",
  "Quiero arrancar un negocio pero no sé en qué.",
  "Estoy en deudas y siento que no salgo.",
  "Tengo un objetivo, pero la disciplina me falla.",
  "Acabo de tener una pelea fuerte con alguien que amo.",
];

function Onboarding({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-6">
      <div className="space-y-2">
        <div className="w-14 h-14 rounded-full bg-accent/20 text-accent mx-auto flex items-center justify-center">
          <Sparkles size={24} />
        </div>
        <h2 className="font-display italic text-2xl text-ink">
          Hola. Soy Pegasso.
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
          Estoy aquí para escucharte y caminar contigo. Cuéntame lo que cargas o
          empieza con una de estas preguntas.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-card border border-line bg-bg-alt/30 hover:bg-bg-alt p-3 text-[12px] text-ink/90 italic transition-colors"
          >
            "{s}"
          </button>
        ))}
      </div>
    </div>
  );
}
