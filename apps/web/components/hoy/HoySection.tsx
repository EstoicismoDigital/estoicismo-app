"use client";
import { Check } from "lucide-react";
import { clsx } from "clsx";

/**
 * Wrapper visual estandarizado para cada sección del ritual.
 * Header con número de paso, label, status (hecho / pendiente),
 * descripción una línea, y children abajo.
 *
 * Sin colapsar — el user scrollea linealmente. Eso es parte del
 * diseño: cada sección visible recuerda que está disponible.
 */
export function HoySection({
  step,
  emoji,
  title,
  caption,
  done,
  anchor,
  children,
  hint,
}: {
  step: number;
  emoji: string;
  title: string;
  caption: string;
  done?: boolean;
  anchor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={anchor}
      className="scroll-mt-20"
      aria-labelledby={`${anchor}-title`}
    >
      <header className="flex items-center gap-3 mb-3">
        <div
          className={clsx(
            "h-8 w-8 rounded-full flex items-center justify-center font-mono text-[11px] tabular-nums shrink-0 transition-colors",
            done
              ? "bg-success text-white"
              : "bg-accent/15 text-accent border border-accent/30"
          )}
        >
          {done ? <Check size={14} strokeWidth={3} /> : step}
        </div>
        <div className="flex-1 min-w-0">
          <h2
            id={`${anchor}-title`}
            className="font-display italic text-lg sm:text-xl text-ink leading-tight inline-flex items-center gap-1.5"
          >
            <span className="not-italic">{emoji}</span> {title}
          </h2>
          <p className="font-body text-xs text-muted leading-snug">
            {caption}
          </p>
        </div>
      </header>
      {children}
      {hint && (
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted/70 mt-2 ml-11">
          {hint}
        </p>
      )}
    </section>
  );
}
