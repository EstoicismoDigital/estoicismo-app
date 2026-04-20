"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { clsx } from "clsx";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";
import { fetchHabits, fetchHabitLogs } from "@estoicismo/supabase";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import {
  getMonthGrid,
  formatMonthLabel,
  getMonthRange,
  getTodayStr,
} from "../../../lib/dateUtils";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

function DayCell({
  date,
  habits,
  logs,
  isToday,
  onClick,
}: {
  date: string | null;
  habits: Habit[];
  logs: HabitLog[];
  isToday: boolean;
  onClick: (date: string) => void;
}) {
  if (!date) {
    return <div className="aspect-square" aria-hidden />;
  }

  const day = Number(date.slice(-2));
  const completedHabits = habits.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.completed_at === date)
  );
  const shown = completedHabits.slice(0, 4);
  const more = completedHabits.length - shown.length;

  return (
    <button
      type="button"
      onClick={() => onClick(date)}
      className={clsx(
        "aspect-square flex flex-col items-center justify-start p-1 sm:p-1.5 rounded-lg transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "hover:bg-bg-alt",
        isToday && "bg-bg-alt ring-1 ring-accent"
      )}
      aria-label={`${date} — ${completedHabits.length} completados`}
    >
      <span
        className={clsx(
          "font-mono text-[11px] sm:text-xs tabular-nums leading-tight",
          isToday ? "text-accent font-medium" : "text-ink"
        )}
      >
        {day}
      </span>
      {shown.length > 0 && (
        <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-center max-w-full">
          {shown.map((h) => (
            <span
              key={h.id}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: h.color }}
              aria-hidden
            />
          ))}
          {more > 0 && (
            <span className="font-mono text-[8px] text-muted leading-none">
              +{more}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export function CalendarView() {
  const today = new Date();
  const todayStr = getTodayStr();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { from, to } = getMonthRange(cursor.year, cursor.month);

  const habitsQ = useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchHabits(sb, await getUserId());
    },
  });

  const logsQ = useQuery<HabitLog[]>({
    queryKey: ["habit-logs", from, to],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchHabitLogs(sb, await getUserId(), from, to);
    },
  });

  const habits = habitsQ.data ?? [];
  const logs = logsQ.data ?? [];
  const cells = useMemo(
    () => getMonthGrid(cursor.year, cursor.month),
    [cursor]
  );

  function prev() {
    setCursor((c) => {
      const m = c.month - 1;
      if (m < 0) return { year: c.year - 1, month: 11 };
      return { year: c.year, month: m };
    });
  }
  function next() {
    setCursor((c) => {
      const m = c.month + 1;
      if (m > 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: m };
    });
  }

  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];

  const selectedHabitsCompleted = selectedDate
    ? habits.filter((h) =>
        logs.some((l) => l.habit_id === h.id && l.completed_at === selectedDate)
      )
    : [];

  return (
    <div className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Tu progreso
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl">
            Calendario
          </h1>
          <p className="font-body text-sm text-white/60 mt-2">
            Una vista mensual de lo que has sostenido.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={prev}
            aria-label="Mes anterior"
            className="w-10 h-10 rounded-lg text-muted hover:text-ink hover:bg-bg-alt flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-display italic text-xl sm:text-2xl text-ink">
            {formatMonthLabel(cursor.year, cursor.month)}
          </h2>
          <button
            type="button"
            onClick={next}
            aria-label="Mes siguiente"
            className="w-10 h-10 rounded-lg text-muted hover:text-ink hover:bg-bg-alt flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
          {dayLabels.map((d) => (
            <p
              key={d}
              className="text-center font-mono text-[10px] uppercase tracking-widest text-muted py-2"
            >
              {d}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {cells.map((date, i) => (
            <DayCell
              key={i}
              date={date}
              habits={habits}
              logs={logs}
              isToday={date === todayStr}
              onClick={setSelectedDate}
            />
          ))}
        </div>

        {/* Legend */}
        {habits.length > 0 && (
          <div className="mt-10 pt-6 border-t border-line">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">
              Leyenda
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {habits.map((h) => (
                <li key={h.id} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: h.color }}
                    aria-hidden
                  />
                  <span className="font-body text-sm text-ink">{h.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Selected day panel */}
      {selectedDate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle del ${selectedDate}`}
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setSelectedDate(null)}
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-150"
          />
          <div className="relative bg-bg w-full sm:max-w-sm sm:h-full rounded-t-modal sm:rounded-none shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom sm:slide-in-from-right duration-200 flex flex-col max-h-[85vh] sm:max-h-none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Resumen
                </p>
                <h3 className="font-display italic text-xl text-ink mt-0.5">
                  {selectedDate}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label="Cerrar panel"
                className="w-10 h-10 rounded-lg text-muted hover:text-ink hover:bg-bg-alt flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {habits.length === 0 ? (
                <p className="font-body text-sm text-muted">
                  No hay hábitos para mostrar.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {habits.map((h) => {
                    const done = selectedHabitsCompleted.some((sh) => sh.id === h.id);
                    return (
                      <li
                        key={h.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-line"
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                          style={{ backgroundColor: `${h.color}22`, color: h.color }}
                          aria-hidden
                        >
                          {h.icon}
                        </span>
                        <span className="flex-1 font-body text-sm text-ink">
                          {h.name}
                        </span>
                        <span
                          className={clsx(
                            "font-mono text-[10px] uppercase tracking-widest",
                            done ? "text-success" : "text-muted"
                          )}
                        >
                          {done ? "Hecho" : "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
