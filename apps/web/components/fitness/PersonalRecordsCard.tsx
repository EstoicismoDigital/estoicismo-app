"use client";
import { useMemo } from "react";
import { Trophy } from "lucide-react";
import type { FitnessExercise, FitnessWorkoutSet } from "@estoicismo/supabase";
import { estimate1RM } from "../../lib/fitness/levels";

/**
 * Personal Records — el mejor 1RM estimado por ejercicio principal,
 * con la fecha en que se logró.
 *
 * Sólo muestra los main lifts (squat, bench, deadlift, OHP, pull-ups)
 * porque son los que tienen sentido cronometrar como PR. Otros lifts
 * son accesorios — el progreso no se mide ahí.
 */
export function PersonalRecordsCard(props: {
  exercises: FitnessExercise[];
  sets: FitnessWorkoutSet[];
}) {
  const records = useMemo(() => {
    const result: {
      exercise: FitnessExercise;
      best1RM: number;
      bestReps: number;
      bestSet: FitnessWorkoutSet | null;
      date: string | null;
    }[] = [];

    for (const ex of props.exercises) {
      if (!ex.is_main_lift) continue;
      let best1RM = 0;
      let bestReps = 0;
      let bestSet: FitnessWorkoutSet | null = null;

      for (const s of props.sets) {
        if (s.exercise_id !== ex.id) continue;
        if (ex.measurement === "weight_reps") {
          if (s.weight_kg && s.reps) {
            const rm = estimate1RM(s.weight_kg, s.reps);
            if (Number.isFinite(rm) && rm > best1RM) {
              best1RM = rm;
              bestSet = s;
            }
          }
        } else if (ex.measurement === "reps_only") {
          if (s.reps && s.reps > bestReps) {
            bestReps = s.reps;
            bestSet = s;
          }
        }
      }

      if (best1RM > 0 || bestReps > 0) {
        result.push({
          exercise: ex,
          best1RM: Math.round(best1RM * 10) / 10,
          bestReps,
          bestSet,
          date: bestSet?.created_at?.slice(0, 10) ?? null,
        });
      }
    }

    return result;
  }, [props.exercises, props.sets]);

  if (records.length === 0) return null;

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy size={14} className="text-accent" />
        <h2 className="font-display italic text-lg text-ink">Récords personales</h2>
      </div>
      <ul className="space-y-2">
        {records.map((r) => (
          <li
            key={r.exercise.id}
            className="flex items-baseline justify-between gap-2 text-sm"
          >
            <span className="text-ink truncate flex-1">{r.exercise.name}</span>
            <span className="font-display italic text-ink shrink-0">
              {r.exercise.measurement === "weight_reps"
                ? `${r.best1RM} kg`
                : `${r.bestReps} reps`}
            </span>
            {r.date && (
              <span className="text-[10px] font-mono text-muted shrink-0">
                {new Date(r.date + "T00:00:00").toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
