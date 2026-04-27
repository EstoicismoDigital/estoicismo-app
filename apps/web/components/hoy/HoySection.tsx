"use client";
import { Check, X, RotateCcw } from "lucide-react";
import { clsx } from "clsx";

/**
 * Wrapper visual estandarizado para cada sección del ritual.
 *
 * Estados visibles del header:
 *  - pendiente: número del paso, texto normal.
 *  - hecho: check verde, título tachado suave.
 *  - saltado hoy: estilo gris, contenido oculto, link "deshacer".
 *
 * Subtle UX:
 *  - Border-l acento cuando hay foco dentro (focus-within) — feedback
 *    sutil de "estás trabajando aquí".
 *  - Padding-left para que el border no salte al hacer focus.
 *
 * El usuario puede:
 *  - Tocar "saltar hoy" si no aplica hoy (día de descanso, etc).
 *  - Tocar "deshacer" para reactivar la sección.
 */
export function HoySection({
  step,
  emoji,
  title,
  caption,
  done,
  skipped,
  onSkipToggle,
  anchor,
  children,
  hint,
}: {
  step: number;
  emoji: string;
  title: string;
  caption: string;
  done?: boolean;
  skipped?: boolean;
  onSkipToggle?: () => void;
  anchor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={anchor}
      className={clsx(
        "scroll-mt-20 relative",
        // Subtle accent border-l aparece SOLO cuando hay foco dentro.
        // No salta el layout porque siempre reservamos el padding-left.
        "pl-3 -ml-3 border-l-2 border-transparent transition-colors duration-200",
        "focus-within:border-accent/40",
        skipped && "opacity-60"
      )}
      aria-labelledby={`${anchor}-title`}
    >
      <header className="flex items-center gap-3 mb-3">
        <div
          className={clsx(
            "h-8 w-8 rounded-full flex items-center justify-center font-mono text-[11px] tabular-nums shrink-0 transition-colors",
            skipped
              ? "bg-bg-alt text-muted border border-line"
              : done
                ? "bg-success text-white"
                : "bg-accent/15 text-accent border border-accent/30"
          )}
        >
          {skipped ? "—" : done ? <Check size={14} strokeWidth={3} /> : step}
        </div>
        <div className="flex-1 min-w-0">
          <h2
            id={`${anchor}-title`}
            className={clsx(
              "font-display italic text-lg sm:text-xl text-ink leading-tight inline-flex items-center gap-1.5",
              skipped && "line-through decoration-1"
            )}
          >
            <span className="not-italic">{emoji}</span> {title}
          </h2>
          <p className="font-body text-xs text-muted leading-snug">
            {skipped ? "No aplica hoy" : caption}
          </p>
        </div>
        {onSkipToggle && (
          <button
            type="button"
            onClick={onSkipToggle}
            className="font-mono text-[9px] uppercase tracking-widest text-muted hover:text-ink inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-bg-alt transition-colors shrink-0"
            title={skipped ? "Reactivar sección" : "No aplica hoy"}
          >
            {skipped ? (
              <>
                <RotateCcw size={10} /> Deshacer
              </>
            ) : (
              <>
                <X size={10} /> Saltar
              </>
            )}
          </button>
        )}
      </header>
      {!skipped && children}
      {!skipped && hint && (
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted/70 mt-2 ml-11">
          {hint}
        </p>
      )}
    </section>
  );
}
