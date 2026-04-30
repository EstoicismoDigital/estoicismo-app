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

export type StoicPillar = "epicteto" | "marco_aurelio" | "porcia" | "seneca";
export type DayMoment = "morning" | "midday" | "evening" | "anytime";
export type PromptDepth = "easy" | "medium" | "deep";

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
  /** Pilar estoico de origen (para pool ampliado v2). */
  pillar?: StoicPillar;
  /** Momento del día sugerido (mañana/mediodía/noche/cualquier). */
  moment?: DayMoment;
  /** Profundidad: easy (30s) | medium (1-2min) | deep (5min). */
  depth?: PromptDepth;
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

// ─────────────────────────────────────────────────────────────
// V2 — POOL EXPANDIDO POR PILAR (140 prompts)
//
// Estructura ampliada: cada prompt tiene pillar (4 estoicos) +
// moment (mañana/mediodía/noche/cualquier) + depth (easy/medium/deep).
// Se usan para:
//  - Recovery banner: si user faltó días, mostrar prompt "post_ausencia".
//  - Celebración: si lleva racha 7+ días, prompt celebratorio.
//  - Filtro por pilar: cuando el user navega a Hábitos/Finanzas/etc.
// ─────────────────────────────────────────────────────────────

export const STOIC_PILLAR_PROMPTS: JournalPrompt[] = [
  // ── EPICTETO · HÁBITOS · 35 prompts ──────────────────────────
  { id: "ep001", pillar: "epicteto", moment: "morning", depth: "easy", text: "¿Qué cosa de hoy depende solo de ti?", suggestedArea: "habits" },
  { id: "ep002", pillar: "epicteto", moment: "morning", depth: "easy", text: "Nombra un hábito pequeño que vas a sostener hoy, aunque nadie lo vea.", suggestedArea: "habits" },
  { id: "ep003", pillar: "epicteto", moment: "morning", depth: "easy", text: "¿Qué rutina vas a empezar hoy con cuerpo, no con cabeza?", suggestedArea: "habits" },
  { id: "ep004", pillar: "epicteto", moment: "morning", depth: "medium", text: "Una distracción previsible del día. ¿Cómo la vas a soltar?", suggestedArea: "habits" },
  { id: "ep005", pillar: "epicteto", moment: "morning", depth: "medium", text: "¿Qué decisión repetida te está construyendo en silencio?", suggestedArea: "habits" },
  { id: "ep006", pillar: "epicteto", moment: "morning", depth: "easy", text: "Si hoy fuera el día 1 de tu nueva versión, ¿qué harías primero?", suggestedArea: "habits" },
  { id: "ep007", pillar: "epicteto", moment: "morning", depth: "easy", text: "Elige una acción mínima que repita ayer (o que repare ayer).", suggestedArea: "habits" },
  { id: "ep008", pillar: "epicteto", moment: "morning", depth: "medium", text: "¿Dónde vas a poner tu atención cuando aparezca el ruido?", suggestedArea: "habits" },
  { id: "ep009", pillar: "epicteto", moment: "midday", depth: "easy", text: "¿Estás haciendo lo que dijiste, o lo que apetece?", suggestedArea: "habits" },
  { id: "ep010", pillar: "epicteto", moment: "midday", depth: "easy", text: "Pausa 30s. ¿Qué está dentro de tu control en este momento exacto?", suggestedArea: "mentalidad" },
  { id: "ep011", pillar: "epicteto", moment: "midday", depth: "medium", text: "¿Qué estás tratando de controlar que no es tuyo?", suggestedArea: "mentalidad" },
  { id: "ep012", pillar: "epicteto", moment: "midday", depth: "easy", text: "Una micro-victoria de hoy, sin importar el tamaño.", suggestedArea: "habits" },
  { id: "ep013", pillar: "epicteto", moment: "midday", depth: "medium", text: "¿Qué reacción automática viste en ti en las últimas horas?", suggestedArea: "mentalidad" },
  { id: "ep014", pillar: "epicteto", moment: "midday", depth: "medium", text: "¿Qué parte del día hiciste por hábito y cuál por elección?", suggestedArea: "habits" },
  { id: "ep015", pillar: "epicteto", moment: "evening", depth: "medium", text: "Una acción que hiciste por hábito y no por elección hoy.", suggestedArea: "habits" },
  { id: "ep016", pillar: "epicteto", moment: "evening", depth: "easy", text: "¿Qué hábito te acercó a quien quieres ser hoy?", suggestedArea: "habits" },
  { id: "ep017", pillar: "epicteto", moment: "evening", depth: "medium", text: "¿Qué hábito te alejó? Sin culpa, solo dato.", suggestedArea: "habits" },
  { id: "ep018", pillar: "epicteto", moment: "evening", depth: "deep", text: "¿Dónde reaccionaste cuando podías haber respondido?", suggestedArea: "mentalidad" },
  { id: "ep019", pillar: "epicteto", moment: "evening", depth: "easy", text: "¿Qué cosa pequeña hiciste hoy que mañana puedes repetir?", suggestedArea: "habits" },
  { id: "ep020", pillar: "epicteto", moment: "evening", depth: "medium", text: "¿Qué cosa NO hiciste hoy y te enorgullece haber soltado?", suggestedArea: "habits" },
  { id: "ep021", pillar: "epicteto", moment: "evening", depth: "medium", text: "Una opinión ajena que dejaste afuera de tu cabeza hoy.", suggestedArea: "mentalidad" },
  { id: "ep022", pillar: "epicteto", moment: "evening", depth: "deep", text: "¿Qué parte de tu día fue ruido y cuál fue señal?", suggestedArea: "free" },
  { id: "ep023", pillar: "epicteto", moment: "evening", depth: "medium", text: "¿Qué sensación física del día te dio más información que tus pensamientos?", suggestedArea: "free" },
  { id: "ep024", pillar: "epicteto", moment: "anytime", depth: "deep", text: "¿Qué acción repetida 30 días seguidos te cambia la vida?", suggestedArea: "habits" },
  { id: "ep025", pillar: "epicteto", moment: "anytime", depth: "medium", text: "¿Cuál es la versión más chica de ese hábito que NO puedes fallar?", suggestedArea: "habits" },
  { id: "ep026", pillar: "epicteto", moment: "anytime", depth: "medium", text: "Algo que te molesta del afuera. ¿Cuánto de eso depende de ti?", suggestedArea: "mentalidad" },
  { id: "ep027", pillar: "epicteto", moment: "anytime", depth: "deep", text: "Si soltaras una sola opinión ajena, ¿cuál sería?", suggestedArea: "mentalidad" },
  { id: "ep028", pillar: "epicteto", moment: "anytime", depth: "medium", text: "¿Qué esfuerzo invisible te está sosteniendo esta semana?", suggestedArea: "habits" },
  { id: "ep029", pillar: "epicteto", moment: "anytime", depth: "easy", text: "Describe en una frase tu disciplina actual.", suggestedArea: "habits" },
  { id: "ep030", pillar: "epicteto", moment: "anytime", depth: "deep", text: "¿Qué parte de tu rutina se volvió piloto automático y dejó de servirte?", suggestedArea: "habits" },
  { id: "ep031", pillar: "epicteto", moment: "morning", depth: "medium", text: "¿Cuál es el primer impulso del día que vas a observar antes de seguir?", suggestedArea: "mentalidad" },
  { id: "ep032", pillar: "epicteto", moment: "evening", depth: "medium", text: "Una incomodidad chica de hoy que elegiste atravesar.", suggestedArea: "habits" },
  { id: "ep033", pillar: "epicteto", moment: "anytime", depth: "medium", text: "¿Qué pensaste hoy que era urgente y resultó no serlo?", suggestedArea: "mentalidad" },
  { id: "ep034", pillar: "epicteto", moment: "midday", depth: "easy", text: "Detén la inercia 1 minuto. ¿Qué vas a hacer ahora a propósito?", suggestedArea: "habits" },
  { id: "ep035", pillar: "epicteto", moment: "evening", depth: "deep", text: "¿Qué parte de hoy hubieras manejado distinto sabiendo lo que sabes ahora?", suggestedArea: "free" },

  // ── MARCO AURELIO · FINANZAS · 35 prompts ────────────────────
  { id: "ma001", pillar: "marco_aurelio", moment: "morning", depth: "medium", text: "¿Qué decisión económica de hoy está alineada con quien quieres ser en 5 años?", suggestedArea: "finanzas" },
  { id: "ma002", pillar: "marco_aurelio", moment: "morning", depth: "easy", text: "Un gasto de hoy que vas a hacer a propósito y no por inercia.", suggestedArea: "finanzas" },
  { id: "ma003", pillar: "marco_aurelio", moment: "morning", depth: "medium", text: "¿Qué necesitas hoy de verdad, y qué solo creíste necesitar?", suggestedArea: "finanzas" },
  { id: "ma004", pillar: "marco_aurelio", moment: "morning", depth: "medium", text: "Si tu yo de mañana mira tu cuenta hoy, ¿qué esperaría de ti?", suggestedArea: "finanzas" },
  { id: "ma005", pillar: "marco_aurelio", moment: "morning", depth: "easy", text: "¿Qué recurso (tiempo, dinero, energía) vas a proteger hoy?", suggestedArea: "finanzas" },
  { id: "ma006", pillar: "marco_aurelio", moment: "morning", depth: "easy", text: "Una compra que NO vas a hacer hoy. Sin drama, solo decisión.", suggestedArea: "finanzas" },
  { id: "ma007", pillar: "marco_aurelio", moment: "morning", depth: "deep", text: "¿Cuánto vale para ti una hora de tu día hoy?", suggestedArea: "finanzas" },
  { id: "ma008", pillar: "marco_aurelio", moment: "morning", depth: "medium", text: "Si manejaras tu dinero como un ejército chico, ¿qué orden darías hoy?", suggestedArea: "finanzas" },
  { id: "ma009", pillar: "marco_aurelio", moment: "midday", depth: "deep", text: "¿Estás trabajando por el dinero o el dinero está trabajando para ti hoy?", suggestedArea: "finanzas" },
  { id: "ma010", pillar: "marco_aurelio", moment: "midday", depth: "medium", text: "Un gasto pendiente. ¿Es necesario o es ruido emocional?", suggestedArea: "finanzas" },
  { id: "ma011", pillar: "marco_aurelio", moment: "midday", depth: "medium", text: "¿Qué hubieras pagado por la energía que tienes ahora hace un mes?", suggestedArea: "finanzas" },
  { id: "ma012", pillar: "marco_aurelio", moment: "midday", depth: "medium", text: "Si dejaras de comprar X por 30 días, ¿qué ganarías?", suggestedArea: "finanzas" },
  { id: "ma013", pillar: "marco_aurelio", moment: "midday", depth: "deep", text: "¿Qué parte de tu día hoy vale más que cualquier sueldo?", suggestedArea: "free" },
  { id: "ma014", pillar: "marco_aurelio", moment: "evening", depth: "medium", text: "¿Qué comprabas antes que ya no necesitas?", suggestedArea: "finanzas" },
  { id: "ma015", pillar: "marco_aurelio", moment: "evening", depth: "easy", text: "Un gasto de hoy del que estás conforme. ¿Por qué?", suggestedArea: "finanzas" },
  { id: "ma016", pillar: "marco_aurelio", moment: "evening", depth: "medium", text: "Un gasto de hoy del que aprendiste algo. Sin reproche.", suggestedArea: "finanzas" },
  { id: "ma017", pillar: "marco_aurelio", moment: "evening", depth: "deep", text: "¿Cuánto tiempo y dinero gastaste en cosas que mañana no vas a recordar?", suggestedArea: "finanzas" },
  { id: "ma018", pillar: "marco_aurelio", moment: "evening", depth: "easy", text: "¿Qué cosa que tienes hoy alguna vez deseaste con fuerza?", suggestedArea: "free" },
  { id: "ma019", pillar: "marco_aurelio", moment: "evening", depth: "deep", text: "Si perdieras la mitad de lo que tienes mañana, ¿con qué te quedarías intacto?", suggestedArea: "finanzas" },
  { id: "ma020", pillar: "marco_aurelio", moment: "evening", depth: "medium", text: "Una decisión financiera del día. ¿Fue tuya o reactiva?", suggestedArea: "finanzas" },
  { id: "ma021", pillar: "marco_aurelio", moment: "anytime", depth: "deep", text: "¿Cuál es tu definición de 'suficiente' hoy?", suggestedArea: "finanzas" },
  { id: "ma022", pillar: "marco_aurelio", moment: "anytime", depth: "medium", text: "¿Qué estás postergando que cuesta menos de lo que crees?", suggestedArea: "finanzas" },
  { id: "ma023", pillar: "marco_aurelio", moment: "anytime", depth: "medium", text: "¿Qué estás consumiendo que ya no te representa?", suggestedArea: "finanzas" },
  { id: "ma024", pillar: "marco_aurelio", moment: "anytime", depth: "deep", text: "Si nadie te viera comprar, ¿comprarías lo mismo?", suggestedArea: "finanzas" },
  { id: "ma025", pillar: "marco_aurelio", moment: "anytime", depth: "deep", text: "Una conversación sobre dinero que estás evitando. ¿Con quién?", suggestedArea: "finanzas" },
  { id: "ma026", pillar: "marco_aurelio", moment: "anytime", depth: "deep", text: "¿Cómo mediría tu propia tranquilidad financiera el Marco Aurelio de hoy?", suggestedArea: "finanzas" },
  { id: "ma027", pillar: "marco_aurelio", moment: "anytime", depth: "medium", text: "¿Qué parte de tus finanzas te avergüenza menos cuando la miras de frente?", suggestedArea: "finanzas" },
  { id: "ma028", pillar: "marco_aurelio", moment: "anytime", depth: "deep", text: "¿Cuánto de tu identidad está atada a lo que ganas?", suggestedArea: "finanzas" },
  { id: "ma029", pillar: "marco_aurelio", moment: "morning", depth: "easy", text: "Hoy vas a recibir/pagar algo. ¿Con qué actitud?", suggestedArea: "finanzas" },
  { id: "ma030", pillar: "marco_aurelio", moment: "midday", depth: "easy", text: "¿Estás eligiendo o estás reaccionando con tu plata hoy?", suggestedArea: "finanzas" },
  { id: "ma031", pillar: "marco_aurelio", moment: "evening", depth: "easy", text: "Tres bendiciones del día que no costaron dinero.", suggestedArea: "free" },
  { id: "ma032", pillar: "marco_aurelio", moment: "evening", depth: "deep", text: "¿Qué aprendiste hoy del valor del tiempo vs el valor del dinero?", suggestedArea: "finanzas" },
  { id: "ma033", pillar: "marco_aurelio", moment: "anytime", depth: "medium", text: "Una meta financiera chica para esta semana. Concreta.", suggestedArea: "finanzas" },
  { id: "ma034", pillar: "marco_aurelio", moment: "anytime", depth: "deep", text: "¿Qué quiere tu dinero que tú todavía no escuchaste?", suggestedArea: "finanzas" },
  { id: "ma035", pillar: "marco_aurelio", moment: "morning", depth: "medium", text: "Hoy alguien va a influir en una decisión tuya. ¿Cómo vas a separar consejo de manipulación?", suggestedArea: "free" },

  // ── PORCIA CATÓN · MENTALIDAD · 35 prompts ───────────────────
  { id: "pc001", pillar: "porcia", moment: "morning", depth: "medium", text: "¿Qué vas a hacer hoy que requiere coraje, no permiso?", suggestedArea: "mentalidad" },
  { id: "pc002", pillar: "porcia", moment: "morning", depth: "medium", text: "Una situación donde sabes lo correcto. ¿Vas a actuar?", suggestedArea: "mentalidad" },
  { id: "pc003", pillar: "porcia", moment: "morning", depth: "deep", text: "¿Qué parte de ti hoy no necesita aprobación externa?", suggestedArea: "mentalidad" },
  { id: "pc004", pillar: "porcia", moment: "morning", depth: "medium", text: "Una pregunta difícil que vas a hacerte hoy en lugar de evitarla.", suggestedArea: "mentalidad" },
  { id: "pc005", pillar: "porcia", moment: "morning", depth: "deep", text: "¿Qué estás postergando porque te da miedo descubrir lo que eres capaz de hacer?", suggestedArea: "mentalidad" },
  { id: "pc006", pillar: "porcia", moment: "morning", depth: "easy", text: "Si confiaras 10% más en ti, ¿qué harías antes del mediodía?", suggestedArea: "mentalidad" },
  { id: "pc007", pillar: "porcia", moment: "morning", depth: "medium", text: "Hoy te van a subestimar. ¿Cómo vas a responder sin necesitar probar nada?", suggestedArea: "mentalidad" },
  { id: "pc008", pillar: "porcia", moment: "morning", depth: "medium", text: "¿Qué conversación incómoda no estás teniendo, y con quién?", suggestedArea: "free" },
  { id: "pc009", pillar: "porcia", moment: "midday", depth: "deep", text: "¿Estás siendo tú mismo o la versión que esperan?", suggestedArea: "mentalidad" },
  { id: "pc010", pillar: "porcia", moment: "midday", depth: "medium", text: "Una decisión pendiente. ¿Qué dice tu intuición sin ruido externo?", suggestedArea: "mentalidad" },
  { id: "pc011", pillar: "porcia", moment: "midday", depth: "medium", text: "¿Dónde estás pidiendo permiso cuando ya sabes la respuesta?", suggestedArea: "mentalidad" },
  { id: "pc012", pillar: "porcia", moment: "midday", depth: "medium", text: "¿Qué dolor (chico) elegiste atravesar hoy en lugar de esquivar?", suggestedArea: "mentalidad" },
  { id: "pc013", pillar: "porcia", moment: "midday", depth: "easy", text: "¿Estás guardando energía para algo importante o desparramándola?", suggestedArea: "mentalidad" },
  { id: "pc014", pillar: "porcia", moment: "evening", depth: "easy", text: "Una vez hoy en que pusiste límite. ¿Cómo se sintió?", suggestedArea: "mentalidad" },
  { id: "pc015", pillar: "porcia", moment: "evening", depth: "easy", text: "Un momento donde fuiste fiel a ti mismo. Aunque nadie lo viera.", suggestedArea: "mentalidad" },
  { id: "pc016", pillar: "porcia", moment: "evening", depth: "deep", text: "Donde cediste hoy y no querías. ¿Qué pasó por dentro?", suggestedArea: "mentalidad" },
  { id: "pc017", pillar: "porcia", moment: "evening", depth: "medium", text: "¿Qué prueba interna superaste sin contársela a nadie?", suggestedArea: "mentalidad" },
  { id: "pc018", pillar: "porcia", moment: "evening", depth: "deep", text: "¿Qué sentiste hoy que normalmente reprimirías?", suggestedArea: "mentalidad" },
  { id: "pc019", pillar: "porcia", moment: "evening", depth: "easy", text: "Una palabra que define tu mentalidad de hoy.", suggestedArea: "mentalidad" },
  { id: "pc020", pillar: "porcia", moment: "evening", depth: "deep", text: "¿Quién te vio más claramente hoy: tú o el resto?", suggestedArea: "mentalidad" },
  { id: "pc021", pillar: "porcia", moment: "anytime", depth: "deep", text: "¿Qué parte tuya estás escondiendo de la gente que más te importa?", suggestedArea: "free" },
  { id: "pc022", pillar: "porcia", moment: "anytime", depth: "deep", text: "¿Dónde te estás tratando como si fueras menos capaz de lo que eres?", suggestedArea: "mentalidad" },
  { id: "pc023", pillar: "porcia", moment: "anytime", depth: "medium", text: "Una decisión que sabes que vas a tomar. ¿Por qué estás demorando?", suggestedArea: "mentalidad" },
  { id: "pc024", pillar: "porcia", moment: "anytime", depth: "medium", text: "¿Qué palabra tuya te traicionó últimamente? Sin condena, solo notarlo.", suggestedArea: "mentalidad" },
  { id: "pc025", pillar: "porcia", moment: "anytime", depth: "medium", text: "¿Qué opinión ajena estás cargando que ya no te representa?", suggestedArea: "mentalidad" },
  { id: "pc026", pillar: "porcia", moment: "anytime", depth: "easy", text: "¿Cuándo fue la última vez que te dijiste 'puedo con esto' y resultó cierto?", suggestedArea: "mentalidad" },
  { id: "pc027", pillar: "porcia", moment: "anytime", depth: "deep", text: "¿En qué área te estás comportando como invitado en tu propia vida?", suggestedArea: "mentalidad" },
  { id: "pc028", pillar: "porcia", moment: "morning", depth: "easy", text: "Hoy vas a hacer algo difícil. Nómbralo en una frase.", suggestedArea: "mentalidad" },
  { id: "pc029", pillar: "porcia", moment: "midday", depth: "easy", text: "Tres respiraciones. ¿Qué necesita tu mente justo ahora?", suggestedArea: "mentalidad" },
  { id: "pc030", pillar: "porcia", moment: "evening", depth: "easy", text: "¿Qué parte de tu mente trabajó hoy y necesita descanso?", suggestedArea: "mentalidad" },
  { id: "pc031", pillar: "porcia", moment: "anytime", depth: "easy", text: "¿De qué estás verdaderamente orgulloso esta semana?", suggestedArea: "free" },
  { id: "pc032", pillar: "porcia", moment: "evening", depth: "deep", text: "Si tu yo de hace 5 años te viera ahora, ¿qué te diría?", suggestedArea: "free" },
  { id: "pc033", pillar: "porcia", moment: "morning", depth: "medium", text: "Una creencia limitante que vas a poner a prueba hoy.", suggestedArea: "mentalidad" },
  { id: "pc034", pillar: "porcia", moment: "anytime", depth: "deep", text: "¿Qué estás evitando sentir? Sin tener que cambiarlo.", suggestedArea: "mentalidad" },
  { id: "pc035", pillar: "porcia", moment: "midday", depth: "medium", text: "¿Estás reaccionando a un evento o al recuerdo de un evento parecido?", suggestedArea: "mentalidad" },

  // ── SÉNECA · EMPRENDIMIENTO · 35 prompts ─────────────────────
  { id: "se001", pillar: "seneca", moment: "morning", depth: "easy", text: "¿En qué vas a invertir tu tiempo hoy con conciencia, no por inercia?", suggestedArea: "emprendimiento" },
  { id: "se002", pillar: "seneca", moment: "morning", depth: "easy", text: "¿Qué parte de tu proyecto avanzas hoy aunque sea 1%?", suggestedArea: "emprendimiento" },
  { id: "se003", pillar: "seneca", moment: "morning", depth: "medium", text: "¿Qué vas a empezar hoy sin esperar las condiciones perfectas?", suggestedArea: "emprendimiento" },
  { id: "se004", pillar: "seneca", moment: "morning", depth: "medium", text: "Si hoy no llega un cliente, ¿qué vas a construir igual?", suggestedArea: "emprendimiento" },
  { id: "se005", pillar: "seneca", moment: "morning", depth: "medium", text: "Una tarea de hoy que empuja la visión y otra que solo apaga incendio.", suggestedArea: "emprendimiento" },
  { id: "se006", pillar: "seneca", moment: "morning", depth: "easy", text: "¿Qué estás postergando que tarda menos de 10 minutos?", suggestedArea: "emprendimiento" },
  { id: "se007", pillar: "seneca", moment: "morning", depth: "deep", text: "Si supieras que tu negocio cambia para siempre en 90 días, ¿qué harías hoy?", suggestedArea: "emprendimiento" },
  { id: "se008", pillar: "seneca", moment: "morning", depth: "medium", text: "¿Cuál es el riesgo chico que vale la pena correr esta semana?", suggestedArea: "emprendimiento" },
  { id: "se009", pillar: "seneca", moment: "midday", depth: "easy", text: "¿Estás trabajando en lo importante o solo lo urgente?", suggestedArea: "emprendimiento" },
  { id: "se010", pillar: "seneca", moment: "midday", depth: "medium", text: "Pausa: ¿esta tarea acerca o aleja de la persona que quieres ser?", suggestedArea: "free" },
  { id: "se011", pillar: "seneca", moment: "midday", depth: "medium", text: "¿Quién te robó tiempo hoy y tú lo permitiste?", suggestedArea: "emprendimiento" },
  { id: "se012", pillar: "seneca", moment: "midday", depth: "easy", text: "¿Qué estás aprendiendo en este momento que no aprendiste ayer?", suggestedArea: "free" },
  { id: "se013", pillar: "seneca", moment: "midday", depth: "deep", text: "Si tu negocio fuera una persona, ¿qué necesita hoy?", suggestedArea: "emprendimiento" },
  { id: "se014", pillar: "seneca", moment: "midday", depth: "easy", text: "Tres respiraciones. ¿Estás presente en lo que estás haciendo?", suggestedArea: "free" },
  { id: "se015", pillar: "seneca", moment: "evening", depth: "medium", text: "¿Cuánto del día gastaste en cosas que no movieron la aguja?", suggestedArea: "emprendimiento" },
  { id: "se016", pillar: "seneca", moment: "evening", depth: "deep", text: "Una decisión de negocio del día. ¿La tomaste con miedo o con visión?", suggestedArea: "emprendimiento" },
  { id: "se017", pillar: "seneca", moment: "evening", depth: "easy", text: "¿A quién ayudaste hoy con tu trabajo, aunque no te haya pagado?", suggestedArea: "emprendimiento" },
  { id: "se018", pillar: "seneca", moment: "evening", depth: "easy", text: "Tres horas de hoy bien invertidas. ¿En qué?", suggestedArea: "emprendimiento" },
  { id: "se019", pillar: "seneca", moment: "evening", depth: "medium", text: "¿Qué problema sigues resolviendo en tu cabeza después del trabajo?", suggestedArea: "emprendimiento" },
  { id: "se020", pillar: "seneca", moment: "evening", depth: "easy", text: "¿Qué cosa hiciste hoy que tu yo de hace 1 año no creía posible?", suggestedArea: "free" },
  { id: "se021", pillar: "seneca", moment: "evening", depth: "easy", text: "Algo que aprendiste hoy de un cliente, de un error o de una conversación.", suggestedArea: "emprendimiento" },
  { id: "se022", pillar: "seneca", moment: "evening", depth: "medium", text: "¿Qué conversación de negocio hoy fue ruido y cuál fue señal?", suggestedArea: "emprendimiento" },
  { id: "se023", pillar: "seneca", moment: "anytime", depth: "deep", text: "¿En qué parte de tu negocio estás siendo vago contigo mismo?", suggestedArea: "emprendimiento" },
  { id: "se024", pillar: "seneca", moment: "anytime", depth: "medium", text: "¿Cuál es tu único cuello de botella real esta semana?", suggestedArea: "emprendimiento" },
  { id: "se025", pillar: "seneca", moment: "anytime", depth: "medium", text: "¿Qué estás haciendo que un colaborador podría hacer por ti?", suggestedArea: "emprendimiento" },
  { id: "se026", pillar: "seneca", moment: "anytime", depth: "deep", text: "Si te quedaran 6 meses, ¿qué cliente o proyecto soltarías hoy?", suggestedArea: "emprendimiento" },
  { id: "se027", pillar: "seneca", moment: "anytime", depth: "deep", text: "¿Qué precio estás pagando por seguir 'aguantando' algo que no funciona?", suggestedArea: "emprendimiento" },
  { id: "se028", pillar: "seneca", moment: "anytime", depth: "medium", text: "Una habilidad que necesita tu negocio en 12 meses. ¿La estás construyendo?", suggestedArea: "emprendimiento" },
  { id: "se029", pillar: "seneca", moment: "anytime", depth: "easy", text: "¿De qué parte de tu emprendimiento estás verdaderamente orgulloso esta semana?", suggestedArea: "emprendimiento" },
  { id: "se030", pillar: "seneca", moment: "anytime", depth: "deep", text: "¿Qué parte tuya como emprendedor todavía está esperando permiso?", suggestedArea: "emprendimiento" },
  { id: "se031", pillar: "seneca", moment: "morning", depth: "easy", text: "Una decisión chica de hoy que ahorra horas mañana.", suggestedArea: "emprendimiento" },
  { id: "se032", pillar: "seneca", moment: "morning", depth: "medium", text: "¿Para quién estás trabajando hoy además de ti?", suggestedArea: "emprendimiento" },
  { id: "se033", pillar: "seneca", moment: "evening", depth: "medium", text: "Si pudieras refundar tu día mañana, ¿qué sacarías del calendario?", suggestedArea: "emprendimiento" },
  { id: "se034", pillar: "seneca", moment: "midday", depth: "easy", text: "¿Te estás moviendo o solo agitando?", suggestedArea: "emprendimiento" },
  { id: "se035", pillar: "seneca", moment: "anytime", depth: "deep", text: "Una creencia tuya sobre dinero que viene de tus padres y todavía te limita.", suggestedArea: "finanzas" },
];

/**
 * Prompts post-ausencia. Tono: aliento, cero culpa, retomar como
 * quien retoma una conversación con un amigo. Se sirven cuando el
 * user vuelve después de ≥3 días sin abrir la app.
 */
export const RECOVERY_PROMPTS: JournalPrompt[] = [
  { id: "pa001", moment: "anytime", depth: "easy", text: "Bienvenido de vuelta. ¿Qué cambió en estos días en ti?", suggestedArea: "free" },
  { id: "pa002", moment: "anytime", depth: "easy", text: "Sin contar lo que pasó: ¿cómo estás hoy en una palabra?", suggestedArea: "mentalidad" },
  { id: "pa003", moment: "anytime", depth: "easy", text: "Una cosa pequeña que aprendiste esta semana lejos de acá.", suggestedArea: "free" },
  { id: "pa004", moment: "anytime", depth: "medium", text: "Volver no es empezar. ¿Por dónde te quieres reconectar?", suggestedArea: "free" },
  { id: "pa005", moment: "anytime", depth: "medium", text: "¿Qué necesitas de ti hoy que no necesitabas la semana pasada?", suggestedArea: "mentalidad" },
  { id: "pa006", moment: "anytime", depth: "deep", text: "Dejar de venir también fue información. ¿Qué te dijo?", suggestedArea: "mentalidad" },
  { id: "pa007", moment: "anytime", depth: "easy", text: "Hoy no hace falta ponerse al día. ¿Por dónde quieres arrancar suave?", suggestedArea: "habits" },
  { id: "pa008", moment: "anytime", depth: "easy", text: "Una cosa de hoy que SÍ depende de ti. Empezamos por ahí.", suggestedArea: "habits" },
  { id: "pa009", moment: "anytime", depth: "medium", text: "¿Qué estabas evitando que ya puedes mirar de frente?", suggestedArea: "mentalidad" },
  { id: "pa010", moment: "anytime", depth: "easy", text: "Lo que hiciste o no hiciste no te define. ¿Qué quieres hacer hoy?", suggestedArea: "free" },
];

/**
 * Prompts de celebración. Se sirven cuando el user lleva racha ≥7
 * días o cumple un milestone. Amplifican motivación sin caer en hype.
 */
export const CELEBRATION_PROMPTS: JournalPrompt[] = [
  { id: "cb001", moment: "anytime", depth: "medium", text: "Mira atrás: ¿qué versión tuya empezó esto y qué versión lo está sosteniendo hoy?", suggestedArea: "free" },
  { id: "cb002", moment: "anytime", depth: "deep", text: "¿Qué hábito chico se volvió identidad sin que te dieras cuenta?", suggestedArea: "habits" },
  { id: "cb003", moment: "anytime", depth: "medium", text: "Tres cosas que aprendiste sobre ti en esta racha.", suggestedArea: "free" },
  { id: "cb004", moment: "anytime", depth: "easy", text: "¿Quién necesita escuchar lo que estás aprendiendo? Sin presión.", suggestedArea: "free" },
  { id: "cb005", moment: "anytime", depth: "easy", text: "Una persona del pasado a la que le agradeces hoy.", suggestedArea: "free" },
  { id: "cb006", moment: "anytime", depth: "deep", text: "Lo que lograste no es suerte. ¿Qué decisiones específicas te trajeron acá?", suggestedArea: "habits" },
  { id: "cb007", moment: "anytime", depth: "medium", text: "¿Cuál es el siguiente nivel? Sin urgencia, solo como visión.", suggestedArea: "free" },
  { id: "cb008", moment: "anytime", depth: "easy", text: "Hoy puedes parar 5 minutos y reconocerlo. ¿Cómo quieres celebrar adentro?", suggestedArea: "mentalidad" },
  { id: "cb009", moment: "anytime", depth: "deep", text: "Lo que sostuviste te transformó. ¿Qué vas a sostener en el siguiente capítulo?", suggestedArea: "habits" },
  { id: "cb010", moment: "anytime", depth: "medium", text: "Si esto ya está hecho, ¿qué más es posible para ti ahora?", suggestedArea: "free" },
];

// ─────────────────────────────────────────────────────────────
// V2 GETTERS
// ─────────────────────────────────────────────────────────────

/** Inferir momento del día desde la hora local (0-23). */
export function currentMoment(): DayMoment {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "midday";
  if (h >= 17 && h < 23) return "evening";
  return "anytime";
}

/**
 * Devuelve un prompt post-ausencia. Determinístico por user/día
 * para no flickear si renderiza dos veces.
 */
export function getRecoveryPrompt(seed = 0): JournalPrompt {
  const idx = (dayOfYear() + seed) % RECOVERY_PROMPTS.length;
  return RECOVERY_PROMPTS[(idx + RECOVERY_PROMPTS.length) % RECOVERY_PROMPTS.length];
}

/** Devuelve un prompt celebratorio. */
export function getCelebrationPrompt(seed = 0): JournalPrompt {
  const idx = (dayOfYear() + seed) % CELEBRATION_PROMPTS.length;
  return CELEBRATION_PROMPTS[(idx + CELEBRATION_PROMPTS.length) % CELEBRATION_PROMPTS.length];
}

/**
 * Devuelve un prompt filtrado por pilar y opcionalmente por momento.
 * Usado por las páginas de cada pilar (Hábitos / Finanzas / etc.)
 * para ofrecer reflexión en contexto.
 */
export function getPromptByPillar(
  pillar: StoicPillar,
  moment?: DayMoment,
  seed = 0
): JournalPrompt {
  const filtered = STOIC_PILLAR_PROMPTS.filter(
    (p) =>
      p.pillar === pillar &&
      (moment ? p.moment === moment || p.moment === "anytime" : true)
  );
  if (filtered.length === 0) {
    return getDailyJournalPrompt(seed);
  }
  const idx = (dayOfYear() + seed) % filtered.length;
  return filtered[(idx + filtered.length) % filtered.length];
}

/**
 * Devuelve TODOS los prompts (V1 + V2) para algoritmos que iteran.
 */
export function allPrompts(): JournalPrompt[] {
  return [
    ...JOURNAL_PROMPTS,
    ...MOOD_PROMPTS,
    ...STOIC_PILLAR_PROMPTS,
    ...RECOVERY_PROMPTS,
    ...CELEBRATION_PROMPTS,
  ];
}
