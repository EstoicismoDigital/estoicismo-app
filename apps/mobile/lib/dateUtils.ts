// apps/mobile/lib/dateUtils.ts

/** Returns today's date as "YYYY-MM-DD" in local time */
export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Subtracts N days from a "YYYY-MM-DD" string, returns "YYYY-MM-DD" */
export function subtractDays(dateStr: string, days: number): string {
  // Use noon to avoid DST edge cases
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns the 7 days of the current week (Mon→Sun), each as { date, label } */
export function getCurrentWeekDays(): { date: string; label: string }[] {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: labels[i],
    };
  });
}

/** Returns "HOY · LUNES 19 ABR" for the dark header */
export function getHeaderDateStr(): string {
  const today = new Date();
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return `HOY · ${days[today.getDay()]} ${today.getDate()} ${months[today.getMonth()]}`;
}
