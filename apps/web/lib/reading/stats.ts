/**
 * Estadísticas de lectura — racha, total acumulado, libros por mes.
 */

import type { ReadingSession, ReadingBook } from "@estoicismo/supabase";

export type ReadingStats = {
  totalSessions: number;
  totalSeconds: number;
  totalPages: number;
  /** Días consecutivos con al menos 1 sesión. */
  currentStreak: number;
  longestStreak: number;
  /** Libros terminados. */
  finishedBooks: number;
  /** Promedio minutos/día en últimos 30 días. */
  avgMinutesPerDay30d: number;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function computeReadingStats(
  sessions: ReadingSession[],
  books: ReadingBook[]
): ReadingStats {
  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((s, x) => s + (x.duration_seconds ?? 0), 0);
  const totalPages = sessions.reduce(
    (s, x) =>
      s + Math.max(0, (x.pages_to ?? 0) - (x.pages_from ?? x.pages_to ?? 0)),
    0
  );

  // Racha — basada en occurred_on únicos.
  const datesSet = new Set(sessions.map((s) => s.occurred_on));
  const dates = Array.from(datesSet).sort(); // ascending
  const { current, longest } = computeStreaks(dates);

  // Libros terminados
  const finishedBooks = books.filter((b) => b.is_finished).length;

  // Avg minutos / día en los últimos 30 días.
  const cutoff = new Date(Date.now() - 30 * MS_PER_DAY);
  const recentSeconds = sessions
    .filter((s) => new Date(s.occurred_on + "T00:00:00") >= cutoff)
    .reduce((s, x) => s + (x.duration_seconds ?? 0), 0);
  const avgMinutesPerDay30d = Math.round((recentSeconds / 60 / 30) * 10) / 10;

  return {
    totalSessions,
    totalSeconds,
    totalPages,
    currentStreak: current,
    longestStreak: longest,
    finishedBooks,
    avgMinutesPerDay30d,
  };
}

function computeStreaks(sortedDates: string[]): {
  current: number;
  longest: number;
} {
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let cur = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + "T00:00:00");
    const now = new Date(sortedDates[i] + "T00:00:00");
    const diff = (now.getTime() - prev.getTime()) / MS_PER_DAY;
    if (diff === 1) {
      cur++;
      longest = Math.max(longest, cur);
    } else if (diff > 1) {
      cur = 1;
    }
  }

  // Current: cuántos días consecutivos terminan en hoy o ayer.
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - MS_PER_DAY);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const last = sortedDates[sortedDates.length - 1];
  let current = 0;
  if (last === todayStr || last === yesterdayStr) {
    current = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const a = new Date(sortedDates[i] + "T00:00:00");
      const b = new Date(sortedDates[i + 1] + "T00:00:00");
      if ((b.getTime() - a.getTime()) / MS_PER_DAY === 1) {
        current++;
      } else {
        break;
      }
    }
  }
  return { current, longest };
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
