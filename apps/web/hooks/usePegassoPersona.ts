"use client";
import { useEffect, useState } from "react";
import {
  PEGASSO_DEFAULT_PERSONA,
  type PegassoPersonaId,
} from "../lib/pegasso/personas";

const STORAGE_KEY = "pegasso:persona";

function readSaved(): PegassoPersonaId {
  if (typeof window === "undefined") return PEGASSO_DEFAULT_PERSONA;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (
      v === "estoico" ||
      v === "paterno" ||
      v === "hermano" ||
      v === "mentora"
    ) {
      return v;
    }
  } catch {
    /* ignore */
  }
  return PEGASSO_DEFAULT_PERSONA;
}

export function usePegassoPersona() {
  const [persona, setPersonaState] = useState<PegassoPersonaId>(
    PEGASSO_DEFAULT_PERSONA
  );

  useEffect(() => {
    setPersonaState(readSaved());
  }, []);

  function setPersona(next: PegassoPersonaId) {
    setPersonaState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return { persona, setPersona };
}
