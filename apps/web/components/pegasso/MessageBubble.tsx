"use client";
import { clsx } from "clsx";
import { Sparkles, User2 } from "lucide-react";
import type { PegassoMessageRole } from "@estoicismo/supabase";

export function MessageBubble(props: {
  role: PegassoMessageRole;
  content: string;
  /** Si está streaming, mostrar cursor parpadeante. */
  streaming?: boolean;
  /** Mensaje de error si aplica. */
  error?: string | null;
}) {
  const { role, content, streaming, error } = props;
  const isUser = role === "user";
  return (
    <div
      className={clsx(
        "flex gap-2 max-w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
          <Sparkles size={14} />
        </div>
      )}
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
          isUser
            ? "bg-accent text-bg rounded-br-sm"
            : "bg-bg-alt border border-line text-ink rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">
          {content}
          {streaming && (
            <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 align-middle animate-pulse" />
          )}
        </p>
        {error && (
          <p className="mt-1.5 text-[11px] text-danger italic">⚠️ {error}</p>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-line/40 text-muted flex items-center justify-center shrink-0">
          <User2 size={14} />
        </div>
      )}
    </div>
  );
}
