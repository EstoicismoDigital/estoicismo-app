import type {
  FitnessWorkout,
  MindsetMoodLog,
} from "@estoicismo/supabase";

/**
 * Correlación mood × workout — el dato más honesto que tenemos sobre
 * el bienestar real del entrenamiento.
 *
 * Comparamos el mood promedio en días que entrenaste vs días que no.
 * Si la diferencia es positiva, entrenar te suma. Si es negativa,
 * algo no cuadra (sobre-entrenas, eliges mal el momento, etc).
 */

export type MoodCorrelation = {
  /** Días con workout en el rango analizado. */
  workoutDays: number;
  /** Días sin workout en el rango analizado. */
  restDays: number;
  /** Mood promedio en días con workout (1-5) — null si sin datos. */
  workoutMoodAvg: number | null;
  /** Mood promedio en días de descanso. */
  restMoodAvg: number | null;
  /** Diferencia (workout - rest). Positivo = entrenar te sube. */
  delta: number | null;
  /** Insight legible. */
  insight: string;
};

export function computeMoodCorrelation(
  workouts: FitnessWorkout[],
  moods: MindsetMoodLog[]
): MoodCorrelation {
  // Set de fechas con workout
  const workoutDates = new Set(workouts.map((w) => w.occurred_on));

  // Mood by date
  const moodByDate = new Map<string, number>();
  for (const m of moods) {
    moodByDate.set(m.occurred_on, m.mood);
  }

  // Días con mood registrado, separados en con/sin workout
  let workoutDays = 0;
  let restDays = 0;
  let workoutMoodSum = 0;
  let restMoodSum = 0;

  for (const [date, mood] of moodByDate.entries()) {
    if (workoutDates.has(date)) {
      workoutDays += 1;
      workoutMoodSum += mood;
    } else {
      restDays += 1;
      restMoodSum += mood;
    }
  }

  const workoutMoodAvg =
    workoutDays > 0 ? +(workoutMoodSum / workoutDays).toFixed(2) : null;
  const restMoodAvg =
    restDays > 0 ? +(restMoodSum / restDays).toFixed(2) : null;
  const delta =
    workoutMoodAvg !== null && restMoodAvg !== null
      ? +(workoutMoodAvg - restMoodAvg).toFixed(2)
      : null;

  return {
    workoutDays,
    restDays,
    workoutMoodAvg,
    restMoodAvg,
    delta,
    insight: buildInsight({ workoutDays, restDays, workoutMoodAvg, restMoodAvg, delta }),
  };
}

function buildInsight(c: {
  workoutDays: number;
  restDays: number;
  workoutMoodAvg: number | null;
  restMoodAvg: number | null;
  delta: number | null;
}): string {
  if (c.workoutDays < 3 || c.restDays < 3) {
    return "Necesitamos al menos 3 días de cada tipo (con/sin entrenar) y mood registrado para calcular esto bien.";
  }
  if (c.delta === null) return "—";
  if (c.delta > 0.5) {
    return `Tu mood sube ${c.delta} puntos en días que entrenas. El cuerpo te lo paga.`;
  }
  if (c.delta > 0.1) {
    return `Tu mood sube ${c.delta} puntos en días de entrenar. Sutil pero consistente.`;
  }
  if (c.delta > -0.1) {
    return `Mood casi igual entrenes o no. El beneficio quizá se acumula a más largo plazo.`;
  }
  if (c.delta > -0.5) {
    return `Tu mood baja ${Math.abs(c.delta)} puntos en días que entrenas. Revisa intensidad o momento.`;
  }
  return `Tu mood baja ${Math.abs(c.delta)} en días que entrenas. Algo no cuadra — quizá sobreentrenamiento.`;
}
