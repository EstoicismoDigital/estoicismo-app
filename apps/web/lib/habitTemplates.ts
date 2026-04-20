import type { CreateHabitInput } from "@estoicismo/supabase";

export type HabitTemplate = CreateHabitInput & {
  id: string;
  tagline: string;
};

/**
 * Curated stoic-themed habit templates shown in the empty state.
 * Each template is a complete CreateHabitInput + an id and tagline
 * for UI display.
 */
export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: "meditar",
    name: "Meditar 10 min",
    tagline: "Empieza el día con claridad",
    icon: "🧘",
    color: "#4F8EF7",
    frequency: "daily",
    reminder_time: "08:00:00",
  },
  {
    id: "leer-filosofia",
    name: "Leer filosofía",
    tagline: "15 minutos de lectura diaria",
    icon: "📚",
    color: "#A56CF0",
    frequency: "daily",
    reminder_time: null,
  },
  {
    id: "diario-estoico",
    name: "Diario estoico",
    tagline: "Reflexión nocturna",
    icon: "✍️",
    color: "#8B6F47",
    frequency: "daily",
    reminder_time: "22:00:00",
  },
  {
    id: "ejercicio",
    name: "Ejercicio",
    tagline: "Cuida el cuerpo",
    icon: "💪",
    color: "#E8714A",
    frequency: "daily",
    reminder_time: "07:00:00",
  },
  {
    id: "hidratarme",
    name: "Beber agua",
    tagline: "8 vasos al día",
    icon: "💧",
    color: "#2BBDCE",
    frequency: "daily",
    reminder_time: null,
  },
  {
    id: "memento-mori",
    name: "Memento Mori",
    tagline: "Recordar que el tiempo pasa",
    icon: "🌅",
    color: "#F0B429",
    frequency: "daily",
    reminder_time: "07:30:00",
  },
];
