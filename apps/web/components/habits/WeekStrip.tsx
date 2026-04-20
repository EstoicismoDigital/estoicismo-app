"use client";
import { clsx } from "clsx";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import { getCurrentWeekDays, getTodayStr } from "../../lib/dateUtils";

export function WeekStrip({
  habit,
  logs,
  onToggleToday,
}: {
  habit: Habit;
  logs: HabitLog[];
  onToggleToday: () => void;
}) {
  const week = getCurrentWeekDays();
  const today = getTodayStr();
  const completedDates = new Set(
    logs.filter((l) => l.habit_id === habit.id).map((l) => l.completed_at)
  );

  return (
    <div className="flex-shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
        {week.map((d) => (
          <span
            key={d.date + "-l"}
            className={clsx(
              "w-6 sm:w-7 text-center font-mono text-[9px] uppercase tracking-widest",
              d.isToday ? "text-accent" : "text-muted/70"
            )}
          >
            {d.label}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {week.map((d) => {
          const isFuture = d.date > today;
          const done = completedDates.has(d.date);
          const isToday = d.isToday;

          const baseSize = isToday ? "w-6 h-6 sm:w-7 sm:h-7" : "w-5 h-5 sm:w-6 sm:h-6";
          const baseFlex = "w-6 sm:w-7 flex items-center justify-center";

          if (isToday) {
            return (
              <div key={d.date} className={baseFlex}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleToday();
                  }}
                  aria-label={
                    done ? "Marcar como no hecho hoy" : "Marcar como hecho hoy"
                  }
                  aria-pressed={done}
                  className={clsx(
                    baseSize,
                    "rounded-full transition-all duration-150 ease-out",
                    "ring-2 ring-offset-2 ring-offset-bg focus:outline-none focus-visible:ring-accent",
                    done ? "ring-accent scale-100" : "ring-accent/40 hover:scale-105"
                  )}
                  style={{
                    backgroundColor: done ? habit.color : "transparent",
                    borderWidth: done ? 0 : 2,
                    borderStyle: "solid",
                    borderColor: done ? "transparent" : habit.color,
                  }}
                />
              </div>
            );
          }

          return (
            <div key={d.date} className={baseFlex} aria-hidden={isFuture}>
              <span
                className={clsx(
                  baseSize,
                  "rounded-full block transition-opacity duration-150 ease-out",
                  isFuture && "opacity-25"
                )}
                // Use the theme line token so dark mode gets a dark empty
                // ring instead of a hard-coded light beige.
                style={{
                  backgroundColor: done ? habit.color : "transparent",
                  borderWidth: done ? 0 : 2,
                  borderStyle: "solid",
                  borderColor: done ? "transparent" : "rgb(var(--color-line))",
                }}
                aria-label={
                  done
                    ? `Completado el ${d.date}`
                    : isFuture
                      ? `${d.date} en el futuro`
                      : `No completado el ${d.date}`
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
