/**
 * Ritual del día · status de cada sección + cómputo de racha.
 *
 * Una sección está "hecha" hoy según data ya existente — sin tabla
 * dedicada. La racha del ritual = días consecutivos con >= 4
 * secciones completadas.
 *
 * Las 9 secciones son:
 *   1. inspire — afirmación leída (mindset_mpd_logs.read_affirmation)
 *   2. mood — registró mood hoy
 *   3. gratitude — al menos 1 entrada de gratitud hoy
 *   4. habits — al menos 1 hábito completado hoy
 *   5. money — al menos 1 transacción registrada hoy
 *   6. business — al menos 1 venta o tarea cerrada hoy
 *   7. body — al menos 1 workout / set hoy
 *   8. reading — al menos 1 sesión de lectura hoy
 *   9. reflect — al menos 1 entrada de diario hoy
 *
 * Estas son flexibles: si el user no tiene fitness setup, esa sección
 * no cuenta como pendiente. La UX de /hoy refleja eso.
 */

export type RitualSectionId =
  | "inspire"
  | "mood"
  | "gratitude"
  | "habits"
  | "money"
  | "business"
  | "body"
  | "reading"
  | "reflect";

export type RitualSection = {
  id: RitualSectionId;
  /** ¿Está disponible para este user? Ej. body solo si tiene fitness profile. */
  available: boolean;
  /** ¿Ya completada hoy? */
  done: boolean;
};

export type RitualStatus = {
  sections: RitualSection[];
  completedCount: number;
  availableCount: number;
  /** ratio completed / available, 0..1 */
  ratio: number;
  /** ¿alcanza umbral mínimo de "ritual del día"? (>= 4 de las disponibles) */
  ritualMet: boolean;
};

const MIN_FOR_DAY_COUNTED = 4;

/**
 * Calcula el estado del ritual hoy a partir de los inputs ya cacheados
 * por React Query. Pasa los flags que ya tienes para evitar re-fetch.
 */
export function computeRitualStatus(input: {
  affirmationRead: boolean;
  hasMpd: boolean;
  moodLoggedToday: boolean;
  gratitudeCountToday: number;
  habitLogsToday: number;
  hasHabits: boolean;
  txCountToday: number;
  saleCountToday: number;
  businessTasksClosedToday: number;
  hasBusiness: boolean;
  workoutsToday: number;
  setsToday: number;
  hasFitness: boolean;
  readingSessionsToday: number;
  hasCurrentBook: boolean;
  journalEntriesToday: number;
}): RitualStatus {
  const sections: RitualSection[] = [
    {
      id: "inspire",
      available: input.hasMpd,
      done: input.affirmationRead,
    },
    {
      id: "mood",
      available: true,
      done: input.moodLoggedToday,
    },
    {
      id: "gratitude",
      available: true,
      done: input.gratitudeCountToday >= 1,
    },
    {
      id: "habits",
      available: input.hasHabits,
      done: input.habitLogsToday >= 1,
    },
    {
      id: "money",
      available: true,
      done: input.txCountToday >= 1,
    },
    {
      id: "business",
      available: input.hasBusiness,
      done:
        input.saleCountToday >= 1 || input.businessTasksClosedToday >= 1,
    },
    {
      id: "body",
      available: input.hasFitness,
      done: input.workoutsToday >= 1 || input.setsToday >= 1,
    },
    {
      id: "reading",
      available: input.hasCurrentBook,
      done: input.readingSessionsToday >= 1,
    },
    {
      id: "reflect",
      available: true,
      done: input.journalEntriesToday >= 1,
    },
  ];

  const available = sections.filter((s) => s.available);
  const completed = available.filter((s) => s.done);
  const availableCount = available.length;
  const completedCount = completed.length;
  const ratio = availableCount > 0 ? completedCount / availableCount : 0;
  const ritualMet = completedCount >= Math.min(MIN_FOR_DAY_COUNTED, availableCount);

  return {
    sections,
    completedCount,
    availableCount,
    ratio,
    ritualMet,
  };
}

export const SECTION_LABELS: Record<RitualSectionId, string> = {
  inspire: "Inspiración",
  mood: "Estado",
  gratitude: "Gratitud",
  habits: "Hábitos",
  money: "Plata",
  business: "Negocio",
  body: "Cuerpo",
  reading: "Lectura",
  reflect: "Reflexión",
};

export const SECTION_EMOJIS: Record<RitualSectionId, string> = {
  inspire: "✨",
  mood: "💗",
  gratitude: "🙏",
  habits: "✓",
  money: "💰",
  business: "💼",
  body: "💪",
  reading: "📖",
  reflect: "📓",
};
