/**
 * Patrones de respiración pre-configurados.
 *
 * Cada patrón es una secuencia de fases. Cada fase: tipo + duración
 * en segundos. Los segundos pueden ser fraccionarios (5.5 para
 * coherent breathing).
 */

export type BreathPhaseKind = "inhale" | "hold-in" | "exhale" | "hold-out";

export type BreathPhase = {
  kind: BreathPhaseKind;
  seconds: number;
};

export type BreathPattern = {
  id: string;
  name: string;
  /** Descripción corta una línea. */
  short: string;
  /** Descripción larga ~2-3 líneas explicando origen y uso. */
  long: string;
  /** Fuente o autor del patrón. */
  source?: string;
  /** Una vuelta = ciclo. */
  cycle: BreathPhase[];
  /** Sugerencia de ciclos a hacer. UI lo usa como default; user puede ajustar. */
  defaultCycles: number;
  /** Color del acento durante la sesión (mantiene branding del módulo). */
  tone: "calm" | "focus" | "energy";
};

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: "4-7-8",
    name: "4 · 7 · 8",
    short: "Calma profunda · sueño",
    long: "Inhala 4s, retén 7s, exhala 8s. Ralentiza el pulso, ideal antes de dormir o cuando la ansiedad se dispara.",
    source: "Dr. Andrew Weil",
    cycle: [
      { kind: "inhale", seconds: 4 },
      { kind: "hold-in", seconds: 7 },
      { kind: "exhale", seconds: 8 },
    ],
    defaultCycles: 4,
    tone: "calm",
  },
  {
    id: "box-4444",
    name: "Caja · 4·4·4·4",
    short: "Equilibrio · enfoque bajo presión",
    long: "Inhala 4s, retén 4s, exhala 4s, retén vacío 4s. Usado por SEALs antes de operaciones — cuando necesitas pensar claro y seguir tu pulso.",
    source: "Box breathing · militar/clínico",
    cycle: [
      { kind: "inhale", seconds: 4 },
      { kind: "hold-in", seconds: 4 },
      { kind: "exhale", seconds: 4 },
      { kind: "hold-out", seconds: 4 },
    ],
    defaultCycles: 5,
    tone: "focus",
  },
  {
    id: "coherent-55",
    name: "Coherente · 5.5",
    short: "Variabilidad cardiaca · presencia",
    long: "Inhala 5.5s, exhala 5.5s. ~5.5 respiraciones/min. Maximiza HRV — el ritmo natural de coherencia entre corazón y cerebro.",
    source: "HeartMath / James Nestor",
    cycle: [
      { kind: "inhale", seconds: 5.5 },
      { kind: "exhale", seconds: 5.5 },
    ],
    defaultCycles: 11, // ~ 2 min
    tone: "calm",
  },
  {
    id: "wim-hof-mini",
    name: "Wim Hof · mini",
    short: "Energía · activación",
    long: "30 inhalaciones rápidas (1.5s in / 1.5s out) seguidas de retención larga (60-90s). Versión simplificada de Wim Hof — usada de mañana o antes de un esfuerzo.",
    source: "Wim Hof method",
    cycle: [
      { kind: "inhale", seconds: 1.5 },
      { kind: "exhale", seconds: 1.5 },
    ],
    defaultCycles: 30,
    tone: "energy",
  },
  {
    id: "physio-sigh",
    name: "Suspiro fisiológico",
    short: "Reset rápido · 1 minuto",
    long: "Doble inhalación rápida + exhalación larga. Fastest known way to lower stress in studies — 5 a 10 repeticiones bastan.",
    source: "Andrew Huberman / Stanford",
    cycle: [
      { kind: "inhale", seconds: 2 },
      { kind: "inhale", seconds: 1 }, // segunda inhalación corta
      { kind: "exhale", seconds: 6 },
    ],
    defaultCycles: 8,
    tone: "calm",
  },
];

export function getPatternById(id: string): BreathPattern | undefined {
  return BREATH_PATTERNS.find((p) => p.id === id);
}

export function phaseLabel(kind: BreathPhaseKind): string {
  switch (kind) {
    case "inhale":
      return "Inhala";
    case "hold-in":
      return "Mantén";
    case "exhale":
      return "Exhala";
    case "hold-out":
      return "Vacío";
  }
}

export function totalCycleDuration(p: BreathPattern): number {
  return p.cycle.reduce((a, ph) => a + ph.seconds, 0);
}

export function totalSessionDuration(p: BreathPattern, cycles: number): number {
  return totalCycleDuration(p) * cycles;
}
