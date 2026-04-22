"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getQuoteOfDay, type Quote } from "../../lib/quotes";

/**
 * Carrusel de "reflexión del día" — muestra una frase seleccionada
 * determinísticamente por día-del-año. El usuario puede navegar
 * atrás/adelante para leer las de días anteriores o siguientes
 * (hasta ±30 por defecto). La principal (offset 0) es la del día
 * actual. Cambia automáticamente al cruzar la medianoche si el
 * componente se monta otro día.
 *
 * Props:
 *  - `quotes`     — catálogo 365 frases del módulo.
 *  - `label`      — eyebrow: "Reflexión del día" / "Tu carta al universo" / etc.
 *  - `tone`       — clases de color override (opcional). Default usa
 *                   `text-ink` sobre bg card; pásalo vacío y el padre
 *                   controla el fondo (hero oscuro, card clara, etc.)
 *  - `serif`      — si true, la frase se renderiza en `font-display`
 *                   (Lora italic) — default. Pásalo false para sans.
 *  - `maxSwing`   — cuántos días atrás/adelante puede navegar el usuario.
 *                   Default 30 (~mes). Siempre clamped a ±quotes.length-1.
 *
 * No usa keys con `new Date()` en el render — resuelve a fecha local
 * al montar y cuando se navega. Por eso no hay hydration mismatch.
 */
export function DailyQuoteCarousel({
  quotes,
  label,
  tone,
  serif = true,
  maxSwing = 30,
  className,
  onChange,
}: {
  quotes: readonly Quote[];
  label: string;
  tone?: {
    eyebrow?: string;
    text?: string;
    author?: string;
    controls?: string;
    controlsHover?: string;
    divider?: string;
  };
  serif?: boolean;
  maxSwing?: number;
  className?: string;
  /**
   * Notificación cada vez que cambia la frase visible (offset mount
   * incluido). Útil para componentes consumidores que quieren
   * sincronizar estado externo (ej. la intención de la sesión de
   * meditación = la frase visible del carrusel).
   */
  onChange?: (quote: Quote, offset: number) => void;
}) {
  // Offset 0 = hoy; -1 = ayer; +1 = mañana. Clamped en el useCallback.
  const [offset, setOffset] = useState(0);

  // El "día hoy" de referencia. Se recalcula solo si el componente se
  // remonta o cambia la fecha mientras está abierto — `useState`
  // inicial es puro, así que no hay hydration mismatch.
  const [today, setToday] = useState(() => new Date());

  // Si el componente está montado durante la medianoche, refrescamos
  // la fecha de referencia para que la frase rote sola.
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      5
    ); // +5s de margen por drift del setTimeout
    const ms = Math.max(1000, nextMidnight.getTime() - now.getTime());
    const t = window.setTimeout(() => setToday(new Date()), ms);
    return () => window.clearTimeout(t);
  }, [today]);

  const quote = useMemo(
    () => getQuoteOfDay(quotes, { date: today, offset }),
    [quotes, today, offset]
  );

  // Notifica al padre cada vez que la frase visible cambia. Mantenemos
  // la dependencia en el quote resuelto (no en `offset`) para cubrir
  // también el mount inicial y el rollover automático de medianoche.
  useEffect(() => {
    if (onChange) onChange(quote, offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  // Máximo swing real (no dejamos que el usuario dé la vuelta completa).
  const clampedMax = Math.min(maxSwing, Math.floor((quotes.length - 1) / 2));

  const canPrev = offset > -clampedMax;
  const canNext = offset < clampedMax;

  const go = useCallback(
    (dir: -1 | 1) => {
      setOffset((o) => {
        const next = o + dir;
        if (next < -clampedMax) return o;
        if (next > clampedMax) return o;
        return next;
      });
    },
    [clampedMax]
  );

  // Soporte teclado (←/→) cuando el carrusel tiene foco.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    },
    [go]
  );

  // Swipe mobile — simple threshold sin libs.
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchX(e.changedTouches[0]?.clientX ?? null);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchX;
    const dx = endX - touchX;
    if (Math.abs(dx) > 45) go(dx > 0 ? -1 : 1);
    setTouchX(null);
  };

  const label_ = offset === 0 ? label : offsetLabel(offset, label);

  const eyebrowCls = tone?.eyebrow ?? "text-accent";
  const textCls = tone?.text ?? "text-ink";
  const authorCls = tone?.author ?? "text-muted";
  const ctrlCls =
    tone?.controls ?? "text-muted hover:text-ink disabled:opacity-30";
  const dividerCls = tone?.divider ?? "bg-line";

  return (
    <div
      className={clsx(
        "group relative select-none",
        className
      )}
      role="region"
      aria-label={label}
      aria-roledescription="carrusel"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Eyebrow */}
      <div className="flex items-center gap-2 mb-3">
        <p className={clsx("font-mono text-[10px] uppercase tracking-widest", eyebrowCls)}>
          {label_}
        </p>
        <span className={clsx("h-px flex-1", dividerCls, "opacity-40")} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!canPrev}
            aria-label="Frase anterior"
            className={clsx(
              "inline-flex items-center justify-center h-7 w-7 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              ctrlCls
            )}
          >
            <ChevronLeft size={14} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!canNext}
            aria-label="Frase siguiente"
            className={clsx(
              "inline-flex items-center justify-center h-7 w-7 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              ctrlCls
            )}
          >
            <ChevronRight size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Frase — con fade in en cada cambio gracias a `key` */}
      <div key={offset} className="animate-quote-fade">
        <blockquote
          className={clsx(
            serif
              ? "font-display italic text-xl sm:text-2xl leading-relaxed"
              : "font-body text-lg sm:text-xl leading-relaxed",
            textCls
          )}
        >
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        {quote.author && (
          <figcaption
            className={clsx(
              "mt-3 font-mono text-[10px] uppercase tracking-widest",
              authorCls
            )}
          >
            — {quote.author}
          </figcaption>
        )}
      </div>
    </div>
  );
}

/**
 * Etiqueta humana para saber en qué día estás parado. Se construye
 * relativo a hoy porque el catálogo rota por día-del-año (no por
 * fecha-absoluta), así que "Mañana" es lo que verás mañana.
 */
function offsetLabel(offset: number, base: string): string {
  if (offset === -1) return `${base} · Ayer`;
  if (offset === 1) return `${base} · Mañana`;
  if (offset < 0) return `${base} · hace ${Math.abs(offset)} días`;
  return `${base} · en ${offset} días`;
}

// Nota: la animación `animate-quote-fade` se define en tailwind.config.ts
// para evitar estilos inline y mantener la regla de motion consistente.
// Duration 280ms ease-out, opacity 0→1 + translateY 4→0.
