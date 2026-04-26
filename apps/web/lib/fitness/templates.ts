/**
 * Workout templates — splits sugeridos según frecuencia + goal.
 *
 * Recomendaciones basadas en literatura mainstream de fuerza:
 *   - 1-2 días → full body cada vez (cobertura completa)
 *   - 3 días → full body 3x o PPL (push/pull/legs) suave
 *   - 4 días → upper/lower (UL/UL)
 *   - 5-6 días → PPL clásico (PPL/PPL)
 *   - 7 días → no recomendado, sugerimos descansar al menos 1
 *
 * Cada template tiene un "blueprint" sugerido por sesión —
 * ejercicios principales + accesorios. NO los ejecuta auto, sólo
 * son punto de partida cuando el user crea una sesión.
 *
 * Por goal ajustamos rep ranges:
 *   - fuerza: 3-5 reps, 4-6 sets, descanso 3-5min, RPE 7-9
 *   - hipertrofia: 8-12 reps, 3-4 sets, descanso 1-2min, RPE 7-8
 *   - resistencia: 12-20 reps, 3 sets, descanso <1min, RPE 6-7
 *   - salud: 8-15 reps, 2-3 sets, descanso libre, RPE 5-7
 */

import type { FitnessGoal } from "@estoicismo/supabase";

export type RepRange = {
  reps: string;
  sets: string;
  rest: string;
  rpe: string;
  description: string;
};

export const REP_RANGE_BY_GOAL: Record<FitnessGoal, RepRange> = {
  fuerza: {
    reps: "3-5",
    sets: "4-6",
    rest: "3-5min",
    rpe: "7-9",
    description: "Cargas pesadas, descansos largos. Cada serie cuenta — calienta bien.",
  },
  hipertrofia: {
    reps: "8-12",
    sets: "3-4",
    rest: "1-2min",
    rpe: "7-8",
    description: "Volumen y conexión mente-músculo. La última rep debe quemar.",
  },
  resistencia: {
    reps: "12-20",
    sets: "3",
    rest: "<1min",
    rpe: "6-7",
    description: "Reps altas, descansos cortos. La acumulación es el punto.",
  },
  salud: {
    reps: "8-15",
    sets: "2-3",
    rest: "libre",
    rpe: "5-7",
    description: "Constancia sobre intensidad. Llegar es el objetivo, no romperse.",
  },
};

export type WorkoutDay = {
  /** Nombre del día — "Empuje", "Pierna A", etc. */
  name: string;
  /** Slugs de ejercicios sugeridos del catálogo. */
  exercises: string[];
  /** Frase explicativa corta. */
  focus: string;
};

export type WorkoutSplit = {
  id: string;
  name: string;
  description: string;
  /** Cuántos días a la semana exige. */
  daysPerWeek: number;
  days: WorkoutDay[];
};

export const WORKOUT_SPLITS: WorkoutSplit[] = [
  {
    id: "fb-2",
    name: "Full Body × 2",
    description: "El minimum efectivo. Tocas todo cada sesión.",
    daysPerWeek: 2,
    days: [
      {
        name: "Día A",
        exercises: ["squat", "bench-press", "barbell-row", "overhead-press", "plank"],
        focus: "Cuerpo completo, énfasis en empuje horizontal.",
      },
      {
        name: "Día B",
        exercises: ["deadlift", "incline-bench", "pull-ups", "front-squat", "plank"],
        focus: "Cuerpo completo, énfasis en cadena posterior.",
      },
    ],
  },
  {
    id: "fb-3",
    name: "Full Body × 3",
    description: "El estándar de novato. Lunes-miércoles-viernes funciona perfecto.",
    daysPerWeek: 3,
    days: [
      {
        name: "Día A",
        exercises: ["squat", "bench-press", "barbell-row", "plank"],
        focus: "Pierna pesada + empuje + tracción.",
      },
      {
        name: "Día B",
        exercises: ["deadlift", "overhead-press", "pull-ups", "plank"],
        focus: "Cadena posterior + hombro + tracción vertical.",
      },
      {
        name: "Día C",
        exercises: ["front-squat", "incline-bench", "barbell-row", "dips", "plank"],
        focus: "Pierna + pecho inclinado + accesorios.",
      },
    ],
  },
  {
    id: "ul-4",
    name: "Upper / Lower",
    description: "Empieza a notar diferencias entre tren superior y pierna.",
    daysPerWeek: 4,
    days: [
      {
        name: "Upper A",
        exercises: ["bench-press", "barbell-row", "overhead-press", "pull-ups"],
        focus: "Empuje horizontal + tracción horizontal + vertical.",
      },
      {
        name: "Lower A",
        exercises: ["squat", "romanian-dl", "leg-press", "calf-raise"],
        focus: "Cuádriceps + isquios + gemelos.",
      },
      {
        name: "Upper B",
        exercises: ["incline-bench", "barbell-row", "lateral-raise", "curl", "tricep-ext"],
        focus: "Variación + accesorios.",
      },
      {
        name: "Lower B",
        exercises: ["deadlift", "front-squat", "leg-press", "calf-raise"],
        focus: "Cadena posterior + cuádriceps + gemelos.",
      },
    ],
  },
  {
    id: "ppl-6",
    name: "Push / Pull / Legs",
    description: "Para cuando ya recuperas bien. Repite el ciclo 2 veces a la semana.",
    daysPerWeek: 6,
    days: [
      {
        name: "Push A",
        exercises: ["bench-press", "overhead-press", "incline-bench", "lateral-raise", "tricep-ext"],
        focus: "Pecho + hombro + tríceps.",
      },
      {
        name: "Pull A",
        exercises: ["deadlift", "pull-ups", "barbell-row", "curl"],
        focus: "Espalda + bíceps.",
      },
      {
        name: "Legs A",
        exercises: ["squat", "romanian-dl", "leg-press", "calf-raise"],
        focus: "Cuádriceps dominante.",
      },
      {
        name: "Push B",
        exercises: ["incline-bench", "overhead-press", "dips", "lateral-raise", "tricep-ext"],
        focus: "Pecho inclinado + hombro.",
      },
      {
        name: "Pull B",
        exercises: ["pull-ups", "barbell-row", "romanian-dl", "curl"],
        focus: "Tracción vertical + horizontal.",
      },
      {
        name: "Legs B",
        exercises: ["front-squat", "romanian-dl", "leg-press", "calf-raise"],
        focus: "Cadena posterior dominante.",
      },
    ],
  },
];

/**
 * Devuelve el split más apropiado para los días que el user puede entrenar.
 * Si el user pone 5 días, le sugerimos UL+1 o le ofrecemos PPL flexible.
 */
export function suggestSplit(weeklyDays: number | null): WorkoutSplit | null {
  if (!weeklyDays || weeklyDays < 1) return null;
  if (weeklyDays === 1) return WORKOUT_SPLITS[0]; // sólo Día A del FB×2
  if (weeklyDays === 2) return WORKOUT_SPLITS[0]; // FB×2
  if (weeklyDays === 3) return WORKOUT_SPLITS[1]; // FB×3
  if (weeklyDays === 4) return WORKOUT_SPLITS[2]; // UL
  if (weeklyDays === 5) return WORKOUT_SPLITS[2]; // UL + un día extra libre
  return WORKOUT_SPLITS[3]; // PPL para 6+
}

/**
 * Tip contextual sobre cuándo descansar según frecuencia.
 */
export function recoveryTip(weeklyDays: number | null): string {
  if (!weeklyDays) return "Define cuántos días puedes entrenar para sugerirte un split.";
  if (weeklyDays === 7) {
    return "Entrenar 7 días/semana sin descansar limita las ganancias. Considera al menos 1 día de descanso o trabajo aeróbico ligero.";
  }
  if (weeklyDays >= 5) {
    return "Frecuencia alta. Cuida el sueño y la nutrición — sin recuperación, no hay progreso.";
  }
  if (weeklyDays >= 3) {
    return "Frecuencia ideal para mayoría. Constancia > intensidad cuando recién empiezas.";
  }
  if (weeklyDays >= 1) {
    return "Cualquier movimiento es mejor que nada. Apunta a sumar un día más en 4 semanas.";
  }
  return "";
}
