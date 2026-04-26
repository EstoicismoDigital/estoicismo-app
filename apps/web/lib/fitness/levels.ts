/**
 * Sistema de niveles griegos para fitness.
 *
 * Convertimos la carga de un set en un "1RM estimado" usando la
 * fórmula de Epley: 1RM = peso × (1 + reps/30). Luego dividimos por
 * el peso corporal del usuario para obtener un ratio (excepto para
 * "reps_only" donde usamos las reps absolutas).
 *
 * El ratio se contrasta con thresholds específicos por ejercicio
 * (los Big 4 tienen escalas distintas — un deadlift 2× bw es Apolo,
 * un bench 2× bw es Titán). El nivel global del usuario es el
 * promedio ponderado de los lifts principales que ha entrenado.
 *
 * Inspirado en strengthlevel.com pero con nombres mitológicos para
 * darle un toque del branding "Estoicismo / Mentalidad griega" del
 * resto de la app.
 *
 * Los niveles NO viven en DB — todo se deriva en cliente sobre los
 * sets brutos, así puedo calibrar las thresholds sin migración.
 */

export type LevelKey =
  | "mortal"
  | "perseo"
  | "heracles"
  | "apolo"
  | "atlas"
  | "titan"
  | "zeus"
  | "olimpo-i"
  | "olimpo-ii"
  | "olimpo-iii";

export type Level = {
  key: LevelKey;
  /** Nombre mostrado al usuario. */
  name: string;
  /** Pequeña descripción / lore. */
  lore: string;
  /** Color asociado (hex). */
  color: string;
  /** Emoji para tarjetas / chips compactos. */
  emoji: string;
  /** Posición en la escala — 0=mortal, 9=olimpo-iii. */
  rank: number;
};

export const LEVELS: Level[] = [
  {
    key: "mortal",
    name: "Mortal",
    lore: "Antes de la ascensión. La constancia abre el camino.",
    color: "#9CA3AF",
    emoji: "·",
    rank: 0,
  },
  {
    key: "perseo",
    name: "Perseo",
    lore: "El héroe novato. Cortaste tu primera Medusa.",
    color: "#CA8A04",
    emoji: "🛡️",
    rank: 1,
  },
  {
    key: "heracles",
    name: "Heracles",
    lore: "Los doce trabajos te forjaron. Fuerza honesta.",
    color: "#B45309",
    emoji: "🦁",
    rank: 2,
  },
  {
    key: "apolo",
    name: "Apolo",
    lore: "Cuerpo y arte. Maestría que se ve y se siente.",
    color: "#D97706",
    emoji: "☀️",
    rank: 3,
  },
  {
    key: "atlas",
    name: "Atlas",
    lore: "Cargas el mundo en los hombros. La fuerza existe en ti.",
    color: "#7C2D12",
    emoji: "🌍",
    rank: 4,
  },
  {
    key: "titan",
    name: "Titán",
    lore: "Antes que los dioses, fuiste tú. Estructura primordial.",
    color: "#581C87",
    emoji: "⚒️",
    rank: 5,
  },
  {
    key: "zeus",
    name: "Zeus",
    lore: "El rayo. El trono. La fuerza máxima entre lo humano.",
    color: "#1E40AF",
    emoji: "⚡",
    rank: 6,
  },
  {
    key: "olimpo-i",
    name: "Olimpo I",
    lore: "Has cruzado al panteón. Caminas con los inmortales.",
    color: "#0369A1",
    emoji: "🏛️",
    rank: 7,
  },
  {
    key: "olimpo-ii",
    name: "Olimpo II",
    lore: "Tu disciplina escribe leyendas.",
    color: "#0E7490",
    emoji: "🌌",
    rank: 8,
  },
  {
    key: "olimpo-iii",
    name: "Olimpo III",
    lore: "Mítico. Pocos llegan. La gloria es la consecuencia.",
    color: "#0F766E",
    emoji: "✨",
    rank: 9,
  },
];

export function getLevelByKey(key: LevelKey): Level {
  return LEVELS.find((l) => l.key === key) ?? LEVELS[0];
}

export function getLevelByRank(rank: number): Level {
  const r = Math.max(0, Math.min(LEVELS.length - 1, Math.floor(rank)));
  return LEVELS[r];
}

/** Ratios bw para cada lift principal — limites superiores por nivel. */
type Threshold = {
  /** Mortal hasta este ratio (incluido). */
  mortal: number;
  perseo: number;
  heracles: number;
  apolo: number;
  atlas: number;
  titan: number;
  zeus: number;
  /** Sobre zeus, cada +0.5 ratio = un olimpo. */
  olimpoStep: number;
};

/**
 * Thresholds por slug de ejercicio. Si tu peso corporal es 80kg y
 * tu mejor squat es 160kg → ratio = 2.0 → Atlas.
 *
 * Calibradas combinando strengthlevel.com (intermediate / advanced
 * thresholds) con el espíritu mitológico (Zeus = lo más alto humano
 * pero alcanzable).
 */
const LIFT_THRESHOLDS: Record<string, Threshold> = {
  squat: {
    mortal: 0.5,
    perseo: 1.0,
    heracles: 1.5,
    apolo: 2.0,
    atlas: 2.5,
    titan: 3.0,
    zeus: 3.5,
    olimpoStep: 0.5,
  },
  "bench-press": {
    mortal: 0.5,
    perseo: 0.75,
    heracles: 1.0,
    apolo: 1.5,
    atlas: 2.0,
    titan: 2.5,
    zeus: 3.0,
    olimpoStep: 0.5,
  },
  deadlift: {
    mortal: 0.75,
    perseo: 1.25,
    heracles: 1.75,
    apolo: 2.25,
    atlas: 2.75,
    titan: 3.5,
    zeus: 4.0,
    olimpoStep: 0.5,
  },
  "overhead-press": {
    mortal: 0.3,
    perseo: 0.5,
    heracles: 0.75,
    apolo: 1.0,
    atlas: 1.25,
    titan: 1.5,
    zeus: 1.75,
    olimpoStep: 0.25,
  },
};

/** Para reps_only (pull-ups), thresholds en repeticiones absolutas. */
const REPS_ONLY_THRESHOLDS: Record<string, Threshold> = {
  "pull-ups": {
    mortal: 1,
    perseo: 5,
    heracles: 10,
    apolo: 15,
    atlas: 20,
    titan: 25,
    zeus: 30,
    olimpoStep: 5,
  },
};

/**
 * Estima 1RM (one-rep-max) con la fórmula de Epley.
 *
 * 1RM ≈ peso × (1 + reps/30)
 *
 * Sólo válida para reps ≤ 12 — fuera de ese rango la fórmula
 * sobrestima brutalmente, así que devolvemos NaN para señalar
 * "no válido".
 */
export function estimate1RM(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return NaN;
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps > 12) return NaN;
  return weight * (1 + reps / 30);
}

function thresholdToLevel(value: number, t: Threshold): Level {
  if (value < t.mortal) return getLevelByKey("mortal");
  if (value < t.perseo) return getLevelByKey("perseo");
  if (value < t.heracles) return getLevelByKey("heracles");
  if (value < t.apolo) return getLevelByKey("apolo");
  if (value < t.atlas) return getLevelByKey("atlas");
  if (value < t.titan) return getLevelByKey("titan");
  if (value < t.zeus) return getLevelByKey("zeus");
  // Sobre Zeus: mide cuántos pasos olimpoStep encajan.
  const overZeus = value - t.zeus;
  const olimpoLevel = Math.floor(overZeus / t.olimpoStep);
  if (olimpoLevel <= 0) return getLevelByKey("olimpo-i");
  if (olimpoLevel === 1) return getLevelByKey("olimpo-ii");
  return getLevelByKey("olimpo-iii");
}

/** Computa el siguiente nivel adyacente, para barra de progreso. */
export function nextLevelTarget(
  exerciseSlug: string,
  measurement: "weight_reps" | "reps_only" | "duration",
  bodyweightKg: number | null
): { next: Level; valueNeeded: number; unit: string } | null {
  const t =
    measurement === "weight_reps"
      ? LIFT_THRESHOLDS[exerciseSlug]
      : measurement === "reps_only"
      ? REPS_ONLY_THRESHOLDS[exerciseSlug]
      : null;
  if (!t) return null;

  // Sin bw no podemos calcular el target en kg para weight_reps.
  if (measurement === "weight_reps" && (!bodyweightKg || bodyweightKg <= 0)) {
    return null;
  }

  const orderedKeys: LevelKey[] = [
    "mortal",
    "perseo",
    "heracles",
    "apolo",
    "atlas",
    "titan",
    "zeus",
    "olimpo-i",
    "olimpo-ii",
    "olimpo-iii",
  ];
  const ratios: Record<LevelKey, number> = {
    mortal: t.mortal,
    perseo: t.perseo,
    heracles: t.heracles,
    apolo: t.apolo,
    atlas: t.atlas,
    titan: t.titan,
    zeus: t.zeus,
    "olimpo-i": t.zeus + t.olimpoStep,
    "olimpo-ii": t.zeus + t.olimpoStep * 2,
    "olimpo-iii": t.zeus + t.olimpoStep * 3,
  };

  const unit = measurement === "weight_reps" ? "kg" : "reps";
  return {
    next: getLevelByKey(orderedKeys[0]),
    valueNeeded:
      measurement === "weight_reps"
        ? ratios.mortal * (bodyweightKg ?? 0)
        : ratios.mortal,
    unit,
  };
}

/**
 * Computa el nivel actual de un ejercicio dado el mejor 1RM (kg)
 * — o las mejores reps absolutas para reps_only — y el peso corporal.
 *
 * Devuelve null si el ejercicio no tiene threshold conocido (no es
 * un main lift), o si falta el peso corporal cuando se necesita.
 */
export function computeExerciseLevel(args: {
  exerciseSlug: string;
  measurement: "weight_reps" | "reps_only" | "duration";
  best1RM?: number; // peso 1RM estimado
  bestReps?: number; // reps_only
  bodyweightKg: number | null;
}): {
  level: Level;
  ratio: number;
  /** Threshold para llegar al siguiente nivel, en la unidad nativa
   * del ejercicio (kg o reps). */
  nextLevelTarget: number | null;
  nextLevelLabel: string | null;
} | null {
  const { exerciseSlug, measurement, best1RM, bestReps, bodyweightKg } = args;

  if (measurement === "weight_reps") {
    const t = LIFT_THRESHOLDS[exerciseSlug];
    if (!t) return null;
    if (!bodyweightKg || bodyweightKg <= 0) return null;
    if (typeof best1RM !== "number" || !Number.isFinite(best1RM) || best1RM <= 0) {
      return {
        level: getLevelByKey("mortal"),
        ratio: 0,
        nextLevelTarget: bodyweightKg * t.mortal,
        nextLevelLabel: "Perseo",
      };
    }
    const ratio = best1RM / bodyweightKg;
    const level = thresholdToLevel(ratio, t);
    const nextRank = level.rank + 1;
    if (nextRank >= LEVELS.length) {
      return { level, ratio, nextLevelTarget: null, nextLevelLabel: null };
    }
    const nextRatio = nextRatioForLevel(getLevelByRank(nextRank).key, t);
    return {
      level,
      ratio,
      nextLevelTarget: nextRatio !== null ? bodyweightKg * nextRatio : null,
      nextLevelLabel: getLevelByRank(nextRank).name,
    };
  }

  if (measurement === "reps_only") {
    const t = REPS_ONLY_THRESHOLDS[exerciseSlug];
    if (!t) return null;
    const reps = typeof bestReps === "number" ? bestReps : 0;
    const level = thresholdToLevel(reps, t);
    const nextRank = level.rank + 1;
    if (nextRank >= LEVELS.length) {
      return { level, ratio: reps, nextLevelTarget: null, nextLevelLabel: null };
    }
    const nextThreshold = nextRatioForLevel(getLevelByRank(nextRank).key, t);
    return {
      level,
      ratio: reps,
      nextLevelTarget: nextThreshold,
      nextLevelLabel: getLevelByRank(nextRank).name,
    };
  }

  // duration u otros — no hay threshold definido (futuro).
  return null;
}

/**
 * Threshold del *límite inferior* del nivel `key`. Útil para mostrar
 * cuánto falta para subir.
 */
function nextRatioForLevel(key: LevelKey, t: Threshold): number | null {
  switch (key) {
    case "mortal":
      return 0;
    case "perseo":
      return t.mortal;
    case "heracles":
      return t.perseo;
    case "apolo":
      return t.heracles;
    case "atlas":
      return t.apolo;
    case "titan":
      return t.atlas;
    case "zeus":
      return t.titan;
    case "olimpo-i":
      return t.zeus;
    case "olimpo-ii":
      return t.zeus + t.olimpoStep;
    case "olimpo-iii":
      return t.zeus + t.olimpoStep * 2;
    default:
      return null;
  }
}

/**
 * Nivel global del usuario — promedio ponderado del rank de los
 * lifts principales que ha entrenado. Se redondea al nivel más
 * cercano por debajo (no infla).
 */
export function computeGlobalLevel(
  perExerciseLevels: { exerciseSlug: string; level: Level }[]
): Level | null {
  if (perExerciseLevels.length === 0) return null;
  const validRanks = perExerciseLevels
    .filter((e) =>
      ["squat", "bench-press", "deadlift", "overhead-press", "pull-ups"].includes(
        e.exerciseSlug
      )
    )
    .map((e) => e.level.rank);
  if (validRanks.length === 0) return null;
  const avg = validRanks.reduce((s, r) => s + r, 0) / validRanks.length;
  return getLevelByRank(Math.floor(avg));
}

/**
 * Recopila el mejor 1RM (o mejores reps) por exercise_id a partir
 * de los sets crudos. Filtra reps inválidas para Epley.
 */
export function bestPerExerciseFromSets(sets: {
  exercise_id: string;
  weight_kg: number | null;
  reps: number | null;
}[]): Map<string, { best1RM: number; bestReps: number }> {
  const map = new Map<string, { best1RM: number; bestReps: number }>();
  for (const s of sets) {
    if (!s.exercise_id) continue;
    const cur = map.get(s.exercise_id) ?? { best1RM: 0, bestReps: 0 };
    if (s.weight_kg && s.reps) {
      const oneRm = estimate1RM(s.weight_kg, s.reps);
      if (Number.isFinite(oneRm) && oneRm > cur.best1RM) cur.best1RM = oneRm;
    }
    if (s.reps && s.reps > cur.bestReps) cur.bestReps = s.reps;
    map.set(s.exercise_id, cur);
  }
  return map;
}

/**
 * Mensaje contextual según el nivel + el goal del user. Devuelve
 * 1-2 frases para mostrar como tip.
 */
export function tipForLevel(level: Level, goal: "fuerza" | "hipertrofia" | "resistencia" | "salud"): string {
  const byLevelByGoal: Record<LevelKey, Record<typeof goal, string>> = {
    mortal: {
      fuerza: "Aprende la técnica primero. Repeticiones limpias siempre vencen al ego con peso.",
      hipertrofia: "Construye base. Ve por 3 sesiones por semana de cuerpo completo.",
      resistencia: "Suma minutos de cardio cada semana. La adaptación tarda unos 21 días.",
      salud: "Lo importante hoy es no fallar. Mañana, mejor que ayer.",
    },
    perseo: {
      fuerza: "Estás en el rango de novato. Sube peso un poco cada semana — los gains aún son lineales.",
      hipertrofia: "Volumen sobre intensidad: 10-15 series semanales por grupo muscular.",
      resistencia: "Alterna alta intensidad (HIIT) con tiradas largas a ritmo conversacional.",
      salud: "Constancia > intensidad. 4 sesiones de 30 min superan a 2 de 90.",
    },
    heracles: {
      fuerza: "El cuerpo ya está fuerte. Reduce reps (3-5), aumenta peso.",
      hipertrofia: "Trabaja el rango medio (8-12 reps) con cadencia de bajada controlada.",
      resistencia: "Empieza a programar deload weeks cada 4-6 semanas.",
      salud: "Variedad: alterna pesas con caminatas largas y movilidad.",
    },
    apolo: {
      fuerza: "Forma sobre carga: una mala rep a este nivel = una semana fuera.",
      hipertrofia: "Empieza a especializar. 2 grupos musculares prioritarios + el resto en mantenimiento.",
      resistencia: "Mete trabajos de tempo: 20-40 min al 80% de tu FCmax.",
      salud: "El descanso ahora es entrenamiento. 7-9h de sueño mínimo.",
    },
    atlas: {
      fuerza: "Considera bandas o cadenas para variar la curva de fuerza en los lifts.",
      hipertrofia: "Series de aproximación: 50% × 5, 70% × 3, 85% × 1, luego trabajos.",
      resistencia: "Periodiza por bloques: aeróbico → umbral → VO₂max.",
      salud: "Prioriza la movilidad. Cuanto más cargas, más debes movilizar.",
    },
    titan: {
      fuerza: "Eres minoría absoluta. Minimiza el riesgo: warm-ups largos, técnica perfecta.",
      hipertrofia: "Pequeñas adiciones: 2-3 reps más en una serie es una semana de progreso.",
      resistencia: "Trabaja hill repeats y plyo para encender potencia anaeróbica.",
      salud: "Recuperación activa: nadar / yoga / sauna 1-2 veces por semana.",
    },
    zeus: {
      fuerza: "El reto ya no es el peso, es no romperte. Programa tus DEloads con disciplina.",
      hipertrofia: "Estás cerca del ceiling natural. Variantes y ángulos nuevos > más volumen.",
      resistencia: "Specifity: si compites, simula la prueba al 90% una vez al mes.",
      salud: "Prioriza la calidad de vida sobre métricas. Disfruta la fuerza que tienes.",
    },
    "olimpo-i": {
      fuerza: "Has cruzado a la élite. Coach y técnica revisada con video — necesarios.",
      hipertrofia: "Cada gramo de músculo cuesta 10× más que en Apolo. Sé paciente.",
      resistencia: "Compite. La élite se calibra contra otros, no contra el reloj.",
      salud: "Tu cuerpo es un instrumento. Cuídalo: nutrición y descanso casi profesionales.",
    },
    "olimpo-ii": {
      fuerza: "Pocas personas en el mundo. Cualquier salto es histórico — sé meticuloso.",
      hipertrofia: "Tu genética dice 'casi'. La diferencia es disciplina y tiempo.",
      resistencia: "Programación profesional. Considera coach.",
      salud: "El equilibrio aquí es todo. La obsesión rompe lo que tanto construiste.",
    },
    "olimpo-iii": {
      fuerza: "Eres legendario. Documenta tu camino — inspiras a Perseos.",
      hipertrofia: "El podio del podio. Mantenimiento es el reto, no el progreso.",
      resistencia: "Compite, enseña, escribe. Tu camino vale.",
      salud: "Llegar acá pide pagar precios. Que la vida total siga siendo rica.",
    },
  };
  return byLevelByGoal[level.key]?.[goal] ?? "Sigue caminando, una sesión a la vez.";
}
