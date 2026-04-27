"use client";
import { Type } from "lucide-react";
import { clsx } from "clsx";
import {
  useFontSize,
  FONT_SIZE_OPTIONS,
  type FontSize,
} from "../../hooks/useFontSize";

/**
 * Selector de tamaño de fuente — 4 niveles para a11y.
 * Live-preview: el cambio aplica al instante via clase en <html>.
 */
export function FontSizeSelector() {
  const { size, setSize } = useFontSize();

  return (
    <div className="rounded-card border border-line bg-bg p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Type size={18} className="text-accent shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <h3 className="font-body text-sm font-medium text-ink">
            Tamaño de fuente
          </h3>
          <p className="font-body text-xs text-muted leading-relaxed mt-1">
            Aplica al instante. Persistido en este dispositivo.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {FONT_SIZE_OPTIONS.map((opt) => {
          const active = size === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSize(opt.id as FontSize)}
              className={clsx(
                "h-12 rounded-lg border flex flex-col items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-line bg-bg-alt/40 text-muted hover:text-ink hover:border-line-strong"
              )}
              aria-pressed={active}
            >
              <span
                className="font-display italic leading-none"
                style={{ fontSize: `${Math.max(13, opt.px - 4)}px` }}
              >
                Aa
              </span>
              <span className="font-mono text-[8px] uppercase tracking-widest mt-0.5">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
