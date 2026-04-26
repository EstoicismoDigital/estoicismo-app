/**
 * Cálculos de salud — BMI, BMR, TDEE.
 *
 * Fórmulas estándar:
 *   - BMI = kg / (m^2). Categorías OMS.
 *   - BMR (Mifflin-St Jeor 1990) — el más preciso sin medir
 *     impedancia. Usa peso, altura, edad, sexo.
 *   - TDEE = BMR × factor de actividad.
 *
 * Todo es ESTIMACIÓN. La realidad varía ±10-15%. Mostramos
 * rangos, no números absolutos, para no infundir falsa precisión.
 */

import type { FitnessSex } from "@estoicismo/supabase";

export type BMICategory =
  | "bajo_peso"
  | "saludable"
  | "sobrepeso"
  | "obesidad_1"
  | "obesidad_2"
  | "obesidad_3";

export type BMIInfo = {
  bmi: number;
  category: BMICategory;
  label: string;
  /** Peso saludable estimado para la altura (rango). */
  healthyRangeKg: { min: number; max: number };
  /** Color para visualización. */
  color: string;
};

const BMI_CATEGORIES: { max: number; key: BMICategory; label: string; color: string }[] = [
  { max: 18.5, key: "bajo_peso", label: "Bajo peso", color: "#0EA5E9" },
  { max: 25, key: "saludable", label: "Saludable", color: "#22774E" },
  { max: 30, key: "sobrepeso", label: "Sobrepeso", color: "#CA8A04" },
  { max: 35, key: "obesidad_1", label: "Obesidad I", color: "#EA580C" },
  { max: 40, key: "obesidad_2", label: "Obesidad II", color: "#DC2626" },
  { max: Infinity, key: "obesidad_3", label: "Obesidad III", color: "#7F1D1D" },
];

export function computeBMI(weightKg: number, heightCm: number): BMIInfo | null {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  const bmi = Math.round((weightKg / (m * m)) * 10) / 10;
  const cat = BMI_CATEGORIES.find((c) => bmi < c.max) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
  return {
    bmi,
    category: cat.key,
    label: cat.label,
    color: cat.color,
    healthyRangeKg: {
      min: Math.round(18.5 * m * m),
      max: Math.round(24.9 * m * m),
    },
  };
}

/**
 * BMR — Mifflin-St Jeor.
 * Hombres: 10×kg + 6.25×cm − 5×edad + 5
 * Mujeres: 10×kg + 6.25×cm − 5×edad − 161
 * "other" — promedio de los dos.
 */
export function computeBMR(args: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: FitnessSex | null;
}): number | null {
  const { weightKg, heightCm, age, sex } = args;
  if (!weightKg || !heightCm || !age) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return Math.round(base + 5);
  if (sex === "female") return Math.round(base - 161);
  // other / null — usamos promedio
  return Math.round(base - 78);
}

export type ActivityLevel =
  | "sedentario"
  | "ligero"
  | "moderado"
  | "alto"
  | "atleta";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  alto: 1.725,
  atleta: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: "Sedentario (sin ejercicio)",
  ligero: "Ligero (1-3 días/semana)",
  moderado: "Moderado (3-5 días/semana)",
  alto: "Alto (6-7 días/semana)",
  atleta: "Muy alto (atleta / físico)",
};

/**
 * Mapea weekly_target_days al activity level más cercano.
 */
export function activityFromWeeklyDays(days: number | null): ActivityLevel {
  if (!days || days <= 0) return "sedentario";
  if (days <= 2) return "ligero";
  if (days <= 4) return "moderado";
  if (days <= 6) return "alto";
  return "atleta";
}

export function computeTDEE(bmr: number | null, level: ActivityLevel): number | null {
  if (bmr === null) return null;
  return Math.round(bmr * ACTIVITY_FACTORS[level]);
}

/**
 * Calorías sugeridas según objetivo:
 *   - bajar peso: TDEE − 500 (~0.5 kg/semana)
 *   - mantener: TDEE
 *   - subir peso: TDEE + 300 (lean bulk)
 */
export function calorieTarget(
  tdee: number | null,
  goal: "bajar" | "mantener" | "subir"
): number | null {
  if (tdee === null) return null;
  if (goal === "bajar") return tdee - 500;
  if (goal === "subir") return tdee + 300;
  return tdee;
}

/**
 * Edad a partir de birth_year.
 */
export function ageFromBirthYear(birthYear: number | null): number | null {
  if (!birthYear) return null;
  const now = new Date().getFullYear();
  return now - birthYear;
}
