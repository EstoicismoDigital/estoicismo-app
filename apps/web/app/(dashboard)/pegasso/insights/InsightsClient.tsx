"use client";
import Link from "next/link";
import { ArrowLeft, Loader2, Pin, PinOff, Sparkles } from "lucide-react";
import {
  usePinnedMessages,
  useTogglePinMessage,
} from "../../../../hooks/usePegasso";

/**
 * Pegasso · Mis insights.
 *
 * Lista de mensajes que el user fijó (pin) en sus conversaciones con
 * Pegasso. Pensado como un "cuaderno de sabiduría personal" — frases
 * que quiere revisitar.
 *
 * Ordenado por pinned_at desc. Click en cada uno: scroll-to-message
 * en su conversación original (link con anchor).
 */
export function InsightsClient() {
  const { data: pinned = [], isLoading } = usePinnedMessages();
  const togglePin = useTogglePinMessage();

  return (
    <div data-module="pegasso" className="min-h-screen">
      {/* Hero */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href="/pegasso"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft size={11} /> Volver a Pegasso
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Mis insights · Pegasso
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl leading-tight">
            Tu cuaderno de sabiduría.
          </h1>
          <p className="font-body text-white/60 text-sm mt-3 max-w-prose leading-relaxed">
            Frases de Pegasso que decidiste guardar. Vuelve a ellas cuando
            necesites recordarlo.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 size={20} className="animate-spin text-muted" />
          </div>
        ) : pinned.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {pinned.map((msg) => (
              <li
                key={msg.id}
                className="rounded-card border border-accent/20 bg-accent/5 p-4 sm:p-5"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-accent text-bg flex items-center justify-center shrink-0">
                    <Pin size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted truncate">
                      {msg.conversation_title}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted/70">
                      Guardado {formatDate(msg.pinned_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePin.mutate({ id: msg.id, pin: false })}
                    className="h-7 px-2.5 rounded-full font-mono text-[9px] uppercase tracking-widest text-muted hover:text-danger hover:bg-bg inline-flex items-center gap-1"
                  >
                    <PinOff size={10} /> Quitar
                  </button>
                </div>
                <p className="font-body text-[15px] text-ink whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-accent/10 text-accent mx-auto flex items-center justify-center mb-4">
        <Sparkles size={22} />
      </div>
      <p className="font-display italic text-lg text-ink mb-2">
        Aún no has guardado insights.
      </p>
      <p className="font-body text-sm text-muted max-w-xs mx-auto leading-relaxed">
        En cualquier respuesta de Pegasso, tocá{" "}
        <span className="font-mono text-[11px] bg-bg-alt px-1.5 py-0.5 rounded">
          Insight
        </span>{" "}
        para guardarla aquí.
      </p>
      <Link
        href="/pegasso"
        className="inline-flex items-center gap-1.5 mt-5 h-10 px-5 rounded-full bg-accent text-bg font-body text-sm font-medium hover:opacity-90"
      >
        Ir a Pegasso
      </Link>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  return dt.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
