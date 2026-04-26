/**
 * Ikigai (生き甲斐) — "razón de ser" en japonés.
 *
 * Se forma en la intersección de 4 círculos:
 *   1. Lo que AMAS (passion)
 *   2. Lo que SE TE DA BIEN (vocation)
 *   3. Lo que el MUNDO NECESITA (mission)
 *   4. Por lo que TE PUEDEN PAGAR (profession)
 *
 * Una idea de negocio tiene tracción real cuando los 4 anclan.
 * Si flojea uno, te dice qué área investigar más.
 *
 * El score numérico (1-5) es subjetivo del usuario. La utilidad
 * NO es ranquear ideas absolutas — es darle al user un mapa
 * mental de qué eje cojea.
 */

export type IkigaiAxis = "love" | "good_at" | "needed" | "paid_for";

export type IkigaiAxisMeta = {
  key: IkigaiAxis;
  label: string;
  question: string;
  emoji: string;
  /** Color hex para visualización. */
  color: string;
  /** Diagnóstico cuando el axis es alto. */
  whenHigh: string;
  /** Diagnóstico cuando el axis es bajo (1-2). */
  whenLow: string;
};

export const IKIGAI_AXES: IkigaiAxisMeta[] = [
  {
    key: "love",
    label: "Lo que amas",
    question: "¿Cuánto te apasiona esta idea? ¿La harías sin paga?",
    emoji: "❤️",
    color: "#DC2626",
    whenHigh: "Es tu fuego. Combustible para los días duros.",
    whenLow: "Si no te emociona, no vas a sostenerlo. Considera por qué.",
  },
  {
    key: "good_at",
    label: "En lo que eres bueno",
    question: "¿Qué tan competente eres ya — o cuán rápido lo serías?",
    emoji: "🛠️",
    color: "#0EA5E9",
    whenHigh: "Tu ventaja injusta. Aprovéchala.",
    whenLow: "Necesitarás practicar mucho — o asociarte con quien lo sea.",
  },
  {
    key: "needed",
    label: "Lo que el mundo necesita",
    question: "¿Resuelve un problema real para gente real?",
    emoji: "🌍",
    color: "#22774E",
    whenHigh: "Hay demanda. La pregunta es cómo llegas a ellos.",
    whenLow: "¿Estás creando algo que sólo tú quieres? Valida con desconocidos.",
  },
  {
    key: "paid_for",
    label: "Por lo que pagan",
    question: "¿Hay alguien dispuesto a pagar por esto, hoy?",
    emoji: "💰",
    color: "#CA8A04",
    whenHigh: "Mercado activo. Empieza a vender, no a planear.",
    whenLow: "Pasión sin pago = hobby. Investiga el modelo de monetización.",
  },
];

export type IkigaiScores = Record<IkigaiAxis, number | null>;

export const EMPTY_IKIGAI: IkigaiScores = {
  love: null,
  good_at: null,
  needed: null,
  paid_for: null,
};

/**
 * Computa un score combinado (0-100). Sólo cuenta los axes con
 * número — los nulls no penalizan, así el user puede saltarlos.
 */
export function ikigaiOverallScore(scores: IkigaiScores): {
  score: number;
  filledAxes: number;
  weakest: IkigaiAxis | null;
} {
  const entries = (Object.entries(scores) as [IkigaiAxis, number | null][])
    .filter(([, v]) => v !== null);
  if (entries.length === 0) {
    return { score: 0, filledAxes: 0, weakest: null };
  }
  const sum = entries.reduce((s, [, v]) => s + (v as number), 0);
  const score = Math.round((sum / (entries.length * 5)) * 100);
  // El weakest es el de menor valor entre los respondidos.
  let weakest: IkigaiAxis | null = null;
  let min = Infinity;
  for (const [k, v] of entries) {
    if ((v as number) < min) {
      min = v as number;
      weakest = k;
    }
  }
  return { score, filledAxes: entries.length, weakest };
}

/**
 * Diagnóstico cualitativo agregado.
 */
export function ikigaiDiagnosis(scores: IkigaiScores): string {
  const { score, filledAxes, weakest } = ikigaiOverallScore(scores);
  if (filledAxes < 4) {
    return "Responde los 4 ejes para ver el diagnóstico completo.";
  }
  if (score >= 80) {
    return "Tu idea anida en los 4 ejes. Es señal de tracción real — empieza pequeño y mide.";
  }
  if (score >= 60) {
    const axis = IKIGAI_AXES.find((a) => a.key === weakest);
    return `Buena base. El eje más débil: ${axis?.label.toLowerCase()}. ${axis?.whenLow}`;
  }
  if (score >= 40) {
    return "La idea tiene puntos fuertes pero también huecos grandes. Considera pivotar antes de invertir tiempo.";
  }
  return "Esta idea cojea en lo esencial. Quizá vale más como hobby — o pivota a algo donde tu conocimiento brille.";
}
