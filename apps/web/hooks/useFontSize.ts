"use client";
import { useEffect, useState } from "react";

/**
 * Tamaño de fuente global · 3 niveles para a11y.
 *
 * Aplica una clase a <html> que escala la base font-size mediante
 * CSS variable. Persistido en localStorage. Default = "normal".
 *
 * Niveles:
 *  - small  · 14px base
 *  - normal · 16px base (default)
 *  - large  · 18px base
 *  - xl     · 20px base (vision-impaired)
 */

export type FontSize = "small" | "normal" | "large" | "xl";

const STORAGE_KEY = "fontSize";
const DEFAULT: FontSize = "normal";

const ALL_CLASSES: FontSize[] = ["small", "normal", "large", "xl"];

function readSaved(): FontSize {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && ALL_CLASSES.includes(v as FontSize)) return v as FontSize;
  } catch {
    /* ignore */
  }
  return DEFAULT;
}

function applyToDOM(size: FontSize): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  for (const c of ALL_CLASSES) html.classList.remove(`font-${c}`);
  html.classList.add(`font-${size}`);
}

export function useFontSize() {
  const [size, setSize] = useState<FontSize>(DEFAULT);

  useEffect(() => {
    const saved = readSaved();
    setSize(saved);
    applyToDOM(saved);
  }, []);

  function update(next: FontSize) {
    setSize(next);
    applyToDOM(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return { size, setSize: update };
}

export const FONT_SIZE_OPTIONS: { id: FontSize; label: string; px: number }[] = [
  { id: "small", label: "Pequeña", px: 14 },
  { id: "normal", label: "Normal", px: 16 },
  { id: "large", label: "Grande", px: 18 },
  { id: "xl", label: "Muy grande", px: 20 },
];
