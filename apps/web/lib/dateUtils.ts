export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getCurrentWeekDays(): { date: string; label: string; isToday: boolean }[] {
  const today = new Date();
  const todayStr = getTodayStr();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { date: ds, label: labels[i], isToday: ds === todayStr };
  });
}

export function getHeaderDateStr(): string {
  const t = new Date();
  const days = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return `HOY · ${days[t.getDay()]} ${t.getDate()} ${months[t.getMonth()]}`;
}

export function getMonthGrid(year: number, month: number): (string | null)[] {
  // month is 0-indexed. Returns 42 cells (6 weeks) with "YYYY-MM-DD" or null for padding.
  const first = new Date(year, month, 1);
  const firstDow = first.getDay(); // 0 = Sun, we want Mon-first
  const pad = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length < 42) cells.push(null);
  return cells;
}

export function computeStreak(dates: string[]): number {
  // dates: sorted list of "YYYY-MM-DD" (descending or ascending, we'll sort)
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (!set.has(todayStr)) d.setDate(d.getDate() - 1);
  while (true) {
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (set.has(s)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

/**
 * Returns the longest consecutive-days streak found anywhere in `dates`.
 *
 * Unlike `computeStreak` (which looks backward from today), this walks
 * the entire history and returns the best uninterrupted run. Dates that
 * appear more than once in the input are counted once — the function is
 * idempotent under duplicates.
 *
 * @example
 *   computeLongestStreak([]) // 0
 *   computeLongestStreak(["2026-04-20"]) // 1
 *   computeLongestStreak(["2026-04-18", "2026-04-19", "2026-04-20"]) // 3
 *   // non-consecutive gap resets the run:
 *   computeLongestStreak(["2026-04-10", "2026-04-11", "2026-04-20"]) // 2
 */
export function computeLongestStreak(dates: string[]): number {
  if (!dates.length) return 0;
  // Dedupe + sort ascending so `prev + 1 day === current` comparison is meaningful.
  const sorted = Array.from(new Set(dates)).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const cur = new Date(sorted[i] + "T00:00:00");
    const deltaDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    if (deltaDays === 1) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

export function formatMonthLabel(year: number, month: number): string {
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
  return `${months[month]} ${year}`;
}

export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const last = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from: first, to: last };
}
