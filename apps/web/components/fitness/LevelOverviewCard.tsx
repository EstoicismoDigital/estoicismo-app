"use client";
import { useMemo } from "react";
import type { FitnessExercise, FitnessWorkoutSet } from "@estoicismo/supabase";
import {
  bestPerExerciseFromSets,
  computeExerciseLevel,
  computeGlobalLevel,
  tipForLevel,
  getLevelByKey,
  type Level,
} from "../../lib/fitness/levels";

/**
 * Tarjeta global del nivel del usuario + barra de progreso al
 * siguiente nivel + tip contextual según goal.
 */
export function LevelOverviewCard(props: {
  exercises: FitnessExercise[];
  sets: FitnessWorkoutSet[];
  bodyweightKg: number | null;
  goal: "fuerza" | "hipertrofia" | "resistencia" | "salud";
}) {
  const { exercises, sets, bodyweightKg, goal } = props;

  const data = useMemo(() => {
    const bestMap = bestPerExerciseFromSets(sets);
    const perExercise: { exerciseSlug: string; level: Level }[] = [];
    for (const ex of exercises) {
      if (!ex.is_main_lift) continue;
      const best = bestMap.get(ex.id) ?? { best1RM: 0, bestReps: 0 };
      const computed = computeExerciseLevel({
        exerciseSlug: ex.slug,
        measurement: ex.measurement,
        best1RM: best.best1RM,
        bestReps: best.bestReps,
        bodyweightKg,
      });
      if (computed) {
        perExercise.push({ exerciseSlug: ex.slug, level: computed.level });
      }
    }
    const global = computeGlobalLevel(perExercise);
    return { perExercise, global };
  }, [exercises, sets, bodyweightKg]);

  const level = data.global ?? getLevelByKey("mortal");
  const tip = tipForLevel(level, goal);

  return (
    <section
      className="rounded-card p-5 sm:p-6 border"
      style={{
        background: `linear-gradient(135deg, ${level.color}1A 0%, transparent 100%)`,
        borderColor: `${level.color}40`,
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
        Nivel global
      </p>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-4xl">{level.emoji}</span>
        <h2
          className="font-display italic text-3xl sm:text-4xl"
          style={{ color: level.color }}
        >
          {level.name}
        </h2>
        {data.perExercise.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            ({data.perExercise.length} {data.perExercise.length === 1 ? "lift" : "lifts"})
          </span>
        )}
      </div>
      <p className="text-sm text-muted mt-2 italic">{level.lore}</p>
      <p className="text-sm text-ink/90 mt-4 leading-relaxed">{tip}</p>
      {!bodyweightKg && (
        <p className="mt-3 text-xs text-muted bg-bg/40 rounded-md px-2 py-1.5 inline-block">
          Configura tu peso corporal en ajustes para activar el cálculo de niveles.
        </p>
      )}
    </section>
  );
}
