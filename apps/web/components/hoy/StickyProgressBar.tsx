"use client";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  SECTION_EMOJIS,
  SECTION_LABELS,
  type RitualSection,
} from "../../lib/hoy/ritual";

/**
 * Mini progress bar sticky en la parte alta de /hoy. Aparece solo
 * cuando el user scrolleó más allá del hero (intersection observer
 * con un sentinel invisible al inicio del documento).
 *
 * Visualmente es:
 *  - Una barra dorada que avanza de 0% a 100%.
 *  - El conteo "X / Y" a la izquierda.
 *  - Emojis de cada sección (gris si pendiente, color si done).
 *  - Tappable: tocar un emoji scrollea a su sección.
 *
 * Por qué: cuando el user lleva 4 secciones llenas y está scrolleando
 * para encontrar la 5ta, no debería tener que scroll-up al hero para
 * ver progreso. Esto les da feedback constante.
 */
export function StickyProgressBar({
  completed,
  total,
  onJump,
  sections,
}: {
  completed: number;
  total: number;
  onJump?: (id: string) => void;
  sections: RitualSection[];
}) {
  const [visible, setVisible] = useState(false);

  // Aparece cuando el scroll vertical pasa los ~360px (altura aprox del hero)
  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 320);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial state
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const ritualMet = completed >= Math.min(4, total);

  return (
    <div
      data-print-hide
      className={clsx(
        // Solo móvil: en desktop el masthead ya provee orientación y la
        // progress bar se montaba sobre él (z-40 sobre z-30) creando un
        // overlay fantasma con números cortados. En móvil sí es útil.
        "fixed top-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-line transition-all duration-200 print:hidden",
        "md:hidden"
      )}
      role="status"
      aria-label={`Ritual del día: ${completed} de ${total} secciones`}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
        <span
          className={clsx(
            "font-mono text-[11px] uppercase tracking-widest tabular-nums shrink-0",
            ritualMet ? "text-success" : "text-accent"
          )}
        >
          {completed}/{total}
        </span>
        <div className="flex-1 h-1 bg-bg-alt rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full transition-all duration-500",
              ritualMet ? "bg-success" : "bg-accent"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="hidden sm:flex items-center gap-0.5">
          {sections
            .filter((s) => s.available)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onJump?.(s.id)}
                title={SECTION_LABELS[s.id]}
                className={clsx(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] transition-all",
                  s.done
                    ? "bg-accent/15 grayscale-0"
                    : "grayscale opacity-40 hover:opacity-80 hover:grayscale-0"
                )}
              >
                {SECTION_EMOJIS[s.id]}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
