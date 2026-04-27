import type {
  FitnessExercise,
  FitnessWorkout,
  FitnessWorkoutSet,
} from "@estoicismo/supabase";
import { estimate1RM } from "./levels";

/**
 * Progressive Overload Suggestions.
 *
 * Para cada ejercicio activo del user, analiza las últimas 2-3
 * sesiones y sugiere si subir peso, mantener, o restar.
 *
 * Heurística simple:
 *   - Si en la última sesión el user completó TODOS los reps
 *     objetivo en TODOS los sets → subir 2.5kg (small jump).
 *   - Si en las últimas 2 sesiones consecutivas completó full →
 *     subir 5kg (big jump).
 *   - Si la última sesión bajó reps significativamente → mantener.
 *   - Si dos sesiones seguidas tienen menos reps que la primera →
 *     bajar 5kg (deload).
 *
 * Este NO es un coach personalizado — es una regla simple que
 * arranca conversación. El user siempre puede ignorar.
 */

export type OverloadSuggestion = {
  exerciseId: string;
  exerciseName: string;
  /** Peso actual (último sesión registrada). */
  currentWeight: number;
  /** Peso sugerido. */
  suggestedWeight: number;
  /** "up" / "hold" / "deload" */
  action: "up" | "hold" | "deload";
  /** Motivo legible. */
  reason: string;
  /** Cantidad de sesiones analizadas. */
  sessionCount: number;
};

export function computeOverloadSuggestions(
  sets: FitnessWorkoutSet[],
  exercises: FitnessExercise[],
  workouts: FitnessWorkout[]
): OverloadSuggestion[] {
  // Solo considerar exercises con measurement = weight_reps
  const usable = exercises.filter((e) => e.measurement === "weight_reps");
  const exById = new Map(usable.map((e) => [e.id, e]));

  // Map workout_id → occurred_on
  const workoutDate = new Map<string, string>();
  for (const w of workouts) workoutDate.set(w.id, w.occurred_on);

  // Agrupar sets por exercise_id
  const byExercise = new Map<string, FitnessWorkoutSet[]>();
  for (const s of sets) {
    if (!exById.has(s.exercise_id)) continue;
    const arr = byExercise.get(s.exercise_id) ?? [];
    arr.push(s);
    byExercise.set(s.exercise_id, arr);
  }

  const suggestions: OverloadSuggestion[] = [];

  for (const [exId, exSets] of byExercise.entries()) {
    const ex = exById.get(exId);
    if (!ex) continue;

    // Agrupar por sesión (workout_id → occurred_on como key de orden)
    const bySession = new Map<string, FitnessWorkoutSet[]>();
    for (const s of exSets) {
      const sessionDate = workoutDate.get(s.workout_id);
      if (!sessionDate) continue;
      const arr = bySession.get(sessionDate) ?? [];
      arr.push(s);
      bySession.set(sessionDate, arr);
    }

    // Sesiones ordenadas por fecha desc
    const sessions = Array.from(bySession.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, ss]) => ss);

    if (sessions.length === 0) continue;

    const lastSession = sessions[0];
    const currentWeight = avgWeight(lastSession);
    if (currentWeight <= 0) continue;

    const lastReps = totalReps(lastSession);
    const lastSetCount = lastSession.length;

    // Si solo hay 1 sesión, sugerir subir 2.5kg como punto de
    // partida (suposición: si hizo todos los reps cómodo, subir)
    if (sessions.length === 1) {
      suggestions.push({
        exerciseId: exId,
        exerciseName: ex.name,
        currentWeight,
        suggestedWeight: currentWeight + 2.5,
        action: "up",
        reason: "Primera sesión — sube 2.5kg si los reps fueron cómodos.",
        sessionCount: 1,
      });
      continue;
    }

    const prev = sessions[1];
    const prevReps = totalReps(prev);
    const prevSetCount = prev.length;

    // Si la última sesión hizo igual o más reps con mismo set count → up
    const sameOrMoreReps = lastReps >= prevReps && lastSetCount >= prevSetCount;
    const significantDrop = lastReps < prevReps * 0.85;

    if (sameOrMoreReps) {
      // Si hay 3+ sesiones consecutivas todas igual o creciendo → +5kg
      if (sessions.length >= 3) {
        const prev2 = sessions[2];
        const prev2Reps = totalReps(prev2);
        if (prevReps >= prev2Reps) {
          suggestions.push({
            exerciseId: exId,
            exerciseName: ex.name,
            currentWeight,
            suggestedWeight: currentWeight + 5,
            action: "up",
            reason: "3 sesiones consistentes — salto grande de 5kg.",
            sessionCount: sessions.length,
          });
          continue;
        }
      }
      suggestions.push({
        exerciseId: exId,
        exerciseName: ex.name,
        currentWeight,
        suggestedWeight: currentWeight + 2.5,
        action: "up",
        reason: "Reps mantenidos o subiendo — sube 2.5kg.",
        sessionCount: sessions.length,
      });
    } else if (significantDrop) {
      // Si bajó >15% en 2 sesiones consecutivas → deload
      if (sessions.length >= 3) {
        const prev2 = sessions[2];
        const prev2Reps = totalReps(prev2);
        if (prevReps < prev2Reps * 0.85) {
          suggestions.push({
            exerciseId: exId,
            exerciseName: ex.name,
            currentWeight,
            suggestedWeight: Math.max(0, currentWeight - 5),
            action: "deload",
            reason:
              "Reps cayendo en 2 sesiones — deload 5kg para recuperar volumen.",
            sessionCount: sessions.length,
          });
          continue;
        }
      }
      suggestions.push({
        exerciseId: exId,
        exerciseName: ex.name,
        currentWeight,
        suggestedWeight: currentWeight,
        action: "hold",
        reason: "Reps bajaron — mantén peso, recupera volumen primero.",
        sessionCount: sessions.length,
      });
    } else {
      suggestions.push({
        exerciseId: exId,
        exerciseName: ex.name,
        currentWeight,
        suggestedWeight: currentWeight,
        action: "hold",
        reason: "Mantén — la próxima sesión define el siguiente paso.",
        sessionCount: sessions.length,
      });
    }
  }

  // Ordenar: primero los "up" (más motivadores), luego hold, luego deload
  return suggestions.sort((a, b) => {
    const order: Record<string, number> = { up: 0, hold: 1, deload: 2 };
    return order[a.action] - order[b.action];
  });
}

function avgWeight(sets: FitnessWorkoutSet[]): number {
  const valid = sets.filter((s) => (s.weight_kg ?? 0) > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((acc, s) => acc + (s.weight_kg ?? 0), 0) / valid.length;
}

function totalReps(sets: FitnessWorkoutSet[]): number {
  return sets.reduce((acc, s) => acc + (s.reps ?? 0), 0);
}

// Re-export para que las cards puedan acceder al 1RM si lo necesitan
export { estimate1RM };
