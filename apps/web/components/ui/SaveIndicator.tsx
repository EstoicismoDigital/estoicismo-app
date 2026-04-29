"use client";
import { useEffect, useState } from "react";
import type { SaveState } from "../../hooks/useSavedState";

/**
 * Pequeño indicador de estado de autosave. Muestra:
 *   - "Guardando…" (saving)
 *   - "Guardado hace Xs" (saved, se actualiza cada 30s)
 *   - mensaje de error (error)
 *   - nada (idle)
 *
 * Diseñado para acompañar a useSavedState. ARIA-live para que
 * lectores de pantalla anuncien cambios.
 */
export function SaveIndicator({
  state,
  savedAt,
  error,
}: {
  state: SaveState;
  savedAt: number | null;
  error?: string | null;
}) {
  // Tick para refrescar "hace Xs" cada 30 segundos
  const [, setTick] = useState(0);
  useEffect(() => {
    if (state !== "saved" || !savedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, [state, savedAt]);

  if (state === "idle") return null;

  if (state === "saving") {
    return (
      <span
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted"
        aria-live="polite"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse" />
        Guardando…
      </span>
    );
  }

  if (state === "error") {
    return (
      <span
        className="inline-flex items-center gap-1.5 font-mono text-xs text-danger"
        role="alert"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        {error ?? "Error al guardar"}
      </span>
    );
  }

  if (state === "saved" && savedAt) {
    const ageSec = Math.max(1, Math.floor((Date.now() - savedAt) / 1000));
    const label =
      ageSec < 60
        ? `Guardado hace ${ageSec}s`
        : ageSec < 3600
          ? `Guardado hace ${Math.floor(ageSec / 60)}m`
          : `Guardado hace ${Math.floor(ageSec / 3600)}h`;
    return (
      <span
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted"
        aria-live="polite"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        {label}
      </span>
    );
  }

  return null;
}
