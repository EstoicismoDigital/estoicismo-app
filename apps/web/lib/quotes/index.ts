/**
 * Catálogo diario de reflexiones.
 *
 * Tres sets de 365 frases — uno por módulo:
 *   · HABITS_QUOTES   — disciplina, constancia, identidad
 *   · FINANCE_QUOTES  — riqueza, ahorro, inversión
 *   · MINDSET_QUOTES  — consciencia elevada ("carta al universo")
 *
 * Seleccionamos por día-del-año (1 a 366) para que la frase rote
 * automáticamente cada 24h y vuelva a empezar el 1 de enero. El 29-feb
 * en años no-bisiestos no existe, así que el índice 366 solo se usa
 * en bisiestos; nunca queda gap.
 *
 * Para el usuario: la misma frase aparece durante todo el día,
 * como un horóscopo. Al día siguiente, otra. Navegar atrás/adelante
 * desde el carrusel muestra las del día anterior / siguiente.
 */

import { HABITS_QUOTES, type HabitsQuote } from "./habits";
import { FINANCE_QUOTES, type FinanceQuote } from "./finance";
import { MINDSET_QUOTES, type MindsetQuote } from "./mindset";

export { HABITS_QUOTES, FINANCE_QUOTES, MINDSET_QUOTES };
export type { HabitsQuote, FinanceQuote, MindsetQuote };

export type Quote = { text: string; author: string | null };

/**
 * Devuelve el índice 0-based (0..364) para la frase del día recibido.
 * Usa el day-of-year local del usuario. Ej: 1 enero → 0, 31 dic → 364.
 * El 29-feb queda en 59 (6º de marzo se desplaza a 60, etc.); para
 * no-bisiestos simplemente se salta.
 */
export function dayOfYearIndex(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86_400_000);
  return (dayOfYear - 1 + 365) % 365;
}

/**
 * Selecciona la frase del día del array dado. Seguro contra arrays
 * de cualquier longitud (módulo). Acepta `offset` para navegar ±n días.
 */
export function getQuoteOfDay<T extends Quote>(
  quotes: readonly T[],
  opts: { date?: Date; offset?: number } = {}
): T {
  if (quotes.length === 0) {
    throw new Error("getQuoteOfDay: empty quotes array");
  }
  const { date = new Date(), offset = 0 } = opts;
  const base = dayOfYearIndex(date);
  const idx = ((base + offset) % quotes.length + quotes.length) % quotes.length;
  return quotes[idx] as T;
}

/** Conveniencia por módulo. */
export const getDailyHabitsQuote = (opts?: { date?: Date; offset?: number }) =>
  getQuoteOfDay(HABITS_QUOTES, opts);

export const getDailyFinanceQuote = (opts?: { date?: Date; offset?: number }) =>
  getQuoteOfDay(FINANCE_QUOTES, opts);

export const getDailyMindsetQuote = (opts?: { date?: Date; offset?: number }) =>
  getQuoteOfDay(MINDSET_QUOTES, opts);
