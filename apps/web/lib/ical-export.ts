/**
 * iCal export — genera un .ics con los hábitos como eventos
 * recurrentes (RRULE) usando reminder_time como hora del evento.
 *
 * Formatos de frequency soportados:
 *   - "daily" → RRULE:FREQ=DAILY
 *   - "weekly" → RRULE:FREQ=WEEKLY (lunes-domingo)
 *   - { days: [0..6] } (Mon=0..Sun=6) → BYDAY
 *
 * Si no hay reminder_time, default a 09:00 local.
 *
 * El user descarga el archivo y lo importa a Google/Apple Calendar.
 */

import type { Habit } from "@estoicismo/supabase";

const ICS_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatIcsDate(d: Date): string {
  // YYYYMMDDTHHMMSS (local time, no Z)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function nextOccurrence(habit: Habit, baseDate: Date): Date {
  const d = new Date(baseDate);
  const time = habit.reminder_time ?? "09:00";
  const [hours, minutes] = time.split(":").map(Number);
  d.setHours(hours, minutes, 0, 0);
  // Si ya pasó hoy, mover a mañana
  if (d <= new Date()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function rruleFor(habit: Habit): string | null {
  const f = habit.frequency;
  if (f === "daily") return "RRULE:FREQ=DAILY";
  if (f === "weekly") return "RRULE:FREQ=WEEKLY";
  if (typeof f === "object" && Array.isArray(f.days) && f.days.length > 0) {
    const days = f.days.map((d) => ICS_DAYS[d]).join(",");
    return `RRULE:FREQ=WEEKLY;BYDAY=${days}`;
  }
  return null;
}

export function buildIcsForHabits(habits: Habit[]): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Estoicismo Digital//Habits//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Estoicismo · Hábitos",
    "X-WR-CALDESC:Tus hábitos diarios exportados desde Estoicismo Digital.",
  ];

  for (const habit of habits) {
    if (habit.is_archived) continue;
    const rrule = rruleFor(habit);
    if (!rrule) continue;

    const start = nextOccurrence(habit, now);
    const end = new Date(start.getTime() + 15 * 60 * 1000); // 15 min event
    const uid = `${habit.id}@estoicismo-digital`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(`${habit.icon} ${habit.name}`)}`,
      `DESCRIPTION:${escapeIcsText(`Hábito de tu rutina diaria. Completa en Estoicismo Digital.`)}`,
      rrule,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(habit.name)}`,
      "TRIGGER:-PT5M",
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  // CRLF line endings — RFC 5545 requirement
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(habits: Habit[], filename = "estoicismo-habitos.ics"): void {
  const ics = buildIcsForHabits(habits);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
