"use client";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { PALETTES, usePalette, type PaletteMeta } from "../../hooks/usePalette";

/**
 * Visual picker for the 6 app palettes, grouped into Hombre / Mujer
 * sections as the user requested. Each swatch card is:
 *   - role="radio" inside a radiogroup
 *   - min 44×44 tap target (44px swatch + padding wrapping in button)
 *   - shows the four palette colors (neutral + 3 modules) so the user
 *     can preview the chrome AND how each module will look
 *   - the active card gets a check badge + accent ring
 *
 * We split the selector into two radiogroups (one per section) to keep
 * each group's arrow-key navigation contained, which matches how
 * assistive tech expects radio sub-sections to behave.
 */
export function PaletteSelector() {
  const { palette, setPalette, mounted } = usePalette();

  const hombre = PALETTES.filter((p) => p.group === "hombre");
  const mujer = PALETTES.filter((p) => p.group === "mujer");

  return (
    <div className="flex flex-col gap-5">
      <PaletteGroup
        heading="Hombre"
        items={hombre}
        active={mounted ? palette : null}
        onPick={setPalette}
      />
      <PaletteGroup
        heading="Mujer"
        items={mujer}
        active={mounted ? palette : null}
        onPick={setPalette}
      />
    </div>
  );
}

function PaletteGroup({
  heading,
  items,
  active,
  onPick,
}: {
  heading: string;
  items: PaletteMeta[];
  active: string | null;
  onPick: (id: PaletteMeta["id"]) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
        {heading}
      </p>
      <div
        role="radiogroup"
        aria-label={`Paletas ${heading}`}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
      >
        {items.map((p) => {
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onPick(p.id)}
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
    </div>
  );
}

/**
 * 4 stacked circular swatches showing the palette's tokens in order:
 * neutral (shell chrome) + 3 module accents. Sized for density — the
 * user is scanning many options at once, not studying one.
 */
function SwatchStack({ swatches }: { swatches: PaletteMeta["swatches"] }) {
  const stack = [
    swatches.neutral,
    swatches.habits,
    swatches.finanzas,
    swatches.reflexiones,
  ];
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
