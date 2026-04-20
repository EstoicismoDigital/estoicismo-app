"use client";
import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

function isTheme(v: unknown): v is Theme {
  return v === "light" || v === "dark" || v === "system";
}

function getSystemPreference(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(v) ? v : "system";
  } catch {
    return "system";
  }
}

function applyThemeClass(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/**
 * Tri-state theme hook: `light` | `dark` | `system`.
 *
 * - Initial DOM class is set by an inline boot script in layout.tsx
 *   (prevents FOUC). This hook picks up the stored preference on mount
 *   and subscribes to OS changes while in `system` mode.
 * - Writes to localStorage and the `<html>` class on every change.
 * - `resolvedTheme` is the concrete mode currently displayed
 *   (`system` collapses to `light` or `dark`).
 */
export function useTheme() {
  // Start with `system` on both server and first client render to avoid
  // hydration mismatch. Real value is hydrated in the first effect.
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Hydrate from storage on mount.
  useEffect(() => {
    const stored = readStoredTheme();
    const resolved = stored === "system" ? getSystemPreference() : stored;
    setThemeState(stored);
    setResolvedTheme(resolved);
    setMounted(true);
  }, []);

  // When in "system" mode, track OS preference changes live.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const next: ResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(next);
      applyThemeClass(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore — private mode / disabled storage */
    }
    const resolved = next === "system" ? getSystemPreference() : next;
    setThemeState(next);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, []);

  return { theme, resolvedTheme, setTheme, mounted };
}
