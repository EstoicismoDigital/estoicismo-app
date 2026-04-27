/**
 * Catálogos estáticos del módulo Mentalidad.
 * Viven en código (no en DB) porque son contenido curado que no cambia
 * por usuario y evoluciona con releases.
 *
 * Fuentes:
 *  - Napoleón Hill — Piense y Hágase Rico (los 13 principios + la
 *    fórmula de seis pasos del capítulo 2).
 *  - Joe Dispenza — Romper el hábito de ser uno mismo / Deja de ser tú
 *    (tipos de meditación, intenciones, coherencia corazón-cerebro).
 *  - Solfeggio ancestral + binaurales modernos (mapa de frecuencias).
 */

// ─────────────────────────────────────────────────────────────
// NAPOLEÓN HILL — 6 pasos del MPD (Piense y Hágase Rico, cap. 2)
// ─────────────────────────────────────────────────────────────

export type HillStep = {
  n: number;
  title: string;
  prompt: string;
  hint: string;
};

export const HILL_SIX_STEPS: HillStep[] = [
  {
    n: 1,
    title: "Fija la cantidad exacta",
    prompt:
      "Sé absolutamente específico con lo que quieres. Si es dinero, una cifra exacta. Si es una posición, el cargo y la empresa. Si es algo material, marca y modelo. El subconsciente solo trabaja con metas concretas — no entiende «más» ni «mejor».",
    hint: "«Dinero suficiente» no basta. «$500,000 USD», sí. «Un mejor empleo», no. «Director de Marketing en una empresa de software», sí. Mientras más exacto, más fuerte la orden que envías a tu mente.",
  },
  {
    n: 2,
    title: "Qué darás a cambio",
    prompt:
      "Decide qué vas a entregar tú al mundo para recibir eso que pides. Hill llamaba a esto «la ley del intercambio justo»: nada llega gratis. Puede ser tu tiempo, conocimiento, servicio, esfuerzo creativo, dedicación. Si no defines qué das, te quedas esperando.",
    hint: "Si pides $500K, ¿qué servicio, producto o trabajo de ese valor vas a entregar? Esto te aterriza: te obliga a pensar en valor real, no solo en deseo.",
  },
  {
    n: 3,
    title: "Fecha límite",
    prompt:
      "Pon una fecha exacta — día, mes y año — para tener lo que pediste. Sin fecha, el deseo se vuelve fantasía. La fecha le da al cerebro un horizonte que activa la urgencia y empieza a buscar caminos. Sé ambicioso pero realista.",
    hint: "Ejemplo: «Para el 31 de diciembre de 2027 tendré $500K USD ahorrados.» Mejor una fecha equivocada por meses que ninguna fecha. Puedes ajustarla después si necesitas, pero comienza con una.",
  },
  {
    n: 4,
    title: "Un plan concreto",
    prompt:
      "Define los primeros pasos. No tienes que tener el plan completo — Hill insistía en que la mayoría no lo tiene al inicio. Lo importante es empezar a moverte hoy con lo que sí sabes. El plan se afina caminando, no sentado pensando.",
    hint: "Escribe 3-5 acciones que puedes hacer este mes. Ejemplo: «contactar a 10 clientes potenciales por semana», «aprender X habilidad en 90 días», «crear este producto antes de junio». Acción imperfecta vence planeación perfecta.",
  },
  {
    n: 5,
    title: "Declaración escrita",
    prompt:
      "Junta los 4 pasos anteriores en una sola frase clara y poderosa, en presente como si ya fuera tuya. Esta declaración es el contrato contigo mismo. Hill consideraba este paso como el «núcleo» del método: convierte el deseo en una orden formal a tu subconsciente.",
    hint: "Plantilla: «Para [fecha] tendré [cifra/meta]. A cambio entregaré [servicio/valor]. Mi plan es [acciones].» Léela cada mañana y cada noche. Repetir esa frase reprograma tu mente para detectar oportunidades alineadas.",
  },
  {
    n: 6,
    title: "Lee y siente",
    prompt:
      "Lee tu declaración en voz alta dos veces al día — al despertar y antes de dormir — y mientras la lees, siente que ya la lograste. Esto es autosugestión: el subconsciente no distingue entre lo que vives y lo que imaginas con emoción intensa. La emoción es lo que graba la orden.",
    hint: "No basta leer mecánicamente. Cierra los ojos, visualiza el momento de tener eso que pides, siente la emoción de tenerlo ya. Hazlo 5-10 minutos. La fe no es creer que pasará — es vivirlo como si ya hubiese pasado, todos los días, hasta que sea real.",
  },
];

export const HILL_PRINCIPLES: { key: string; label: string; summary: string }[] = [
  { key: "deseo", label: "Deseo", summary: "El punto de partida de todo logro." },
  { key: "fe", label: "Fe", summary: "Visualización y creencia en el logro del deseo." },
  { key: "autosugestion", label: "Autosugestión", summary: "Medio para influir en el subconsciente." },
  { key: "conocimiento", label: "Conocimiento especializado", summary: "Experiencias personales u observadas." },
  { key: "imaginacion", label: "Imaginación", summary: "Taller de la mente." },
  { key: "planificacion", label: "Planificación organizada", summary: "Cristalización del deseo en acción." },
  { key: "decision", label: "Decisión", summary: "Dominio de la postergación." },
  { key: "persistencia", label: "Persistencia", summary: "Esfuerzo sostenido necesario para inducir fe." },
  { key: "mastermind", label: "Mente maestra", summary: "Poder de la cooperación estratégica." },
  { key: "energia-sexual", label: "Transmutación sexual", summary: "Canalización de la energía creativa." },
  { key: "subconsciente", label: "Mente subconsciente", summary: "El eslabón con la inteligencia infinita." },
  { key: "cerebro", label: "El cerebro", summary: "Estación emisora y receptora del pensamiento." },
  { key: "sexto-sentido", label: "Sexto sentido", summary: "La puerta al templo de la sabiduría." },
];

// Quotes rotativas — visibles en cabecera y en el check-in diario.
export const HILL_QUOTES: { text: string; author: string }[] = [
  { text: "Todo lo que la mente humana puede concebir y creer, lo puede lograr.", author: "Napoleón Hill" },
  { text: "La persistencia es al carácter lo que el carbono al acero.", author: "Napoleón Hill" },
  { text: "La fuerza de una idea reside en el deseo ardiente de quien la sostiene.", author: "Napoleón Hill" },
  { text: "Los pensamientos son cosas, y poderosas cuando se mezclan con propósito definido.", author: "Napoleón Hill" },
  { text: "La derrota es temporal; rendirse es lo que la vuelve permanente.", author: "Napoleón Hill" },
  { text: "No se puede obtener algo a cambio de nada.", author: "Napoleón Hill" },
  { text: "Aplaza la decisión y la oportunidad pasará.", author: "Napoleón Hill" },
  { text: "Lo que se puede medir, se puede lograr.", author: "Napoleón Hill" },
];

// ─────────────────────────────────────────────────────────────
// JOE DISPENZA — tipos de meditación + prompts de intención
// ─────────────────────────────────────────────────────────────

export type MeditationTypeInfo = {
  key:
    | "coherencia"
    | "romper-habito"
    | "ser-nuevo-yo"
    | "gratitud"
    | "vision"
    | "respiracion";
  label: string;
  summary: string;
  /** Guía breve (leída al comenzar). */
  steps: string[];
  /** Duración recomendada en minutos. */
  defaultMinutes: number;
};

export const MEDITATION_TYPES: MeditationTypeInfo[] = [
  {
    key: "coherencia",
    label: "Coherencia corazón-cerebro",
    summary:
      "Centra tu atención en el corazón. Respira hacia él. Siente gratitud elevada hasta que las ondas se alineen.",
    steps: [
      "Cierra los ojos y relaja los hombros.",
      "Lleva la atención al centro del pecho.",
      "Respira lento: 5s dentro, 5s fuera.",
      "Evoca un recuerdo de gratitud o amor profundo.",
      "Sostén la sensación hasta que sientas calma expandirse.",
    ],
    defaultMinutes: 10,
  },
  {
    key: "romper-habito",
    label: "Romper el hábito de ser tú",
    summary:
      "Observa sin juzgar los pensamientos y emociones que te definen. Desidentifícate de ellos y elige de nuevo.",
    steps: [
      "Siéntate con la espalda recta. Cierra los ojos.",
      "Vuélvete nadie, nada, en ningún lugar, en ningún tiempo.",
      "Observa qué pensamiento repite la mente.",
      "Nómbralo y suéltalo sin apego.",
      "Elige conscientemente quién quieres ser hoy.",
    ],
    defaultMinutes: 20,
  },
  {
    key: "ser-nuevo-yo",
    label: "Crear al nuevo yo",
    summary:
      "Ensaya mentalmente a la persona que quieres ser. Visualízala actuar hasta que tu cuerpo lo crea real.",
    steps: [
      "Visualiza un día ideal viviendo desde tu nuevo yo.",
      "Mira cómo caminas, hablas, decides.",
      "Siente las emociones que traería ese día: paz, confianza, abundancia.",
      "Firma el compromiso interior: así es como vivo hoy.",
    ],
    defaultMinutes: 15,
  },
  {
    key: "gratitud",
    label: "Gratitud expandida",
    summary:
      "Entra en el estado emocional elevado de gratitud antes de pedir. La gratitud es la señal de recepción.",
    steps: [
      "Haz una lista mental de tres cosas por las que estás agradecido.",
      "Elige una y profundiza hasta sentirla en el pecho.",
      "Expande esa sensación al resto del cuerpo.",
      "Respira desde ahí durante el resto de la sesión.",
    ],
    defaultMinutes: 8,
  },
  {
    key: "vision",
    label: "Visión de futuro",
    summary:
      "Entra en la escena del futuro que deseas. Véelo, escúchalo, siéntelo como si ya ocurriera.",
    steps: [
      "Cierra los ojos y recrea la escena clave de tu futuro.",
      "Nota tres detalles sensoriales concretos.",
      "Escucha una conversación que ocurriría ahí.",
      "Siente el logro en el cuerpo, no en la cabeza.",
    ],
    defaultMinutes: 12,
  },
  {
    key: "respiracion",
    label: "Respiración inductiva",
    summary:
      "Respiración larga y sostenida que activa el nervio vago. Base para entrar en meditación profunda.",
    steps: [
      "Inhala 4s por la nariz.",
      "Sostén 4s arriba.",
      "Exhala 6s por la boca suave.",
      "Sostén 2s abajo.",
      "Repite ciclos sin forzar; el cuerpo se irá quedando quieto.",
    ],
    defaultMinutes: 5,
  },
];

/**
 * Intenciones sugeridas — mezcla de Joe Dispenza (coherencia,
 * energía elevada, romper identidad) con el lenguaje de
 * "Cartas al Universo" (manifestación, rendición, desprendimiento
 * del ego, reconexión con la esencia).
 *
 * La persona elige una o la reescribe. Funcionan también como
 * semillas si la mente se queda en blanco ante la hoja vacía.
 */
export const DISPENZA_INTENTIONS: string[] = [
  // Desprendimiento del ego · soltar
  "Soltar quien creía ser.",
  "Liberarme del peso del pasado.",
  "Dejar de ensayar mi antigua identidad.",
  "Desprenderme de lo que ya no soy.",
  "Rendirme al flujo mayor.",

  // Consciencia elevada · presencia
  "Elevar mi vibración al universo.",
  "Entrar en coherencia con lo que deseo.",
  "Elegir conscientemente mi día.",
  "Ver más allá del ego.",
  "Despertar la luz que soy.",

  // Crecimiento · manifestación · co-creación
  "Co-crear con la vida.",
  "Sembrar hoy la semilla de mi deseo.",
  "Escribir mi carta al universo.",
  "Agradecer antes de tenerlo.",
  "Abrir mi corazón al misterio.",
  "Recordar mi esencia infinita.",
];

// ─────────────────────────────────────────────────────────────
// AURA — mapa de frecuencias sonoras
// ─────────────────────────────────────────────────────────────

export type FrequencyCategory =
  | "concentracion"
  | "meditacion"
  | "relajacion"
  | "enfoque"
  | "sanacion"
  | "sueno"
  | "creatividad";

export type FrequencyPreset = {
  key: string;
  label: string;
  hz: number;
  /** Categoría primaria para filtros. */
  category: FrequencyCategory;
  /** Origen: solfeggio antigua, binaural moderna, schumann, etc. */
  origin: "solfeggio" | "binaural" | "schumann" | "otra";
  /** 1-2 líneas — para qué se usa tradicionalmente. */
  summary: string;
  /** Ondas cerebrales asociadas (si aplica). */
  brainwave?: "delta" | "theta" | "alpha" | "beta" | "gamma";
  /**
   * Marca las frecuencias curadas explícitamente para meditación
   * profunda y acceso a estados alterados de consciencia.
   * Usadas como fondo opcional en /reflexiones/meditacion.
   */
  meditationCurated?: boolean;
};

export const FREQUENCY_PRESETS: FrequencyPreset[] = [
  // ─────────────────────────────────────────────────────────────
  // Solfeggio — escala de nueve tonos ancestrales.
  // ─────────────────────────────────────────────────────────────
  { key: "174", label: "174 Hz", hz: 174, category: "sanacion", origin: "solfeggio",
    summary: "Alivio del dolor y la tensión — la más grave de la escala Solfeggio." },
  { key: "285", label: "285 Hz", hz: 285, category: "sanacion", origin: "solfeggio",
    summary: "Regeneración celular y recuperación física." },
  { key: "396", label: "396 Hz", hz: 396, category: "relajacion", origin: "solfeggio",
    summary: "Liberar miedo y culpa, volver a la tierra." },
  { key: "417", label: "417 Hz", hz: 417, category: "creatividad", origin: "solfeggio",
    summary: "Facilitar el cambio y deshacer patrones antiguos." },
  { key: "432", label: "432 Hz", hz: 432, category: "meditacion", origin: "otra",
    summary: "Afinación natural — sensación de apertura, amplitud y coherencia cardíaca.",
    meditationCurated: true },
  { key: "528", label: "528 Hz", hz: 528, category: "sanacion", origin: "solfeggio",
    summary: "La frecuencia del amor — reparación celular y transformación profunda.",
    meditationCurated: true },
  { key: "639", label: "639 Hz", hz: 639, category: "relajacion", origin: "solfeggio",
    summary: "Conexión y armonía en relaciones." },
  { key: "741", label: "741 Hz", hz: 741, category: "enfoque", origin: "solfeggio",
    summary: "Despertar la intuición y resolver problemas." },
  { key: "852", label: "852 Hz", hz: 852, category: "meditacion", origin: "solfeggio",
    summary: "Retorno al orden espiritual — abre el tercer ojo y eleva la percepción.",
    meditationCurated: true },
  { key: "963", label: "963 Hz", hz: 963, category: "meditacion", origin: "solfeggio",
    summary: "Conexión con la unidad — activa la glándula pineal y disuelve el ego.",
    meditationCurated: true },

  // ─────────────────────────────────────────────────────────────
  // Binaurales — sintetizadas mono como tono puro. Cada onda cerebral
  // corresponde a un estado neurofisiológico documentado en EEG.
  // ─────────────────────────────────────────────────────────────
  { key: "delta-2", label: "Delta 2 Hz", hz: 2, category: "sueno", origin: "binaural",
    summary: "Ondas delta — sueño profundo y reparación celular.", brainwave: "delta" },
  { key: "theta-4", label: "Theta 4 Hz", hz: 4, category: "meditacion", origin: "binaural",
    summary: "Umbral theta profundo — entrada al trance meditativo e inconsciente.",
    brainwave: "theta", meditationCurated: true },
  { key: "theta-5", label: "Theta 5 Hz", hz: 5, category: "meditacion", origin: "binaural",
    summary: "Ritmo chamánico clásico — viajes internos y expansión de consciencia.",
    brainwave: "theta", meditationCurated: true },
  { key: "theta-6", label: "Theta 6 Hz", hz: 6, category: "meditacion", origin: "binaural",
    summary: "Estado meditativo profundo con alta creatividad y acceso a la memoria emocional.",
    brainwave: "theta", meditationCurated: true },
  { key: "theta-7", label: "Theta 7 Hz", hz: 7, category: "meditacion", origin: "binaural",
    summary: "Zona hipnagógica — frontera entre vigilia y sueño, ideal para visión interior.",
    brainwave: "theta", meditationCurated: true },
  { key: "alpha-8", label: "Alpha 8 Hz", hz: 8, category: "meditacion", origin: "binaural",
    summary: "Primer armónico Schumann — consciencia relajada, presencia expandida.",
    brainwave: "alpha", meditationCurated: true },
  { key: "alpha-10", label: "Alpha 10 Hz", hz: 10, category: "relajacion", origin: "binaural",
    summary: "Relajación atenta, flujo ligero.", brainwave: "alpha" },
  { key: "beta-14", label: "Beta 14 Hz", hz: 14, category: "concentracion", origin: "binaural",
    summary: "Atención sostenida, trabajo analítico.", brainwave: "beta" },
  { key: "beta-20", label: "Beta 20 Hz", hz: 20, category: "enfoque", origin: "binaural",
    summary: "Enfoque duro, resolver problemas difíciles.", brainwave: "beta" },
  { key: "gamma-40", label: "Gamma 40 Hz", hz: 40, category: "meditacion", origin: "binaural",
    summary: "Ritmo gamma de meditadores avanzados — unifica consciencia y amplifica insight.",
    brainwave: "gamma", meditationCurated: true },

  // ─────────────────────────────────────────────────────────────
  // Frecuencias puntuales documentadas para estados alterados.
  // ─────────────────────────────────────────────────────────────
  { key: "schumann-7_83", label: "Schumann 7.83 Hz", hz: 7.83, category: "meditacion", origin: "schumann",
    summary: "Pulso electromagnético natural de la Tierra — presencia, arraigo y coherencia.",
    meditationCurated: true },
  { key: "om-136", label: "OM 136.1 Hz", hz: 136.1, category: "meditacion", origin: "otra",
    summary: "Tono del OM cósmico — resonancia del año terrestre y afinación del tercer ojo.",
    meditationCurated: true },
  { key: "hypogeum-110", label: "Hypogeum 110 Hz", hz: 110, category: "meditacion", origin: "otra",
    summary: "Resonancia de templos ancestrales — induce estado alterado espontáneo.",
    meditationCurated: true },
];

export const FREQUENCY_CATEGORY_LABELS: Record<FrequencyCategory, string> = {
  concentracion: "Concentración",
  enfoque: "Enfoque",
  meditacion: "Meditación",
  relajacion: "Relajación",
  sanacion: "Sanación",
  sueno: "Sueño",
  creatividad: "Creatividad",
};

export function groupFrequenciesByCategory(): Record<FrequencyCategory, FrequencyPreset[]> {
  const out = {
    concentracion: [],
    enfoque: [],
    meditacion: [],
    relajacion: [],
    sanacion: [],
    sueno: [],
    creatividad: [],
  } as Record<FrequencyCategory, FrequencyPreset[]>;
  for (const f of FREQUENCY_PRESETS) out[f.category].push(f);
  return out;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Selecciona la cita de Hill del día de forma determinista. */
export function getDailyHillQuote(date = new Date()): { text: string; author: string } {
  const day = Math.floor(date.getTime() / 86_400_000);
  return HILL_QUOTES[day % HILL_QUOTES.length];
}

/**
 * Subconjunto curado de frecuencias explícitamente usadas para
 * meditación profunda y estados alterados de consciencia. Ordenado
 * por Hz ascendente para facilitar la lectura (de delta a las
 * portadoras más altas).
 */
export const MEDITATION_FREQUENCIES: FrequencyPreset[] = FREQUENCY_PRESETS
  .filter((f) => f.meditationCurated)
  .sort((a, b) => a.hz - b.hz);
