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
