"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type {
  FitnessExercise,
  FitnessWorkout,
  FitnessWorkoutSet,
} from "@estoicismo/supabase";

type DraftSet = {
  /** id real si ya existe (edición), undefined para nuevos. */
  id?: string;
  exercise_id: string;
  set_index: number;
  weight_kg: string;
  reps: string;
  duration_seconds: string;
  rpe: string;
};

export type WorkoutModalSubmit = {
  workout: {
    name: string;
    occurred_on: string;
    duration_minutes: number | null;
    mood: number | null;
    notes: string | null;
  };
  sets: {
    id?: string;
    exercise_id: string;
    set_index: number;
    weight_kg: number | null;
    reps: number | null;
    duration_seconds: number | null;
    rpe: number | null;
  }[];
  /** IDs de sets que existían en `existing` y fueron eliminados. */
  removedSetIds: string[];
};

/**
 * Modal para crear o editar un workout completo.
 *
 * Comportamiento:
 *   - Datos básicos arriba: nombre, fecha, duración total, mood, notas.
 *   - Lista de sets debajo, agrupados visualmente por ejercicio.
 *   - Botón "Agregar serie" abre un picker de ejercicio + inputs.
 *   - Eliminar set lo marca como removido (se confirma al guardar).
 *   - Validación mínima: nombre ≥ 1 char, al menos un set.
 */
export function WorkoutModal(props: {
  open: boolean;
  exercises: FitnessExercise[];
  workout?: FitnessWorkout | null;
  existingSets?: FitnessWorkoutSet[];
  onClose: () => void;
  onSave: (data: WorkoutModalSubmit) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, exercises, workout, existingSets, onClose, onSave, saving } = props;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Datos del workout
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState(workout?.name ?? "Sesión");
  const [occurredOn, setOccurredOn] = useState(workout?.occurred_on ?? today);
  const [duration, setDuration] = useState<string>(
    workout?.duration_minutes ? String(workout.duration_minutes) : ""
  );
  const [mood, setMood] = useState<number | null>(workout?.mood ?? null);
  const [notes, setNotes] = useState(workout?.notes ?? "");

  // Sets (drafts)
  const [drafts, setDrafts] = useState<DraftSet[]>(() => {
    if (!existingSets || existingSets.length === 0) return [];
    return existingSets
      .slice()
      .sort((a, b) => a.set_index - b.set_index)
      .map((s) => ({
        id: s.id,
        exercise_id: s.exercise_id,
        set_index: s.set_index,
        weight_kg: s.weight_kg !== null ? String(s.weight_kg) : "",
        reps: s.reps !== null ? String(s.reps) : "",
        duration_seconds: s.duration_seconds !== null ? String(s.duration_seconds) : "",
        rpe: s.rpe !== null ? String(s.rpe) : "",
      }));
  });
  const [removedSetIds, setRemovedSetIds] = useState<string[]>([]);

  // Ejercicio seleccionado para "agregar serie"
  const [pickerExerciseId, setPickerExerciseId] = useState<string>(
    exercises[0]?.id ?? ""
  );

  // Reinicializa cuando cambia el workout que estamos editando.
  useEffect(() => {
    if (!open) return;
    setName(workout?.name ?? "Sesión");
    setOccurredOn(workout?.occurred_on ?? today);
    setDuration(workout?.duration_minutes ? String(workout.duration_minutes) : "");
    setMood(workout?.mood ?? null);
    setNotes(workout?.notes ?? "");
    setDrafts(
      (existingSets ?? [])
        .slice()
        .sort((a, b) => a.set_index - b.set_index)
        .map((s) => ({
          id: s.id,
          exercise_id: s.exercise_id,
          set_index: s.set_index,
          weight_kg: s.weight_kg !== null ? String(s.weight_kg) : "",
          reps: s.reps !== null ? String(s.reps) : "",
          duration_seconds: s.duration_seconds !== null ? String(s.duration_seconds) : "",
          rpe: s.rpe !== null ? String(s.rpe) : "",
        }))
    );
    setRemovedSetIds([]);
  }, [open, workout, existingSets, today]);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const exerciseById = useMemo(() => {
    const m = new Map<string, FitnessExercise>();
    for (const e of exercises) m.set(e.id, e);
    return m;
  }, [exercises]);

  function addSet(exId?: string) {
    const targetEx = exId ?? pickerExerciseId;
    if (!targetEx) return;
    const ex = exerciseById.get(targetEx);
    if (!ex) return;
    // set_index: máximo actual del mismo ejercicio + 1.
    const idxOfSameEx = drafts.filter((d) => d.exercise_id === targetEx);
    const nextIndex = idxOfSameEx.length
      ? Math.max(...idxOfSameEx.map((d) => d.set_index)) + 1
      : 1;
    setDrafts((prev) => [
      ...prev,
      {
        exercise_id: targetEx,
        set_index: nextIndex,
        weight_kg: "",
        reps: "",
        duration_seconds: "",
        rpe: "",
      },
    ]);
  }

  function updateDraft(idx: number, patch: Partial<DraftSet>) {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function removeDraft(idx: number) {
    setDrafts((prev) => {
      const removed = prev[idx];
      if (removed?.id) setRemovedSetIds((r) => [...r, removed.id!]);
      return prev.filter((_, i) => i !== idx);
    });
  }

  // Agrupa drafts por exercise_id para vista
  const groupedDrafts = useMemo(() => {
    const groups: { exerciseId: string; rows: { draft: DraftSet; idx: number }[] }[] = [];
    drafts.forEach((d, idx) => {
      let g = groups.find((g) => g.exerciseId === d.exercise_id);
      if (!g) {
        g = { exerciseId: d.exercise_id, rows: [] };
        groups.push(g);
      }
      g.rows.push({ draft: d, idx });
    });
    return groups;
  }, [drafts]);

  async function handleSubmit() {
    if (!name.trim()) return;
    const setsClean = drafts.map((d) => ({
      id: d.id,
      exercise_id: d.exercise_id,
      set_index: d.set_index,
      weight_kg: d.weight_kg !== "" ? Number(d.weight_kg) : null,
      reps: d.reps !== "" ? Number(d.reps) : null,
      duration_seconds: d.duration_seconds !== "" ? Number(d.duration_seconds) : null,
      rpe: d.rpe !== "" ? Number(d.rpe) : null,
    }));
    await onSave({
      workout: {
        name: name.trim() || "Sesión",
        occurred_on: occurredOn,
        duration_minutes: duration !== "" ? Number(duration) : null,
        mood,
        notes: notes.trim() || null,
      },
      sets: setsClean,
      removedSetIds,
    });
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-xl bg-bg-alt sm:rounded-modal rounded-t-modal shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 backdrop-blur z-10 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">
            {workout ? "Editar workout" : "Nueva sesión"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-line/50 text-muted hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Datos básicos */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Empuje · Tracción · Pierna…"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={occurredOn}
                  onChange={(e) => setOccurredOn(e.target.value)}
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                  Duración (min)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={600}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60"
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                ¿Cómo te sentiste?
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMood(mood === n ? null : n)}
                    className={clsx(
                      "flex-1 py-2 rounded-lg border text-sm transition-colors",
                      mood === n
                        ? "bg-accent text-bg border-accent"
                        : "border-line text-muted hover:text-ink"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Lo que sentiste, lo que mejoró, lo que falta…"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent resize-none"
              />
            </div>
          </div>

          {/* Sets */}
          <div className="border-t border-line pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display italic text-base text-ink">Series</h3>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                {drafts.length} {drafts.length === 1 ? "serie" : "series"}
              </span>
            </div>

            {groupedDrafts.map((group) => {
              const ex = exerciseById.get(group.exerciseId);
              if (!ex) return null;
              return (
                <div key={group.exerciseId} className="rounded-card border border-line bg-bg/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{ex.name}</p>
                    <button
                      type="button"
                      onClick={() => addSet(ex.id)}
                      className="text-[10px] font-mono uppercase tracking-widest text-accent hover:text-ink flex items-center gap-1"
                    >
                      <Plus size={10} /> Otra serie
                    </button>
                  </div>
                  <div className="space-y-2">
                    {group.rows.map(({ draft, idx }) => (
                      <SetRow
                        key={`${idx}`}
                        draft={draft}
                        measurement={ex.measurement}
                        onChange={(patch) => updateDraft(idx, patch)}
                        onRemove={() => removeDraft(idx)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Picker para agregar nuevo ejercicio */}
            <div className="rounded-card border border-dashed border-line/80 p-3 flex items-center gap-2">
              <select
                value={pickerExerciseId}
                onChange={(e) => setPickerExerciseId(e.target.value)}
                className="flex-1 bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              >
                <option value="">Elige un ejercicio…</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addSet()}
                disabled={!pickerExerciseId}
                className="px-3 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest disabled:opacity-40 hover:opacity-90"
              >
                <Plus size={14} className="inline -mt-0.5" /> Agregar
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-line pt-4 flex justify-end gap-2 sticky bottom-0 bg-bg-alt/95 backdrop-blur -mx-5 px-5 -mb-4 pb-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className={clsx(
                "px-5 py-2 rounded-lg font-mono text-[11px] uppercase tracking-widest text-bg",
                "bg-accent hover:opacity-90 disabled:opacity-40",
                "flex items-center gap-2"
              )}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SetRow(props: {
  draft: DraftSet;
  measurement: "weight_reps" | "reps_only" | "duration";
  onChange: (patch: Partial<DraftSet>) => void;
  onRemove: () => void;
}) {
  const { draft, measurement, onChange, onRemove } = props;
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <span className="col-span-1 text-xs font-mono text-muted text-right">
        #{draft.set_index}
      </span>
      {measurement === "weight_reps" && (
        <>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.5"
            placeholder="kg"
            value={draft.weight_kg}
            onChange={(e) => onChange({ weight_kg: e.target.value })}
            className="col-span-4 bg-bg border border-line rounded-lg px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-accent"
          />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="reps"
            value={draft.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            className="col-span-3 bg-bg border border-line rounded-lg px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-accent"
          />
        </>
      )}
      {measurement === "reps_only" && (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="reps"
          value={draft.reps}
          onChange={(e) => onChange({ reps: e.target.value })}
          className="col-span-7 bg-bg border border-line rounded-lg px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-accent"
        />
      )}
      {measurement === "duration" && (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="segundos"
          value={draft.duration_seconds}
          onChange={(e) => onChange({ duration_seconds: e.target.value })}
          className="col-span-7 bg-bg border border-line rounded-lg px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-accent"
        />
      )}
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={10}
        placeholder="RPE"
        value={draft.rpe}
        onChange={(e) => onChange({ rpe: e.target.value })}
        className="col-span-3 bg-bg border border-line rounded-lg px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={onRemove}
        className="col-span-1 text-muted hover:text-danger flex items-center justify-center"
        aria-label="Eliminar serie"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
