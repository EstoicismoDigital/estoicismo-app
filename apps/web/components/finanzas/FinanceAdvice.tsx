"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Quote as QuoteIcon } from "lucide-react";
import { useFinanceQuotes } from "../../hooks/useFinance";
import type { FinanceQuoteTag } from "@estoicismo/supabase";

/**
 * Tarjeta de consejo financiero — frases de libros clásicos.
 *
 * - Rota automáticamente cada `rotateMs` (por default 12s) entre todas
 *   las frases disponibles del tag seleccionado.
 * - El botón ↻ permite cambiar manualmente.
 * - Si `tag` se pasa, filtra la lista en DB; si no, trae todas.
 */
export function FinanceAdvice({
  tag,
  rotateMs = 12_000,
  className,
}: {
  tag?: FinanceQuoteTag;
  rotateMs?: number;
  className?: string;
}) {
  const { data: quotes = [] } = useFinanceQuotes(tag);
  const [idx, setIdx] = useState(0);

  // Random start para que no todos vean la misma frase primero.
  useEffect(() => {
    if (quotes.length === 0) return;
    setIdx(Math.floor(Math.random() * quotes.length));
  }, [quotes.length]);

  useEffect(() => {
    if (quotes.length < 2) return;
    const h = window.setInterval(() => {
      setIdx((i) => (i + 1) % quotes.length);
    }, rotateMs);
    return () => window.clearInterval(h);
  }, [quotes.length, rotateMs]);

  if (quotes.length === 0) {
    return null;
  }

  const q = quotes[idx];

  return (
    <figure
      className={
        "rounded-card border border-line bg-bg-alt/60 p-5 sm:p-6 relative overflow-hidden " +
        (className ?? "")
      }
    >
      <QuoteIcon
        size={60}
        className="absolute -top-2 -right-2 text-accent/10 pointer-events-none"
        aria-hidden
      />
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">
        Consejo
      </p>
      <blockquote className="font-display italic text-lg sm:text-xl text-ink leading-snug">
        &ldquo;{q.text}&rdquo;
      </blockquote>
      <figcaption className="mt-3 flex items-center justify-between gap-3">
        <div className="font-body text-xs text-muted">
          — {q.author}
          {q.source && (
            <span className="text-muted/70">, {q.source}</span>
          )}
        </div>
        {quotes.length > 1 && (
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % quotes.length)}
            aria-label="Siguiente consejo"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted hover:text-accent hover:bg-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <RefreshCw size={12} aria-hidden />
          </button>
        )}
      </figcaption>
    </figure>
  );
}
