"use client";
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import {
  PEGASSO_PERSONAS,
  getPersona,
  type PegassoPersonaId,
} from "../../lib/pegasso/personas";

/**
 * Dropdown discreto que muestra la persona actual + permite cambiar
 * entre los 4 modos. La selección se persiste en localStorage via
 * usePegassoPersona y aplica desde la próxima respuesta.
 */
export function PersonaSelector({
  current,
  onChange,
}: {
  current: PegassoPersonaId;
  onChange: (id: PegassoPersonaId) => void;
}) {
  const [open, setOpen] = useState(false);
  const persona = getPersona(current);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full inline-flex items-center gap-2 px-2.5 h-9 rounded-md hover:bg-bg-alt text-[12px] text-ink transition-colors"
      >
        <span>{persona.emoji}</span>
        <span className="font-body flex-1 text-left truncate">
          {persona.label}
        </span>
        <ChevronDown
          size={12}
          className={clsx(
            "text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          {/* Backdrop para cerrar al click fuera */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 z-40 rounded-lg border border-line bg-bg shadow-xl overflow-hidden"
          >
            {PEGASSO_PERSONAS.map((p) => {
              const active = p.id === current;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className={clsx(
                    "w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors",
                    active
                      ? "bg-accent/10"
                      : "hover:bg-bg-alt"
                  )}
                >
                  <span className="text-base mt-0.5">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-ink inline-flex items-center gap-1.5">
                      {p.label}
                      {active && (
                        <Check size={11} className="text-accent" />
                      )}
                    </p>
                    <p className="font-body text-[11px] text-muted leading-snug">
                      {p.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
