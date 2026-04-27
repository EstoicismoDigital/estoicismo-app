"use client";
import { useMemo, useState } from "react";
import { Dumbbell, Plus, Loader2, Check } from "lucide-react";
import { clsx } from "clsx";
import type { FitnessExercise, FitnessWorkoutSet } from "@estoicismo/supabase";
import {
  useCreateWorkout,
  useCreateWorkoutSet,
  useWorkouts,
  useAllUserSets,
} from "../../hooks/useFitness";
import { estimate1RM } from "../../lib/fitness/levels";
import { PRCelebration } from "./PRCelebration";

/**
 * QuickLogCard — registrar UNA serie de UN ejercicio en 3 toques.
 *
 * Resuelve la confusión "¿dónde anoto el peso?" sin requerir
 * crear un workout completo. Tras el primer log:
 *  - si NO hay workout de hoy → crea uno y mete la serie ahí
 *  - si SÍ hay workout de hoy → agrega la serie a ese mismo workout
 *
 * Vive arriba en el dashboard de Fitness, antes que la lista de
 * sesiones. Default ejercicio = squat (o el primer favorito si
 * el user lo configuró en onboarding).
 */
export function QuickLogCard(props: {
  exercises: FitnessExercise[];
  preferredExerciseSlugs: string[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: todaysWorkouts = [] } = useWorkouts({ from: today, to: today });
  const createWorkoutM = useCreateWorkout();
  const createSetM = useCreateWorkoutSet();

  // Ejercicios disponibles (defaults + custom). Filtrar a los que
  // son weight_reps o reps_only — los duration no van aquí.
  const usableExercises = useMemo(
    () => props.exercises.filter((e) => e.measurement !== "duration"),
    [props.exercises]
  );

  // Default selection: primer favorito > squat > primero de la lista.
  const defaultSlug = useMemo(() => {
    for (const slug of props.preferredExerciseSlugs) {
      if (usableExercises.find((e) => e.slug === slug)) return slug;
    }
    if (usableExercises.find((e) => e.slug === "squat")) return "squat";
    return usableExercises[0]?.slug ?? "";
  }, [props.preferredExerciseSlugs, usableExercises]);

  const [exerciseSlug, setExerciseSlug] = useState<string>(defaultSlug);
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [justSaved, setJustSaved] = useState(false);
  const [prData, setPrData] = useState<{
    exerciseName: string;
    newRecord: number;
    unit: "kg" | "reps";
    previousRecord?: number;
  } | null>(null);

  // Sets pasados del usuario para detectar PR.
  const { data: allUserSets = [] } = useAllUserSets({ limit: 500 });

  // Si cambia el slug por defecto (ej. después de cargar exercises),
  // sincronizar.
  if (!exerciseSlug && defaultSlug) {
    setExerciseSlug(defaultSlug);
  }

  const exercise = usableExercises.find((e) => e.slug === exerciseSlug);
  const isRepsOnly = exercise?.measurement === "reps_only";

  async function handleLog() {
    if (!exercise) return;
    const w = weight !== "" ? Number(weight) : null;
    const r = reps !== "" ? Number(reps) : null;
    if (isRepsOnly && (!r || r <= 0)) return;
    if (!isRepsOnly && (!w || !r || w < 0 || r <= 0)) return;

    try {
      // 1. Detectar PR ANTES de crear el set (con sets pasados).
      const previousBest = computePreviousBest(allUserSets, exercise.id, exercise.measurement);
      const newValue = exercise.measurement === "reps_only"
        ? (r ?? 0)
        : (w && r ? estimate1RM(w, r) : 0);
      const isNewPR = newValue > previousBest && newValue > 0;

      // 2. Buscar workout de hoy o crear uno.
      let workoutId = todaysWorkouts[0]?.id;
      if (!workoutId) {
        const created = await createWorkoutM.mutateAsync({
          name: "Sesión de hoy",
          occurred_on: today,
        });
        workoutId = created.id;
      }

      // 3. Crear el set.
      await createSetM.mutateAsync({
        workout_id: workoutId,
        exercise_id: exercise.id,
        set_index: 1,
        weight_kg: isRepsOnly ? null : w,
        reps: r,
        duration_seconds: null,
        rpe: null,
        notes: null,
      });

      // 4. Feedback visual.
      setWeight("");
      setReps("");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);

      // 5. PR celebration si aplica.
      if (isNewPR) {
        setPrData({
          exerciseName: exercise.name,
          newRecord: Math.round(newValue * 10) / 10,
          unit: exercise.measurement === "reps_only" ? "reps" : "kg",
          previousRecord: previousBest > 0 ? Math.round(previousBest * 10) / 10 : undefined,
        });
      }

    } catch {
      /* hooks toastean */
    }
  }

  if (!exercise) return null;
  const saving = createWorkoutM.isPending || createSetM.isPending;

  return (
    <section className="rounded-card border-2 border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Registro rápido
          </p>
        </div>
        <p className="text-[10px] text-muted">
          {todaysWorkouts.length > 0 ? "Sesión de hoy activa" : "Crea sesión hoy"}
        </p>
      </div>

      <div>
        <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">
          Ejercicio
        </label>
        <select
          value={exerciseSlug}
          onChange={(e) => setExerciseSlug(e.target.value)}
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
        >
          {usableExercises.map((ex) => (
            <option key={ex.id} value={ex.slug}>
              {ex.is_main_lift ? "★ " : ""}
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      <div className={clsx("grid gap-2", isRepsOnly ? "grid-cols-1" : "grid-cols-2")}>
        {!isRepsOnly && (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="80"
              className="w-full bg-bg border-2 border-line focus:border-accent rounded-lg px-3 py-3 text-2xl font-display italic text-ink focus:outline-none transition-colors text-center"
            />
          </div>
        )}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
            Reps
          </label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="10"
            className="w-full bg-bg border-2 border-line focus:border-accent rounded-lg px-3 py-3 text-2xl font-display italic text-ink focus:outline-none transition-colors text-center"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleLog}
        disabled={saving || !reps || (!isRepsOnly && !weight)}
        className={clsx(
          "w-full py-3 rounded-lg font-mono text-[11px] uppercase tracking-widest transition-all",
          "bg-accent text-bg hover:opacity-90 disabled:opacity-40",
          "inline-flex items-center justify-center gap-1.5"
        )}
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : justSaved ? (
          <>
            <Check size={14} /> Registrado
          </>
        ) : (
          <>
            <Plus size={14} /> Registrar serie
          </>
        )}
      </button>

      <p className="text-[10px] text-center text-muted italic">
        Cada serie cuenta. Para una sesión completa, abre &quot;Nueva sesión&quot; abajo.
      </p>

      <PRCelebration
        open={prData !== null}
        exerciseName={prData?.exerciseName ?? ""}
        newRecord={prData?.newRecord ?? 0}
        unit={prData?.unit ?? "kg"}
        previousRecord={prData?.previousRecord}
        onClose={() => setPrData(null)}
      />
    </section>
  );
}

/**
 * Calcula el mejor 1RM (o mejores reps para reps_only) dentro de un
 * conjunto de sets, filtrando por exercise_id. Sirve para detectar
 * PRs ANTES de insertar un nuevo set.
 */
function computePreviousBest(
  sets: FitnessWorkoutSet[],
  exerciseId: string,
  measurement: "weight_reps" | "reps_only" | "duration"
): number {
  let best = 0;
  for (const s of sets) {
    if (s.exercise_id !== exerciseId) continue;
    if (measurement === "weight_reps") {
      if (s.weight_kg && s.reps) {
        const rm = estimate1RM(s.weight_kg, s.reps);
        if (Number.isFinite(rm) && rm > best) best = rm;
      }
    } else if (measurement === "reps_only") {
      if (s.reps && s.reps > best) best = s.reps;
    }
  }
  return best;
}
