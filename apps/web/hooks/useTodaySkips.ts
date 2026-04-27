"use client";
import { useCallback, useEffect, useState } from "react";
import { getTodayStr } from "../lib/dateUtils";
import type { RitualSectionId } from "../lib/hoy/ritual";

/**
 * "Saltar hoy" — el user puede marcar secciones del ritual como
 * "no aplica hoy" sin que afecten su racha. Persistido en localStorage
 * por día (key `hoy:skips:YYYY-MM-DD`).
 *
 * Ej: si tu sábado es día de descanso, saltas "Cuerpo" y la sección
 * cuenta como completa para el ritual.
 */

const KEY_PREFIX = "hoy:skips:";

function loadSkips(date: string): Set<RitualSectionId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + date);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr as RitualSectionId[]);
  } catch {
    return new Set();
  }
}

function saveSkips(date: string, skips: Set<RitualSectionId>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY_PREFIX + date,
      JSON.stringify(Array.from(skips))
    );
  } catch {
    /* full disk → ignore */
  }
}

export function useTodaySkips() {
  const today = getTodayStr();
  const [skips, setSkips] = useState<Set<RitualSectionId>>(() =>
    loadSkips(today)
  );

  // Reload if window storage changes (multi-tab safety) or day rolls
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY_PREFIX + today) {
        setSkips(loadSkips(today));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [today]);

  const toggle = useCallback(
    (id: RitualSectionId) => {
      setSkips((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveSkips(today, next);
        return next;
      });
    },
    [today]
  );

  const isSkipped = useCallback(
    (id: RitualSectionId) => skips.has(id),
    [skips]
  );

  return { skips, isSkipped, toggle };
}
