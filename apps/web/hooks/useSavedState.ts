"use client";
import { useCallback, useRef, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Centraliza el estado de un autosave: idle → saving → saved/error.
 * Maneja race conditions: si dos `run()` corren en paralelo, solo
 * el último gana (los anteriores no actualizan estado al resolver).
 *
 * Uso:
 *   const save = useSavedState();
 *   await save.run(() => supabase.from("...").upsert(...));
 *   <SaveIndicator state={save.state} savedAt={save.savedAt} error={save.error} />
 */
export function useSavedState() {
  const [state, setState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<Promise<unknown> | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setState("saving");
    setError(null);
    let promise: Promise<T>;
    try {
      promise = fn();
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Error al guardar");
      return undefined;
    }
    inFlight.current = promise;
    try {
      const value = await promise;
      if (inFlight.current === promise) {
        setState("saved");
        setSavedAt(Date.now());
      }
      return value;
    } catch (e) {
      if (inFlight.current === promise) {
        setState("error");
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
      return undefined;
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  return { state, savedAt, error, run, reset };
}
