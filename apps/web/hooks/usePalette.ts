"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Dos paletas. Negro = tono stoic masculino (cream-blanco + negro).
 * Rosa = tono femenino (rosa polvo + guinda) inspirado en la
 * plantilla original de Estoicismo Digital (salmon + burgundy).
 *
 * La identidad de los pilares (Hábitos amarillo, Finanzas verde,
 * Emprendimiento azul, Mentalidad rojo) NO cambia entre paletas —
 * solo cambia el lienzo ambiental (bg, bg-alt, line, neutral, soft).
 *
 * `class` matches the CSS class applied to <html>.
 */
export type PaletteId = "negro" | "rosa";

export type PaletteMeta = {
  id: PaletteId;
  label: string;
  /** One-line feel descriptor shown under the label. */
  description: string;
  /** Hex swatches para el preview — son los 4 tokens ambientales que
   *  cambian cuando el usuario selecciona la paleta (bg, line, neutral
   *  y soft). Los colores de pilar NO cambian (brand lock), así que no
   *  aparecen aquí. Mirrors de los valores en globals.css — si editas
   *  uno, edita el otro. */
  swatches: { bg: string; line: string; neutral: string; soft: string };
};

export const PALETTES: PaletteMeta[] = [
  {
    id: "negro",
    label: "Negro",
    description: "Neutro stoic · blanco y negro",
    swatches: { bg: "#FCFAF6", line: "#D0CAC0", neutral: "#141416", soft: "#5A5A60" },
  },
  {
    id: "rosa",
    label: "Rosa",
    description: "Rosa polvo · guinda profundo",
    swatches: { bg: "#FDE4DE", line: "#E4A59C", neutral: "#7A2531", soft: "#F0AFA5" },
  },
];

const STORAGE_KEY = "palette";
const ALL_PALETTE_CLASSES = PALETTES.map((p) => `palette-${p.id}`);
/** Legacy palette classes (pre-simplificación) que podrían estar en
 *  <html> si el boot script corrió con el set viejo. Se barren al
 *  aplicar la nueva para evitar estado mixto. */
const LEGACY_PALETTE_CLASSES = [
  "palette-bronce",
  "palette-grafito",
  "palette-bosque",
  "palette-lavanda",
  "palette-coral",
];
export const DEFAULT_PALETTE: PaletteId = "negro";

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
  // momentarily (shouldn't happen, but keeps state deterministic). Also
  // wipes legacy classes in case the user is upgrading from the 6-palette
  // set — storage may still hold "bronce" etc.
  html.classList.remove(...ALL_PALETTE_CLASSES, ...LEGACY_PALETTE_CLASSES);
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
 * Palette is per-device (think: "I use rosa on my phone, negro on
 * desktop"). If we later want cloud sync, lift to useProfile().
 */
export function usePalette() {
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredPalette();
    setPaletteState(stored);
    // Self-heal legacy state: if the boot script applied a legacy class
    // (palette-bronce etc.) but storage resolved to the new default,
    // swap the class so the DOM matches React's source of truth.
    applyPaletteClass(stored);
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
