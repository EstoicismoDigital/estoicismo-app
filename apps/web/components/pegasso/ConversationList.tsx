"use client";
import Link from "next/link";
import {
  Plus,
  MessageSquare,
  Trash2,
  Archive,
  Pin,
  CalendarRange,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import type { PegassoConversation } from "@estoicismo/supabase";

export function ConversationList(props: {
  conversations: PegassoConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onWeeklyReview?: () => void;
  weeklyReviewLoading?: boolean;
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
  } = props;
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

      {/* Quick actions */}
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
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
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
