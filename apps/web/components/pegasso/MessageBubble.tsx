"use client";
import { clsx } from "clsx";
import { Sparkles, User2, Pin, PinOff, Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import type {
  PegassoMessageRole,
  SuggestedAction,
} from "@estoicismo/supabase";
import { useTogglePinMessage } from "../../hooks/usePegasso";
import { SuggestedActionCard } from "./SuggestedActionCard";

export function MessageBubble(props: {
  role: PegassoMessageRole;
  content: string;
  /** Si está streaming, mostrar cursor parpadeante. */
  streaming?: boolean;
  /** Mensaje de error si aplica. */
  error?: string | null;
  /** ID de DB — si está presente, el bubble muestra acciones (pin, copy). */
  id?: string;
  /** ¿Está fijado como insight? Solo aplica a assistant. */
  pinned?: boolean;
  /** Estado mientras Pegasso ejecuta tools ("consultando finanzas…"). */
  statusLabel?: string | null;
  /** Acciones sugeridas (solo en mensajes assistant persistidos). */
  suggestedActions?: SuggestedAction[];
}) {
  const { role, content, streaming, error, id, pinned, statusLabel, suggestedActions } = props;
  const isUser = role === "user";
  const togglePin = useTogglePinMessage();
  const [copied, setCopied] = useState(false);

  const showActions = !isUser && id && !streaming && !error;

  function copy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <div
      className={clsx(
        "group flex gap-2 max-w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div
          className={clsx(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
            pinned ? "bg-accent text-bg" : "bg-accent/20 text-accent"
          )}
        >
          {pinned ? <Pin size={14} /> : <Sparkles size={14} />}
        </div>
      )}
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed relative",
          isUser
            ? "bg-accent text-bg rounded-br-sm"
            : pinned
              ? "bg-accent/10 border border-accent/40 text-ink rounded-bl-sm"
              : "bg-bg-alt border border-line text-ink rounded-bl-sm"
        )}
      >
        {statusLabel ? (
          <p className="flex items-center gap-2 text-muted italic text-[13px]">
            <Loader2 size={12} className="animate-spin" />
            {statusLabel}
          </p>
        ) : (
          <p className="whitespace-pre-wrap break-words">
            {content}
            {streaming && (
              <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        )}
        {error && (
          <p className="mt-1.5 text-[11px] text-danger italic">⚠️ {error}</p>
        )}

        {/* Suggested actions — confirmable cards */}
        {!isUser && id && suggestedActions && suggestedActions.length > 0 && (
          <div className="mt-3 space-y-2">
            {suggestedActions.map((a) => (
              <SuggestedActionCard key={a.id} messageId={id} action={a} />
            ))}
          </div>
        )}

        {showActions && (
          <div className="mt-2 pt-2 border-t border-line/50 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity print:hidden">
            <button
              type="button"
              onClick={() => togglePin.mutate({ id, pin: !pinned })}
              className={clsx(
                "inline-flex items-center gap-1 h-6 px-2 rounded-full font-mono text-[9px] uppercase tracking-widest",
                pinned
                  ? "bg-accent text-bg"
                  : "text-muted hover:bg-bg hover:text-ink"
              )}
              title={pinned ? "Quitar insight" : "Guardar como insight"}
            >
              {pinned ? <PinOff size={9} /> : <Pin size={9} />}
              {pinned ? "Quitar" : "Insight"}
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 h-6 px-2 rounded-full font-mono text-[9px] uppercase tracking-widest text-muted hover:bg-bg hover:text-ink"
              title="Copiar"
            >
              {copied ? <Check size={9} /> : <Copy size={9} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
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
