"use client";
import { useMemo } from "react";
import type { FitnessExercise, FitnessWorkoutSet } from "@estoicismo/supabase";
import {
  bestPerExerciseFromSets,
  computeExerciseLevel,
} from "../../lib/fitness/levels";

/**
 * Grid de los 5 lifts principales con su nivel actual y barra de
 * progreso hacia el siguiente.
 */
export function LiftLevelsGrid(props: {
  exercises: FitnessExercise[];
  sets: FitnessWorkoutSet[];
  bodyweightKg: number | null;
}) {
  const { exercises, sets, bodyweightKg } = props;

  const items = useMemo(() => {
    const bestMap = bestPerExerciseFromSets(sets);
    return exercises
      .filter((ex) => ex.is_main_lift)
      .map((ex) => {
        const best = bestMap.get(ex.id) ?? { best1RM: 0, bestReps: 0 };
        const computed = computeExerciseLevel({
          exerciseSlug: ex.slug,
          measurement: ex.measurement,
          best1RM: best.best1RM,
          bestReps: best.bestReps,
          bodyweightKg,
        });
        const value =
          ex.measurement === "weight_reps" ? best.best1RM : best.bestReps;
        return { ex, computed, value };
      });
  }, [exercises, sets, bodyweightKg]);

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display italic text-xl text-ink">Lifts principales</h2>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
          1RM estimado · ratio bw
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ ex, computed, value }) => {
          if (!computed) {
            return (
              <div
                key={ex.id}
                className="rounded-card border border-line bg-bg-alt/40 p-4"
              >
                <p className="text-sm font-semibold text-ink">{ex.name}</p>
                <p className="text-xs text-muted mt-1">
                  Configura peso corporal para ver tu nivel.
                </p>
              </div>
            );
          }
          const { level, ratio, nextLevelTarget, nextLevelLabel } = computed;
          const targetLeft = nextLevelTarget !== null ? Math.max(0, nextLevelTarget - value) : 0;

          // Barra de progreso (0..100). Si target null = al máximo.
          let pct = 100;
          if (nextLevelTarget !== null && nextLevelTarget > 0 && value > 0) {
            // pct relativo al gap entre el threshold del nivel actual y el siguiente
            // Proxy: (value / nextTarget) clamped 0..100
            pct = Math.max(0, Math.min(100, (value / nextLevelTarget) * 100));
          } else if (value === 0) {
            pct = 0;
          }

          return (
            <div
              key={ex.id}
              className="rounded-card border p-4 space-y-2"
              style={{
                borderColor: `${level.color}40`,
                background: `linear-gradient(180deg, ${level.color}0A, transparent 60%)`,
              }}
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-ink">{ex.name}</p>
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: level.color }}
                >
                  {level.emoji} {level.name}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-display italic text-ink">
                  {value > 0 ? Math.round(value * 10) / 10 : "—"}
                </span>
                <span className="text-xs text-muted">
                  {ex.measurement === "weight_reps" ? "kg" : "reps"}
                </span>
                {ex.measurement === "weight_reps" && bodyweightKg ? (
                  <span className="text-xs text-muted ml-auto">
                    {ratio ? `${ratio.toFixed(2)}× bw` : ""}
                  </span>
                ) : null}
              </div>
              <div className="h-1.5 bg-line/40 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: level.color,
                  }}
                />
              </div>
              {nextLevelLabel && nextLevelTarget !== null && (
                <p className="text-[11px] text-muted">
                  Faltan{" "}
                  <span className="text-ink font-semibold">
                    {Math.round(targetLeft * 10) / 10}{" "}
                    {ex.measurement === "weight_reps" ? "kg" : "reps"}
                  </span>{" "}
                  para {nextLevelLabel}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
