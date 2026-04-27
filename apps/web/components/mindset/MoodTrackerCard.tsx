"use client";
import { useEffect, useMemo, useState } from "react";
import { HeartPulse, Loader2, Check } from "lucide-react";
import { clsx } from "clsx";
import { useMoodLogForDate, useUpsertMoodLog } from "../../hooks/useMindset";
import { getTodayStr } from "../../lib/dateUtils";

/**
 * Mood tracker — first-class del modulo Mentalidad.
 *
 * UX:
 *  - Una fila por día (UNIQUE en DB), upsert auto-guardado a los 600ms
 *    de inactividad.
 *  - Mood 1-5 obligatorio (emoji selector).
 *  - Energy 1-5 opcional (5 puntos).
 *  - Tags: chips frecuentes (ansiedad, gratitud, paz, ira, esperanza, miedo,
 *    duda, calma, alegría, frustración) + texto libre.
 *  - Notes: textarea libre.
 *
 * Tono: cálido, sin gamificar. No es una métrica que "se gana" — es
 * un espejo honesto.
 */

const MOOD_FACES = [
  { value: 1, emoji: "😞", label: "Mal" },
  { value: 2, emoji: "😕", label: "Bajo" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Bien" },
  { value: 5, emoji: "😄", label: "Excelente" },
] as const;

const COMMON_TAGS = [
  "ansiedad",
  "gratitud",
  "paz",
  "ira",
  "esperanza",
  "miedo",
  "duda",
  "calma",
  "alegría",
  "frustración",
  "soledad",
  "amor",
];

export function MoodTrackerCard() {
  const today = useMemo(() => getTodayStr(), []);
  const { data: log, isLoading } = useMoodLogForDate(today);
  const upsert = useUpsertMoodLog();

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  // Hidratar desde DB
  useEffect(() => {
    if (log) {
      setMood(log.mood);
      setEnergy(log.energy);
      setTags(log.tags ?? []);
      setNotes(log.notes ?? "");
    }
  }, [log]);

  // Auto-save: 700ms después del último cambio
  useEffect(() => {
    if (!dirty || mood === null) return;
    const t = setTimeout(() => {
      upsert.mutate(
        {
          occurred_on: today,
          mood,
          energy,
          tags,
          notes: notes.trim() || null,
        },
        {
          onSuccess: () => {
            setSaved(true);
            setDirty(false);
            setTimeout(() => setSaved(false), 2000);
          },
        }
      );
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, energy, tags, notes, dirty, today]);

  function toggleTag(tag: string) {
    setDirty(true);
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6 flex items-center justify-center min-h-[120px]">
        <Loader2 size={18} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <HeartPulse size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Tu estado · hoy
        </p>
        <span className="h-px flex-1 bg-line" />
        {(upsert.isPending || saved) && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted inline-flex items-center gap-1">
            {upsert.isPending ? (
              <>
                <Loader2 size={10} className="animate-spin" /> guardando
              </>
            ) : (
              <>
                <Check size={10} className="text-success" /> guardado
              </>
            )}
          </span>
        )}
      </div>

      {/* Mood selector */}
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
        ¿Cómo te sientes?
      </p>
      <div className="grid grid-cols-5 gap-2">
        {MOOD_FACES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => {
              setDirty(true);
              setMood(m.value);
            }}
            className={clsx(
              "flex flex-col items-center gap-1 py-3 rounded-lg border transition-all",
              mood === m.value
                ? "border-accent bg-accent/10"
                : "border-line bg-bg hover:border-line-strong"
            )}
          >
            <span className="text-2xl leading-none">{m.emoji}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Energy */}
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-5 mb-2">
        Energía (opcional)
      </p>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setDirty(true);
              setEnergy(energy === n ? null : n);
            }}
            className={clsx(
              "h-9 flex-1 rounded-lg border font-mono text-[11px] transition-all",
              energy !== null && n <= energy
                ? "border-accent bg-accent text-bg"
                : "border-line bg-bg text-muted hover:border-line-strong"
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Tags */}
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-5 mb-2">
        Emociones de hoy
      </p>
      <div className="flex flex-wrap gap-1.5">
        {COMMON_TAGS.map((tag) => {
          const active = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={clsx(
                "px-3 h-7 rounded-full border font-body text-xs transition-all",
                active
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-line bg-bg text-muted hover:text-ink hover:border-line-strong"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Notes */}
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-5 mb-2">
        Nota libre
      </p>
      <textarea
        value={notes}
        onChange={(e) => {
          setDirty(true);
          setNotes(e.target.value);
        }}
        rows={2}
        maxLength={500}
        placeholder="Una palabra, una frase. Lo que necesites soltar…"
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
    </div>
  );
}
