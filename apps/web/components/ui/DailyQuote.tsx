"use client";
import { useState, useMemo, useEffect } from "react";
import { clsx } from "clsx";
import { getQuoteOfDay, type Quote } from "../../lib/quotes";

/**
 * "Reflexión del día" — muestra UNA frase, la del día-del-año.
 * Sin navegación, sin botones, sin swipe. Como un horóscopo: una
 * al día, punto. Si el usuario tiene la app abierta al cruzar la
 * medianoche, la frase rota sola al día siguiente.
 *
 * Props:
 *  - `quotes`   — catálogo de 365 frases del módulo.
 *  - `label`    — eyebrow: "Reflexión del día", "Carta al universo", etc.
 *  - `tone`     — clases de color override (eyebrow/text/author/divider).
 *  - `serif`    — true → font-display italic (default); false → sans.
 *  - `onQuote`  — callback con la frase resuelta (útil para guardar
 *                 como `intention` en la sesión de meditación).
 */
export function DailyQuote({
  quotes,
  label,
  tone,
  serif = true,
  className,
  onQuote,
}: {
  quotes: readonly Quote[];
  label: string;
  tone?: {
    eyebrow?: string;
    text?: string;
    author?: string;
    divider?: string;
  };
  serif?: boolean;
  className?: string;
  onQuote?: (quote: Quote) => void;
}) {
  // Fecha de referencia local — se recalcula en medianoche.
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      5
    ); // +5s margin por drift
    const ms = Math.max(1000, nextMidnight.getTime() - now.getTime());
    const t = window.setTimeout(() => setToday(new Date()), ms);
    return () => window.clearTimeout(t);
  }, [today]);

  const quote = useMemo(
    () => getQuoteOfDay(quotes, { date: today }),
    [quotes, today]
  );

  // Notifica al padre — útil para Meditación (guarda como intención).
  useEffect(() => {
    if (onQuote) onQuote(quote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  const eyebrowCls = tone?.eyebrow ?? "text-accent";
  const textCls = tone?.text ?? "text-ink";
  const authorCls = tone?.author ?? "text-muted";
  const dividerCls = tone?.divider ?? "bg-line";

  return (
    <div
      className={clsx("select-none", className)}
      role="region"
      aria-label={label}
    >
      {/* Eyebrow + divider */}
      <div className="flex items-center gap-2 mb-3">
        <p
          className={clsx(
            "font-mono text-[10px] uppercase tracking-widest",
            eyebrowCls
          )}
        >
          {label}
        </p>
        <span className={clsx("h-px flex-1 opacity-40", dividerCls)} />
      </div>

      {/* Frase — fade in suave al cambiar */}
      <div key={quote.text} className="animate-quote-fade">
        <blockquote
          className={clsx(
            serif
              ? "font-display italic text-lg sm:text-xl leading-relaxed"
              : "font-body text-base sm:text-lg leading-relaxed",
            textCls
          )}
        >
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        {quote.author && (
          <figcaption
            className={clsx(
              "mt-4 font-mono text-[10px] uppercase tracking-widest leading-relaxed",
              authorCls
            )}
          >
            — {quote.author}
            {quote.source ? ` · ${quote.source}` : ""}
          </figcaption>
        )}
      </div>
    </div>
  );
}
