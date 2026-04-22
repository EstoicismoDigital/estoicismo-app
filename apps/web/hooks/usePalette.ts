"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Named palettes the user can pick from. Grouped for the UI by
 * `genderHint` so Ajustes can render "Hombre" / "Mujer" sections as the
 * user asked — the grouping is metadata, nothing behavioral depends on
 * it. `class` matches the CSS class applied to <html>.
 */
export type PaletteId =
  | "bronce"
  | "grafito"
  | "bosque"
  | "rosa"
  | "lavanda"
  | "coral";

export type PaletteMeta = {
  id: PaletteId;
  label: string;
  /** One-line feel descriptor shown under the label. */
  description: string;
  group: "hombre" | "mujer";
  /** Hex swatches for the 4 palette tokens — used purely for the UI
   *  preview. Mirrors the values in globals.css; if you change one,
   *  change the other. */
  swatches: { neutral: string; habits: string; finanzas: string; reflexiones: string };
};

export const PALETTES: PaletteMeta[] = [
  {
    id: "bronce",
    label: "Bronce",
    description: "Tierra cálida · el tono original",
    group: "hombre",
    swatches: { neutral: "#8B6F47", habits: "#B48A38", finanzas: "#22774E", reflexiones: "#5F5994" },
  },
  {
    id: "grafito",
    label: "Grafito",
    description: "Acero frío · arquitectónico",
    group: "hombre",
    swatches: { neutral: "#475569", habits: "#64748B", finanzas: "#0E7490", reflexiones: "#4F46E5" },
  },
  {
    id: "bosque",
    label: "Bosque",
    description: "Verde profundo · brasa templada",
    group: "hombre",
    swatches: { neutral: "#344F40", habits: "#A68439", finanzas: "#15803D", reflexiones: "#78350F" },
  },
  {
    id: "rosa",
    label: "Rosa antiguo",
    description: "Terracota suave · salvia",
    group: "mujer",
    swatches: { neutral: "#B46469", habits: "#C88264", finanzas: "#788C64", reflexiones: "#9D5C8E" },
  },
  {
    id: "lavanda",
    label: "Lavanda",
    description: "Violeta suave · miel clara",
    group: "mujer",
    swatches: { neutral: "#7C60B0", habits: "#BE965F", finanzas: "#64A082", reflexiones: "#8B5CF6" },
  },
  {
    id: "coral",
    label: "Coral",
    description: "Vibrante · ámbar y turquesa",
    group: "mujer",
    swatches: { neutral: "#D25555", habits: "#D97706", finanzas: "#0D9488", reflexiones: "#DB2777" },
  },
];

const STORAGE_KEY = "palette";
const ALL_PALETTE_CLASSES = PALETTES.map((p) => `palette-${p.id}`);
export const DEFAULT_PALETTE: PaletteId = "bronce";

export function isPaletteId(v: unknown): v is PaletteId {
  return (
    typeof v === "string" &&
    (PALETTES as readonly { id: string }[]).some((p) => p.id === v)
  );
}

function readStoredPalette(): PaletteId {
  if (typeof window === "undefined") return DEFAULT_PALETTE;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isPaletteId(v) ? v : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
}

function applyPaletteClass(id: PaletteId) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  // Remove any sibling palette class before adding the target. This
  // guards against cases where the boot script and this hook disagree
  // momentarily (shouldn't happen, but keeps state deterministic).
  html.classList.remove(...ALL_PALETTE_CLASSES);
  html.classList.add(`palette-${id}`);
}

/**
 * Palette hook — mirrors the existing useTheme() API shape so the
 * settings page can consume both uniformly.
 *
 * Flow:
 *   1. Boot script in layout.tsx has already set the palette class on
 *      <html> before React hydrates — no FOUC.
 *   2. Hook reads storage on mount, mirrors to state.
 *   3. `setPalette(id)` writes storage + flips the class.
 *
 * This intentionally does NOT sync to Supabase / the user's profile.
 * Palette is per-device (think: "I use rose on my phone, grafito on
 * desktop"). If we later want cloud sync, lift to useProfile().
 */
export function usePalette() {
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPaletteState(readStoredPalette());
    setMounted(true);
  }, []);

  const setPalette = useCallback((next: PaletteId) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore — private mode / disabled storage */
    }
    applyPaletteClass(next);
    setPaletteState(next);
  }, []);

  return { palette, setPalette, mounted };
}
