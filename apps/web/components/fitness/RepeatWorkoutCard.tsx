"use client";
import { useMemo, useState } from "react";
import {
  Repeat,
  Loader2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import {
  useWorkouts,
  useAllUserSets,
  useCreateWorkout,
  useCreateWorkoutSet,
} from "../../hooks/useFitness";
import type { FitnessExercise } from "@estoicismo/supabase";

/**
 * RepeatWorkoutCard · "templates" derivados del historial.
 *
 * Lista las últimas 3 sesiones distintas (por nombre o fecha) como
 * tarjetas con sus ejercicios. Click → crea workout nuevo idéntico
 * en plantilla (mismo nombre, mismos exercise_id, sets vacíos).
 *
 * No se guarda como template explícito en DB — se infiere del
 * historial. Si el user nunca ha entrenado, no renderiza.
 */
export function RepeatWorkoutCard({
  exercises,
}: {
  exercises: FitnessExercise[];
}) {
  const router = useRouter();
  // Últimos 30 workouts para inferir templates
  const { data: workouts = [], isLoading: lw } = useWorkouts({ limit: 30 });
  const { data: allSets = [], isLoading: ls } = useAllUserSets({
    limit: 500,
  });
  const createWorkout = useCreateWorkout();
  const createSet = useCreateWorkoutSet();
  const [applying, setApplying] = useState<string | null>(null);

  const exById = useMemo(() => {
    const m = new Map<string, FitnessExercise>();
    for (const e of exercises) m.set(e.id, e);
    return m;
  }, [exercises]);

  // Agrupar sets por workout_id
  const setsByWorkout = useMemo(() => {
    const m = new Map<string, typeof allSets>();
    for (const s of allSets) {
      const arr = m.get(s.workout_id);
      if (arr) arr.push(s);
      else m.set(s.workout_id, [s]);
    }
    return m;
  }, [allSets]);

  // Top 3 workouts únicos por nombre, más recientes primero
  const templates = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{
      workoutId: string;
      name: string;
      occurredOn: string;
      exerciseIds: string[];
      totalSets: number;
    }> = [];
    for (const w of workouts) {
      const key = (w.name || "").trim().toLowerCase() || w.id;
      if (seen.has(key)) continue;
      seen.add(key);
      const sets = setsByWorkout.get(w.id) ?? [];
      if (sets.length === 0) continue; // sin sets no es template útil
      const exerciseIds = Array.from(new Set(sets.map((s) => s.exercise_id)));
      result.push({
        workoutId: w.id,
        name: w.name || "Sesión sin nombre",
        occurredOn: w.occurred_on,
        exerciseIds,
        totalSets: sets.length,
      });
      if (result.length >= 3) break;
    }
    return result;
  }, [workouts, setsByWorkout]);

  if (lw || ls) {
    return null; // discreto — no muestra spinner si está cargando
  }
  if (templates.length === 0) return null;

  async function applyTemplate(t: (typeof templates)[number]) {
    if (applying) return;
    setApplying(t.workoutId);
    try {
      const today = new Date().toISOString().slice(0, 10);
      // 1. Nuevo workout
      const w = await createWorkout.mutateAsync({
        name: t.name,
        occurred_on: today,
      });

      // 2. Tomar el set count y el set típico (median weight, median reps)
      const sourceSets = setsByWorkout.get(t.workoutId) ?? [];
      // Por ejercicio, replicar la cantidad y el último peso/reps como
      // hint para arrancar.
      const sourceByEx = new Map<string, typeof sourceSets>();
      for (const s of sourceSets) {
        const arr = sourceByEx.get(s.exercise_id);
        if (arr) arr.push(s);
        else sourceByEx.set(s.exercise_id, [s]);
      }

      let setIndex = 0;
      for (const [exId, exSets] of sourceByEx.entries()) {
        // último set como referencia (más reciente del workout)
        const ref = exSets[exSets.length - 1];
        for (let i = 0; i < exSets.length; i++) {
          await createSet.mutateAsync({
            workout_id: w.id,
            exercise_id: exId,
            set_index: setIndex++,
            // hint del peso anterior (user lo edita o sobre-escribe)
            weight_kg: ref.weight_kg,
            reps: ref.reps,
          });
        }
      }

      toast.success(`Sesión "${t.name}" aplicada`, {
        description: `${sourceSets.length} sets prellenados con tus pesos anteriores.`,
      });
      router.push(`/habitos/fitness`);
    } catch (err) {
      toast.error("No se pudo replicar", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Repeat size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Repite una sesión
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="font-body text-sm text-muted mb-4 leading-relaxed">
        Tus últimas plantillas — un click crea workout nuevo con los
        mismos ejercicios y tus pesos anteriores como referencia.
      </p>
      <ul className="space-y-2">
        {templates.map((t) => (
          <li key={t.workoutId}>
            <button
              type="button"
              onClick={() => applyTemplate(t)}
              disabled={applying !== null}
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg border bg-bg p-3 text-left transition-colors",
                applying === t.workoutId
                  ? "border-accent bg-accent/5"
                  : "border-line hover:border-line-strong"
              )}
            >
              <div className="h-9 w-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                {applying === t.workoutId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Repeat size={14} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-ink truncate">
                  {t.name}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted inline-flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={10} /> {formatDate(t.occurredOn)}
                  </span>
                  <span>·</span>
                  <span>{t.totalSets} sets</span>
                  <span>·</span>
                  <span>
                    {t.exerciseIds
                      .slice(0, 3)
                      .map((id) => exById.get(id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                    {t.exerciseIds.length > 3 &&
                      ` +${t.exerciseIds.length - 3}`}
                  </span>
                </p>
              </div>
              <ChevronRight size={14} className="text-muted shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}
