import type { JournalArea } from "@estoicismo/supabase";

/**
 * Áreas del diario con su metadata visual y label.
 *
 * Mantengo aquí — no en DB — porque la UI quiere colores específicos
 * y el orden importa. Si añades una nueva área, recuerda actualizar
 * el CHECK constraint en SQL también.
 */
export type JournalAreaMeta = {
  key: JournalArea;
  label: string;
  color: string;
  emoji: string;
  description: string;
};

export const JOURNAL_AREAS: JournalAreaMeta[] = [
  {
    key: "free",
    label: "Diario libre",
    color: "#6B7280",
    emoji: "📓",
    description: "Lo que cargas hoy, sin etiqueta.",
  },
  {
    key: "habits",
    label: "Hábitos",
    color: "#CA8A04",
    emoji: "🔥",
    description: "Sobre tu disciplina y consistencia.",
  },
  {
    key: "fitness",
    label: "Fitness",
    color: "#2563EB",
    emoji: "💪",
    description: "Cuerpo, fuerza, recuperación.",
  },
  {
    key: "lectura",
    label: "Lectura",
    color: "#7C3AED",
    emoji: "📖",
    description: "Lo que el libro está despertando.",
  },
  {
    key: "finanzas",
    label: "Finanzas",
    color: "#22774E",
    emoji: "💰",
    description: "Decisiones, miedos, hitos con dinero.",
  },
  {
    key: "mentalidad",
    label: "Mentalidad",
    color: "#9333EA",
    emoji: "🧠",
    description: "MPD, meditación, conciencia.",
  },
  {
    key: "emprendimiento",
    label: "Negocio",
    color: "#EA580C",
    emoji: "💼",
    description: "Aprendizajes, tropiezos, victorias.",
  },
  {
    key: "pegasso",
    label: "Pegasso",
    color: "#0EA5E9",
    emoji: "✨",
    description: "Frases o insights que te dejó la conversación.",
  },
];

export function getAreaMeta(area: JournalArea): JournalAreaMeta {
  return JOURNAL_AREAS.find((a) => a.key === area) ?? JOURNAL_AREAS[0];
}
