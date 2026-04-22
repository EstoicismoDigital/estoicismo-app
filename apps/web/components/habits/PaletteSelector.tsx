"use client";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { PALETTES, usePalette, type PaletteMeta } from "../../hooks/usePalette";

/**
 * Visual picker para las 2 paletas: Negro (neutro stoic) y Rosa
 * (guinda + rosa polvo). Cada card es:
 *   - role="radio" dentro de un radiogroup único
 *   - min 44×44 tap target
 *   - muestra los 4 tonos ambientales que cambian al seleccionar (bg,
 *     line, neutral, soft). Los colores de pilar no se muestran porque
 *     son fijos por brand lock — se mantienen iguales en ambas paletas.
 *   - la card activa lleva check badge + accent ring
 */
export function PaletteSelector() {
  const { palette, setPalette, mounted } = usePalette();
  const active = mounted ? palette : null;

  return (
    <div
      role="radiogroup"
      aria-label="Paletas"
      className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
    >
      {PALETTES.map((p) => {
        const isActive = active === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setPalette(p.id)}
            className={clsx(
              "relative flex items-center gap-3 p-3 rounded-card border transition-colors text-left min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isActive
                ? "border-accent bg-accent/5"
                : "border-line bg-bg hover:border-accent/40 hover:bg-bg-alt/40"
            )}
          >
            <SwatchStack swatches={p.swatches} />
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-medium text-ink truncate">
                {p.label}
              </p>
              <p className="font-body text-xs text-muted truncate">
                {p.description}
              </p>
            </div>
            {isActive && (
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-bg flex-shrink-0"
              >
                <Check size={12} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 4 swatches circulares mostrando la rampa tonal de la paleta:
 * bg (canvas) → line (borde) → neutral (accent) → soft. Va de claro a
 * oscuro para que el usuario vea el "mood" ambiental completo — no los
 * colores de pilar, que son fijos.
 */
function SwatchStack({ swatches }: { swatches: PaletteMeta["swatches"] }) {
  const stack = [swatches.bg, swatches.line, swatches.neutral, swatches.soft];
  return (
    <span
      aria-hidden
      className="flex items-center -space-x-1.5 flex-shrink-0"
    >
      {stack.map((c, i) => (
        <span
          key={i}
          className="w-5 h-5 rounded-full ring-2 ring-bg"
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  );
}
