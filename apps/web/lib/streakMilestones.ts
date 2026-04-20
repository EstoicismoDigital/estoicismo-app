/**
 * Streak milestones for celebratory toasts.
 *
 * Ordered ascending. The first milestone whose `days` threshold was crossed
 * between `prev` and `current` (prev < days ≤ current) is returned by
 * `findCrossedMilestone`, and at most one fires per state transition.
 */

export type StreakMilestone = {
  days: number;
  title: string;
  description: string;
};

export const STREAK_MILESTONES: readonly StreakMilestone[] = [
  {
    days: 3,
    title: "Tres días",
    description: "El inicio es siempre lo más difícil.",
  },
  {
    days: 7,
    title: "Una semana firme",
    description: "El hábito empieza a echar raíces.",
  },
  {
    days: 14,
    title: "Dos semanas",
    description: "La repetición forja el carácter.",
  },
  {
    days: 30,
    title: "Un mes completo",
    description: "Ya no es un intento — es quien eres.",
  },
  {
    days: 60,
    title: "Sesenta días",
    description: "La constancia es un superpoder silencioso.",
  },
  {
    days: 100,
    title: "Cien días",
    description: "Eres, ante todo, lo que haces repetidamente.",
  },
  {
    days: 365,
    title: "Un año entero",
    description: "Has atravesado las cuatro estaciones sin rendirte.",
  },
] as const;

/**
 * Returns the milestone that was just crossed when streak moved from `prev`
 * to `current`. Only counts forward crossings (prev < threshold ≤ current).
 * Returns null if the transition didn't cross any milestone, or if the streak
 * went down / stayed the same.
 *
 * If multiple thresholds are crossed in one transition (extremely rare —
 * implies a backfill), the smallest one is returned so we always celebrate
 * the earliest-reached milestone first.
 */
export function findCrossedMilestone(
  prev: number,
  current: number
): StreakMilestone | null {
  if (current <= prev) return null;
  for (const m of STREAK_MILESTONES) {
    if (prev < m.days && current >= m.days) return m;
  }
  return null;
}
