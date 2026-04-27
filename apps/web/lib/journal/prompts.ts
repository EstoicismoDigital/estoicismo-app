/**
 * Daily journal prompts — preguntas estoicas para arrancar el diario.
 *
 * Selección curada de prompts (~50) inspirados en Marco Aurelio,
 * Séneca, Epicteto, y Joe Dispenza. Mezclados con preguntas de
 * The Daily Stoic (Ryan Holiday) traducidas al español.
 *
 * Diseño:
 *   - El día del año (1-365) elige un prompt deterministicamente
 *     usando módulo. Misma fecha = mismo prompt.
 *   - El user puede pasar al siguiente con un botón "Otro" si el
 *     que tocó no le habla hoy.
 */

export type JournalPrompt = {
  id: string;
  text: string;
  /** Atribución opcional. */
  source?: string;
  /** Área sugerida para la entrada. */
  suggestedArea?:
    | "free"
    | "mentalidad"
    | "habits"
    | "fitness"
    | "lectura"
    | "finanzas"
    | "emprendimiento";
  /**
   * A qué mood "calza" mejor este prompt. low=1-2, mid=3, high=4-5,
   * any=universal. Default any.
   *   low → preguntas que sostienen, abren válvula, observan dolor
   *   mid → preguntas analíticas, neutrales
   *   high → preguntas de aprovechar el impulso, reflexión sobre éxito
   */
  moodFit?: "low" | "mid" | "high" | "any";
};

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  // ─── Auto-conocimiento / Marco Aurelio ─────────────────────
  {
    id: "1",
    text: "¿Qué dependía de ti hoy y qué no? Repasa lo que pudiste cambiar.",
    source: "Epicteto",
    suggestedArea: "mentalidad",
  },
  {
    id: "2",
    text: "¿Qué hicieras hoy si supieras que es tu último día?",
    source: "Memento mori",
    suggestedArea: "free",
  },
  {
    id: "3",
    text: "¿Qué virtud puedes practicar hoy: justicia, valor, sabiduría o templanza?",
    source: "Marco Aurelio",
    suggestedArea: "mentalidad",
  },
  {
    id: "4",
    text: "¿En qué te resistes hoy a lo que es? ¿Cómo lo abrazarías?",
    source: "Amor fati",
    suggestedArea: "mentalidad",
  },
  {
    id: "5",
    text: "Si solo tuvieras una hora libre hoy — ¿qué elegirías hacer y por qué?",
    suggestedArea: "free",
  },
  // ─── Disciplina / Hábitos ───────────────────────────────────
  {
    id: "6",
    text: "¿Cuál hábito sostuviste esta semana sin pensarlo? Honra el esfuerzo invisible.",
    suggestedArea: "habits",
  },
  {
    id: "7",
    text: "Si solo pudieras tener 3 hábitos para el resto del año, ¿cuáles serían?",
    suggestedArea: "habits",
  },
  {
    id: "8",
    text: "¿Qué pequeña fricción te hace fallar en un hábito? Diséñala fuera.",
    source: "James Clear",
    suggestedArea: "habits",
  },
  // ─── Fitness ────────────────────────────────────────────────
  {
    id: "9",
    text: "¿Cómo se sintió tu cuerpo hoy? ¿Energizado, pesado, neutral? ¿Qué necesita?",
    suggestedArea: "fitness",
  },
  {
    id: "10",
    text: "¿Qué entrenamiento hubiera elegido tu yo de hace 5 años? ¿Y el de dentro de 5?",
    suggestedArea: "fitness",
  },
  // ─── Finanzas ───────────────────────────────────────────────
  {
    id: "11",
    text: "¿Qué compra reciente te dio vida? ¿Cuál te quitó vida?",
    source: "Vicki Robin",
    suggestedArea: "finanzas",
  },
  {
    id: "12",
    text: "Si tu ingreso se duplicara, ¿qué cambiaría? ¿Y si se redujera a la mitad?",
    suggestedArea: "finanzas",
  },
  {
    id: "13",
    text: "¿Por qué quieres más dinero? Profundiza más allá de la primera respuesta.",
    suggestedArea: "finanzas",
  },
  // ─── Mentalidad / Visualización ─────────────────────────────
  {
    id: "14",
    text: "Visualiza tu yo de dentro de un año. ¿Qué hace al despertar? ¿Qué siente?",
    source: "Joe Dispenza",
    suggestedArea: "mentalidad",
  },
  {
    id: "15",
    text: "¿Qué creencia limitante repetiste hoy? Reescríbela.",
    source: "Joe Dispenza",
    suggestedArea: "mentalidad",
  },
  {
    id: "16",
    text: "¿Qué frecuencia eliges para mañana: gratitud, miedo, paz, deseo?",
    suggestedArea: "mentalidad",
  },
  // ─── Lectura ────────────────────────────────────────────────
  {
    id: "17",
    text: "¿Qué línea del libro que lees hoy se quedó contigo? Cópiala y descubre por qué.",
    suggestedArea: "lectura",
  },
  {
    id: "18",
    text: "Si tuvieras que enseñar algo del libro a un niño, ¿qué dirías?",
    suggestedArea: "lectura",
  },
  // ─── Emprendimiento ─────────────────────────────────────────
  {
    id: "19",
    text: "¿Qué problema tuyo es tan grande que lo resolverías así no te pagaran?",
    suggestedArea: "emprendimiento",
  },
  {
    id: "20",
    text: "Si tu negocio tuviera 100 clientes mañana, ¿qué se rompería primero?",
    suggestedArea: "emprendimiento",
  },
  // ─── Relaciones / Estoicismo ────────────────────────────────
  {
    id: "21",
    text: "¿A quién no le has agradecido nada últimamente? Escríbeselo aunque no lo mandes.",
    source: "Séneca",
    suggestedArea: "free",
  },
  {
    id: "22",
    text: "¿Qué le dirías a tu yo de hace 10 años? ¿Y a tu yo de dentro de 10?",
    suggestedArea: "free",
  },
  {
    id: "23",
    text: "Imagina perder algo o alguien que amas. ¿Lo aprecias diferente ahora?",
    source: "Premeditatio malorum",
    suggestedArea: "mentalidad",
  },
  // ─── Tiempo ─────────────────────────────────────────────────
  {
    id: "24",
    text: "¿En qué pensamientos repetitivos gastaste tiempo hoy? ¿Te sirvieron?",
    suggestedArea: "mentalidad",
  },
  {
    id: "25",
    text: "Si pudieras eliminar UNA cosa de tu rutina, ¿qué sería?",
    suggestedArea: "habits",
  },
  // ─── Identidad ──────────────────────────────────────────────
  {
    id: "26",
    text: "¿Qué haces que no harías si nadie estuviera viendo? ¿Qué dejarías de hacer?",
    suggestedArea: "free",
  },
  {
    id: "27",
    text: "¿Cuándo fue la última vez que te sentiste plenamente vivo? Describe ese momento.",
    suggestedArea: "free",
  },
  // ─── Gratitud ───────────────────────────────────────────────
  {
    id: "28",
    text: "Tres cosas pequeñas por las que agradeces hoy — sin filtro espiritual, sólo lo real.",
    suggestedArea: "free",
  },
  {
    id: "29",
    text: "¿A qué le tienes miedo que no te ha pasado? Haz una lista.",
    source: "Séneca",
    suggestedArea: "mentalidad",
  },
  // ─── Propósito ──────────────────────────────────────────────
  {
    id: "30",
    text: "Si todo te saliera bien — todo — ¿cómo se ve tu vida en 5 años? Sé específico.",
    source: "MPD",
    suggestedArea: "mentalidad",
  },
  {
    id: "31",
    text: "¿Qué legado quieres dejar? No tu funeral; tu impacto cotidiano en quienes amas.",
    suggestedArea: "free",
  },
  {
    id: "32",
    text: "¿Qué precio estás dispuesto a pagar por lo que dices que quieres?",
    suggestedArea: "mentalidad",
  },
  // ─── Sombras ────────────────────────────────────────────────
  {
    id: "33",
    text: "¿Qué te molesta de los demás que también haces tú?",
    source: "Jung / Marco Aurelio",
    suggestedArea: "free",
  },
  {
    id: "34",
    text: "¿Qué sientes cuando alguien cercano triunfa? Honra la respuesta sin filtro.",
    suggestedArea: "free",
  },
  // ─── Cuerpo ─────────────────────────────────────────────────
  {
    id: "35",
    text: "¿Qué necesita tu cuerpo que llevas posponiendo? Escribe el primer paso.",
    suggestedArea: "fitness",
  },
  // ─── Acción ─────────────────────────────────────────────────
  {
    id: "36",
    text: "¿Cuál es la decisión más pequeña que pospones que más alivio te daría tomar?",
    suggestedArea: "free",
  },
  {
    id: "37",
    text: "¿Qué harías mañana si supieras que no fallarías?",
    suggestedArea: "free",
  },
  // ─── Día ───────────────────────────────────────────────────
  {
    id: "38",
    text: "¿Qué fue lo mejor de hoy? ¿Y lo peor? Describe ambos sin juicio.",
    suggestedArea: "free",
  },
  {
    id: "39",
    text: "Si hoy se repitiera 100 veces, ¿qué haría que valiera la pena?",
    suggestedArea: "free",
  },
  // ─── Decisiones ─────────────────────────────────────────────
  {
    id: "40",
    text: "¿Qué está consumiendo más energía mental de la que debería?",
    suggestedArea: "free",
  },
  // ─── Aceptación ─────────────────────────────────────────────
  {
    id: "41",
    text: "¿Qué cosa que NO puedes cambiar sigues intentando cambiar?",
    suggestedArea: "mentalidad",
  },
  {
    id: "42",
    text: "Escribe un perdón a alguien — sin enviárselo. Sólo para ti.",
    suggestedArea: "free",
  },
  // ─── Imaginación ────────────────────────────────────────────
  {
    id: "43",
    text: "Imagina que ya tienes lo que persigues. ¿Qué se siente? Habita ese estado 1 minuto.",
    source: "Joe Dispenza",
    suggestedArea: "mentalidad",
  },
  // ─── Recursos ───────────────────────────────────────────────
  {
    id: "44",
    text: "Si tu energía fuera dinero, ¿en qué la inviertes hoy? ¿Es donde la quieres?",
    suggestedArea: "free",
  },
  {
    id: "45",
    text: "¿Qué relación te alimenta más esta semana? Dale gracias mentalmente.",
    suggestedArea: "free",
  },
  // ─── Logro ──────────────────────────────────────────────────
  {
    id: "46",
    text: "¿De qué estás más orgulloso esta semana? Sin minimizarlo.",
    suggestedArea: "free",
  },
  // ─── Honestidad ─────────────────────────────────────────────
  {
    id: "47",
    text: "¿Qué le mientes a tu yo cercano para no incomodarlo?",
    suggestedArea: "free",
  },
  {
    id: "48",
    text: "Si nadie pudiera juzgarte, ¿qué harías diferente esta semana?",
    suggestedArea: "free",
  },
  // ─── Tiempo / Ritual ────────────────────────────────────────
  {
    id: "49",
    text: "¿Qué ritual de la mañana o la noche te ancla? Si no tienes ninguno, ¿cuál crearías?",
    suggestedArea: "habits",
  },
  {
    id: "50",
    text: "Si dieras un consejo a alguien que recién empieza a meditar, ¿qué le dirías?",
    suggestedArea: "mentalidad",
  },
];

// ─────────────────────────────────────────────────────────────
// MOOD-FIT PROMPTS — preguntas que se adaptan al estado del user
// ─────────────────────────────────────────────────────────────

/**
 * Prompts curados por mood. Se inyectan en el pool global pero la
 * UI puede elegir uno de aquí cuando sabe el mood del día.
 *
 * Filosofía:
 *  - low: validar dolor sin alimentarlo. Abrir válvula, no resolver.
 *  - mid: aprovechar la calma para analizar.
 *  - high: capturar el impulso, no romántico. Lo que hizo bien tu yo
 *    de hoy → para tu yo del lunes que estará cansado.
 */
export const MOOD_PROMPTS: JournalPrompt[] = [
  // LOW — días duros
  {
    id: "low-1",
    text: "Sin filtro: ¿qué duele hoy? No lo arregles, sólo nómbralo.",
    moodFit: "low",
    suggestedArea: "mentalidad",
  },
  {
    id: "low-2",
    text: "¿Qué pequeñísima cosa hoy fue un alivio, aunque dure 5 segundos?",
    moodFit: "low",
    suggestedArea: "mentalidad",
  },
  {
    id: "low-3",
    text: "Si un amigo querido sintiera lo que tú hoy, ¿qué le dirías? Léelo después en voz alta — para ti.",
    moodFit: "low",
    suggestedArea: "mentalidad",
  },
  {
    id: "low-4",
    text: "¿Qué necesitas que NADIE te ha dado y puedas darte tú esta noche?",
    moodFit: "low",
    suggestedArea: "free",
  },
  {
    id: "low-5",
    text: "¿Qué es lo MÍNIMO que tienes que hacer hoy para no destrozarte mañana? Sólo eso. El resto puede esperar.",
    moodFit: "low",
    suggestedArea: "habits",
  },
  {
    id: "low-6",
    text: "Lo que sientes ahora, ¿lo has sentido antes? ¿Cómo se acabó la vez pasada?",
    moodFit: "low",
    source: "Stoa",
    suggestedArea: "mentalidad",
  },

  // MID — neutral, analítico
  {
    id: "mid-1",
    text: "¿Qué patrón se repite esta semana — bueno o malo? Obsérvalo sin juicio.",
    moodFit: "mid",
    suggestedArea: "free",
  },
  {
    id: "mid-2",
    text: "Si todo lo que pasa hoy fuera entrenamiento, ¿qué músculo creció?",
    moodFit: "mid",
    suggestedArea: "mentalidad",
  },
  {
    id: "mid-3",
    text: "Tres decisiones de hoy: ¿cuál la harías diferente con lo que sabes ahora?",
    moodFit: "mid",
    suggestedArea: "free",
  },

  // HIGH — días buenos
  {
    id: "high-1",
    text: "Hoy te sentiste bien. Captúralo: ¿qué hizo de hoy un buen día? Tu yo de un mal día lo va a leer.",
    moodFit: "high",
    suggestedArea: "mentalidad",
  },
  {
    id: "high-2",
    text: "¿Quién, sin que se lo diga, hizo posible tu día bueno? Mándale algo — un mensaje, un gracias.",
    moodFit: "high",
    suggestedArea: "free",
  },
  {
    id: "high-3",
    text: "Estás en racha. ¿Cuál es la SIGUIENTE cosa que tu yo del próximo trimestre te agradecerá si la haces hoy?",
    moodFit: "high",
    suggestedArea: "habits",
  },
  {
    id: "high-4",
    text: "El éxito es ruidoso pero engañoso. ¿Qué del éxito de hoy es realmente tuyo, qué fue suerte?",
    moodFit: "high",
    source: "Séneca",
    suggestedArea: "mentalidad",
  },
];

// Pool combinado para el random / day-of-year fallback
const ALL_PROMPTS: JournalPrompt[] = [...JOURNAL_PROMPTS, ...MOOD_PROMPTS];

/**
 * Día del año (1-365/6) — compatible con timezone local del user.
 */
function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff =
    d.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Devuelve el prompt del día — determinístico por fecha local del user.
 * El parámetro `seed` permite navegar al siguiente / anterior sin que
 * cambie en el día.
 */
export function getDailyJournalPrompt(seed = 0): JournalPrompt {
  const idx = (dayOfYear() + seed) % JOURNAL_PROMPTS.length;
  return JOURNAL_PROMPTS[(idx + JOURNAL_PROMPTS.length) % JOURNAL_PROMPTS.length];
}

export function getRandomJournalPrompt(): JournalPrompt {
  return JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
}

/**
 * Devuelve el prompt del día adaptado al mood actual del user.
 *
 * Si `mood` es null/undefined → mismo comportamiento que getDailyJournalPrompt.
 * Si `mood` está definido → elige determinísticamente entre los prompts
 * que calzan con ese mood bucket (low/mid/high).
 *
 * `seed` permite el "Otro" del usuario sin que cambie en el día.
 */
export function moodBucket(mood: number | null | undefined): "low" | "mid" | "high" | null {
  if (mood == null) return null;
  if (mood <= 2) return "low";
  if (mood >= 4) return "high";
  return "mid";
}

export function getMoodAwareJournalPrompt(
  mood: number | null | undefined,
  seed = 0
): JournalPrompt {
  const bucket = moodBucket(mood);
  if (!bucket) return getDailyJournalPrompt(seed);
  const fitting = ALL_PROMPTS.filter(
    (p) => p.moodFit === bucket || p.moodFit === "any" || !p.moodFit
  );
  // Bias hacia los específicos del mood (que tengan moodFit === bucket)
  const specific = fitting.filter((p) => p.moodFit === bucket);
  const pool = specific.length >= 3 ? specific : fitting;
  const idx = (dayOfYear() + seed) % pool.length;
  return pool[(idx + pool.length) % pool.length];
}
