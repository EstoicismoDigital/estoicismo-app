/**
 * Calculadora de placas para barra olímpica.
 *
 * Asume barra de 20kg (estándar olímpico) por defecto, pero
 * configurable. Calcula qué placas poner en cada lado para
 * llegar al peso target.
 *
 * Pares estándar disponibles en gyms:
 *   25 · 20 · 15 · 10 · 5 · 2.5 · 1.25 · 1 · 0.5 (kg)
 *
 * Output: array de discos por lado (no total). El user pone
 * los mismos en cada lado de la barra.
 */

const STANDARD_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25, 1, 0.5];
const STANDARD_PLATES_LBS = [45, 35, 25, 10, 5, 2.5, 1.25];

export type PlateBreakdown = {
  /** Discos por lado en orden descendente. */
  perSide: number[];
  /** Suma exacta posible con los discos disponibles. */
  achievableWeight: number;
  /** Qué tan lejos quedó del target (positivo = sobró, negativo = faltó). */
  delta: number;
  /** Si es exactamente lo pedido. */
  exact: boolean;
};

/**
 * @param target peso total (incluyendo barra)
 * @param barWeight peso de la barra (default 20kg en métrico)
 * @param unit "kg" | "lbs"
 * @param availablePlates si quieres pasar tu propio set
 */
export function calculatePlates(
  target: number,
  barWeight = 20,
  unit: "kg" | "lbs" = "kg",
  availablePlates?: number[]
): PlateBreakdown {
  const plates = availablePlates ?? (unit === "kg" ? STANDARD_PLATES_KG : STANDARD_PLATES_LBS);

  const perSideTarget = (target - barWeight) / 2;
  if (perSideTarget < 0) {
    return { perSide: [], achievableWeight: barWeight, delta: barWeight - target, exact: target === barWeight };
  }
  if (perSideTarget === 0) {
    return { perSide: [], achievableWeight: barWeight, delta: 0, exact: true };
  }

  // Greedy de mayor a menor — funciona bien con discos estándar.
  const sortedDesc = [...plates].sort((a, b) => b - a);
  let remaining = perSideTarget;
  const perSide: number[] = [];

  for (const p of sortedDesc) {
    while (remaining >= p - 1e-6) {
      perSide.push(p);
      remaining = round(remaining - p);
    }
  }

  const totalPerSide = perSide.reduce((s, p) => s + p, 0);
  const achievable = barWeight + totalPerSide * 2;
  const delta = round(achievable - target);

  return {
    perSide,
    achievableWeight: round(achievable),
    delta,
    exact: Math.abs(delta) < 0.01,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Cuenta cuántas placas de cada peso usar (para mostrar UI).
 */
export function plateCounts(perSide: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const p of perSide) {
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return counts;
}
