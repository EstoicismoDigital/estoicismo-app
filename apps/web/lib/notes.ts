import type { HabitLog, Habit } from "@estoicismo/supabase";

/**
 * A completed habit log that has a non-empty note, enriched with the habit's
 * display metadata (name, icon, color). This is what the Notas feed renders.
 */
export type NoteEntry = {
  logId: string;
  habitId: string;
  habitName: string;
  habitIcon: string;
  habitColor: string;
  /** YYYY-MM-DD */
  date: string;
  text: string;
};

/** A date bucket for the timeline UI. Newest date first within the returned list. */
export type NoteGroup = {
  /** YYYY-MM-DD */
  date: string;
  notes: NoteEntry[];
};

/**
 * Project `habit_logs` rows + their owning `habits` down to a flat, sorted list
 * of non-empty notes ready for rendering. Rows without a note (empty or null),
 * rows whose habit has been deleted, and whitespace-only notes are dropped.
 * Output is sorted newest date first; within a date, stable by original input
 * order so callers can rely on a deterministic render.
 */
export function buildNoteEntries(
  logs: HabitLog[],
  habits: Habit[]
): NoteEntry[] {
  const habitById = new Map<string, Habit>();
  for (const h of habits) habitById.set(h.id, h);

  const entries: NoteEntry[] = [];
  for (const log of logs) {
    const note = log.note?.trim();
    if (!note) continue;
    const habit = habitById.get(log.habit_id);
    if (!habit) continue;
    entries.push({
      logId: log.id,
      habitId: habit.id,
      habitName: habit.name,
      habitIcon: habit.icon,
      habitColor: habit.color,
      date: log.completed_at,
      text: note,
    });
  }

  // Newest first. Ties break by insertion order (stable sort in V8).
  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return entries;
}

/**
 * Group a pre-sorted (newest first) entry list into date buckets.
 * Preserves incoming order so the caller can assume `groups[0]` is the most
 * recent date and entries within a group match the input order.
 */
export function groupNotesByDate(entries: NoteEntry[]): NoteGroup[] {
  const groups: NoteGroup[] = [];
  let current: NoteGroup | null = null;
  for (const e of entries) {
    if (!current || current.date !== e.date) {
      current = { date: e.date, notes: [] };
      groups.push(current);
    }
    current.notes.push(e);
  }
  return groups;
}

/**
 * Case-insensitive substring match across the note text *and* the habit name,
 * so a user typing "lectura" finds both "finalmente me animé a leer" written
 * on the 'Lectura' habit and any other habit whose note literally says
 * "lectura". Returns the full list when `query` is empty or whitespace-only.
 */
export function filterNotes(entries: NoteEntry[], query: string): NoteEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.text.toLowerCase().includes(q) ||
      e.habitName.toLowerCase().includes(q)
  );
}

/**
 * Spanish, human-friendly day label for a note group header.
 *   today → "Hoy"
 *   yesterday → "Ayer"
 *   same ISO week → weekday name (e.g. "Martes")
 *   older → "12 Abril 2026"
 * `reference` must be "YYYY-MM-DD" and is intended to be today's date.
 */
export function formatNoteDayLabel(date: string, reference: string): string {
  if (date === reference) return "Hoy";
  const ref = new Date(reference + "T00:00:00");
  const cur = new Date(date + "T00:00:00");
  const deltaDays = Math.round(
    (ref.getTime() - cur.getTime()) / 86_400_000
  );
  if (deltaDays === 1) return "Ayer";
  if (deltaDays > 1 && deltaDays < 7) {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return days[cur.getDay()];
  }
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${cur.getDate()} ${months[cur.getMonth()]} ${cur.getFullYear()}`;
}
