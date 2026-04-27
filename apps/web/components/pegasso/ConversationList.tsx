"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  MessageSquare,
  Trash2,
  Archive,
  Pin,
  CalendarRange,
  Loader2,
  Search,
  X,
  Sparkles,
  User2,
} from "lucide-react";
import { clsx } from "clsx";
import type { PegassoConversation } from "@estoicismo/supabase";
import { useSearchConversations } from "../../hooks/usePegasso";
import { PersonaSelector } from "./PersonaSelector";
import type { PegassoPersonaId } from "../../lib/pegasso/personas";

export function ConversationList(props: {
  conversations: PegassoConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onWeeklyReview?: () => void;
  weeklyReviewLoading?: boolean;
  persona?: PegassoPersonaId;
  onPersonaChange?: (id: PegassoPersonaId) => void;
}) {
  const {
    conversations,
    activeId,
    onSelect,
    onCreate,
    onDelete,
    onArchive,
    onWeeklyReview,
    weeklyReviewLoading,
    persona,
    onPersonaChange,
  } = props;

  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const isSearching = trimmed.length >= 2;
  const { data: results = [], isLoading: searchLoading } =
    useSearchConversations(query);

  return (
    <aside className="w-full lg:w-72 lg:border-r lg:border-line lg:bg-bg-alt/30 flex flex-col">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Conversaciones
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="p-1.5 rounded-md text-accent hover:bg-accent/10"
          aria-label="Nueva conversación"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-2 pb-1 border-b border-line">
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en mensajes…"
            className="w-full pl-7 pr-7 h-8 rounded-md bg-bg border border-line text-[12px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
              aria-label="Limpiar búsqueda"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Persona selector — al top, fácil de cambiar */}
      {persona && onPersonaChange && !isSearching && (
        <div className="px-3 py-2 border-b border-line">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted/70 mb-1 px-2.5">
            Modo
          </p>
          <PersonaSelector current={persona} onChange={onPersonaChange} />
        </div>
      )}

      {/* Quick actions — solo cuando no buscas */}
      {!isSearching && (
        <div className="px-3 py-2 border-b border-line space-y-1">
          {onWeeklyReview && (
            <button
              type="button"
              onClick={onWeeklyReview}
              disabled={weeklyReviewLoading}
              className="w-full inline-flex items-center gap-2 px-2.5 h-9 rounded-md text-[12px] text-ink hover:bg-accent/10 hover:text-accent transition-colors disabled:opacity-50"
            >
              {weeklyReviewLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CalendarRange size={14} />
              )}
              <span className="font-body">Review semanal</span>
            </button>
          )}
          <Link
            href="/pegasso/insights"
            className="w-full inline-flex items-center gap-2 px-2.5 h-9 rounded-md text-[12px] text-ink hover:bg-accent/10 hover:text-accent transition-colors"
          >
            <Pin size={14} />
            <span className="font-body">Mis insights</span>
          </Link>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <SearchResults
            loading={searchLoading}
            results={results}
            query={trimmed}
            onSelect={(convId) => {
              onSelect(convId);
              setQuery("");
            }}
          />
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-[12px] text-muted">
            <MessageSquare size={20} className="mx-auto mb-2 opacity-50" />
            <p>Sin conversaciones todavía.</p>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <div
                  className={clsx(
                    "group relative px-4 py-2.5 cursor-pointer border-l-2 transition-colors",
                    activeId === c.id
                      ? "border-accent bg-accent/5 text-ink"
                      : "border-transparent hover:bg-line/20 text-muted"
                  )}
                  onClick={() => onSelect(c.id)}
                >
                  <div className="flex items-center gap-1.5 pr-12">
                    {c.kind === "weekly_review" && (
                      <CalendarRange size={11} className="text-accent shrink-0" />
                    )}
                    <p className="text-[13px] font-medium truncate">{c.title}</p>
                  </div>
                  <p className="text-[10px] text-muted">
                    {formatRelative(c.last_message_at)}
                  </p>
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(c.id);
                      }}
                      className="p-1 text-muted hover:text-ink rounded"
                      aria-label="Archivar"
                    >
                      <Archive size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                      }}
                      className="p-1 text-muted hover:text-danger rounded"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function SearchResults({
  loading,
  results,
  query,
  onSelect,
}: {
  loading: boolean;
  results: import("@estoicismo/supabase").ConversationSearchResult[];
  query: string;
  onSelect: (conversationId: string) => void;
}) {
  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 size={16} className="animate-spin text-muted" />
      </div>
    );
  }
  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-[12px] text-muted">
        <p>Sin resultados para “{query}”.</p>
      </div>
    );
  }
  return (
    <ul className="py-1">
      {results.map((r) => {
        const isUser = r.role === "user";
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(r.conversation_id)}
              className="w-full text-left px-3 py-2 hover:bg-line/20 transition-colors border-b border-line/30"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={clsx(
                    "h-4 w-4 rounded-full flex items-center justify-center shrink-0",
                    isUser ? "bg-line/40 text-muted" : "bg-accent/20 text-accent"
                  )}
                >
                  {isUser ? <User2 size={9} /> : <Sparkles size={9} />}
                </span>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted truncate">
                  {r.conversation_title}
                </p>
                <span className="font-mono text-[9px] text-muted/70 ml-auto shrink-0">
                  {formatRelative(r.created_at)}
                </span>
              </div>
              <p className="text-[12px] text-ink line-clamp-3 leading-snug">
                {highlightQuery(r.snippet, query)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function highlightQuery(text: string, q: string): React.ReactNode {
  const lc = text.toLowerCase();
  const lcQ = q.toLowerCase();
  const idx = lc.indexOf(lcQ);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/20 text-ink rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}
