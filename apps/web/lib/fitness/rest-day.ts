import type { FitnessWorkout } from "@estoicismo/supabase";

/**
 * Rest Day Detection.
 *
 * Si el user lleva 4+ días consecutivos entrenando sin descanso,
 * sugerir "hoy descansa".
 *
 * También detecta:
 *   - Días desde último workout (para sugerir "vuelve" si lleva mucho)
 *   - Group fatigue: si entrenó el mismo grupo muscular 2 días
 *     consecutivos (no implementado v1 — schema no guarda muscle_group
 *     por workout, solo por exercise individual)
 */

export type RestRecommendation = {
  kind: "rest" | "comeback" | "go" | "moderate";
  message: string;
  /** Días consecutivos entrenando (sin gap >= 1 día). */
  consecutiveDays: number;
  /** Días desde el último workout (0 = hoy entrenó, 1 = ayer). */
  daysSinceLast: number | null;
};

export function computeRestRecommendation(
  workouts: FitnessWorkout[],
  ref: Date = new Date()
): RestRecommendation {
  if (workouts.length === 0) {
    return {
      kind: "go",
      message: "Aún no has registrado workouts. El primero es el difícil.",
      consecutiveDays: 0,
      daysSinceLast: null,
    };
  }

  // Sort desc by occurred_on
  const sorted = [...workouts].sort((a, b) =>
    b.occurred_on.localeCompare(a.occurred_on)
  );

  const todayIso = ref.toISOString().slice(0, 10);
  const last = sorted[0];
  const daysSinceLast = daysBetween(last.occurred_on, todayIso);

  // Contar días consecutivos hacia atrás desde el último (incluido)
  let consecutive = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].occurred_on;
    const curr = sorted[i].occurred_on;
    const gap = daysBetween(curr, prev);
    if (gap === 1) consecutive += 1;
    else break;
  }

  // Si el último workout fue hoy, daysSinceLast = 0
  // Si lleva 4+ consecutivos hasta hoy → rest
  if (daysSinceLast === 0 && consecutive >= 4) {
    return {
      kind: "rest",
      message: `Llevas ${consecutive} días seguidos entrenando. Hoy descansa — el músculo crece en reposo, no en el gym.`,
      consecutiveDays: consecutive,
      daysSinceLast: 0,
    };
  }

  if (daysSinceLast === 0 && consecutive >= 3) {
    return {
      kind: "moderate",
      message: `${consecutive} días seguidos. Si vas a entrenar mañana, mantén intensidad moderada.`,
      consecutiveDays: consecutive,
      daysSinceLast: 0,
    };
  }

  if (daysSinceLast !== null && daysSinceLast >= 7) {
    return {
      kind: "comeback",
      message: `Llevas ${daysSinceLast} días sin entrenar. Vuelve suave — el primer día de regreso no es para PRs.`,
      consecutiveDays: 0,
      daysSinceLast,
    };
  }

  if (daysSinceLast !== null && daysSinceLast >= 2) {
    return {
      kind: "go",
      message: `${daysSinceLast} días desde tu último workout. Buen momento para entrar.`,
      consecutiveDays: 0,
      daysSinceLast,
    };
  }

  return {
    kind: "go",
    message: "Buen ritmo. Si te sientes fresco, sigue. Si arrastras fatiga, baja el peso un 10%.",
    consecutiveDays: consecutive,
    daysSinceLast,
  };
}

function daysBetween(earlier: string, later: string): number {
  const a = new Date(earlier + "T00:00:00").getTime();
  const b = new Date(later + "T00:00:00").getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
