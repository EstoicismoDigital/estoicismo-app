"use client";
import { useMemo, useState } from "react";
import { Compass, ChevronDown, ChevronUp } from "lucide-react";
import { getStoicExerciseOfDay } from "../../lib/mindset/stoic-exercises";

/**
 * Ejercicio estoico del día.
 *
 * Determinístico: día del año mod 30 → mismo ejercicio para todos
 * los usuarios, mismo día. Cambia automáticamente a medianoche.
 *
 * Tono: editorial sobrio. Título en serif itálica, etiqueta mono.
 * Practica colapsada por defecto — el usuario decide profundizar.
 */
export function StoicExerciseCard() {
  const exercise = useMemo(() => getStoicExerciseOfDay(), []);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Compass size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Ejercicio de hoy · Stoa
        </p>
        <span className="h-px flex-1 bg-line" />
        {exercise.source && (
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
            {exercise.source}
          </p>
        )}
      </div>

      <h3 className="font-display italic text-xl sm:text-2xl text-ink leading-tight">
        {exercise.title}
      </h3>
      <p className="font-body text-sm sm:text-base text-muted mt-2 leading-relaxed">
        {exercise.description}
      </p>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-accent hover:text-ink transition-colors"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? "Ocultar práctica" : "Cómo practicarlo"}
      </button>

      {open && (
        <div className="mt-3 border-l-2 border-accent/40 pl-4 sm:pl-5">
          <p className="font-body text-sm text-ink leading-relaxed">
            {exercise.practice}
          </p>
        </div>
      )}
    </div>
  );
}
