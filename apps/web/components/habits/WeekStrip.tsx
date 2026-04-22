"use client";
import { clsx } from "clsx";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import { getCurrentWeekDays, getTodayStr } from "../../lib/dateUtils";

export function WeekStrip({
  habit,
  logs,
  onToggleDay,
}: {
  habit: Habit;
  logs: HabitLog[];
  /**
   * Toggle completion for a specific day in the current week. The current
   * day gets a prominent accent ring; past days are also tappable so users
   * can log retroactively for days they forgot. Future days are rendered as
   * non-interactive placeholders and never invoke this callback.
   *
   * `isCompleted` reflects the CURRENT state of the cell (true = already
   * done, caller should delete the log; false = not done, caller should
   * insert a log).
   */
  onToggleDay: (date: string, isCompleted: boolean) => void;
}) {
  const week = getCurrentWeekDays();
  const today = getTodayStr();
  const completedDates = new Set(
    logs.filter((l) => l.habit_id === habit.id).map((l) => l.completed_at)
  );

  return (
    // Hidden on mobile — at narrow widths the 7-day strip collided with
    // the name column (labels "L M X J V S D" overflowed on top of the
    // habit title / streak badge). Mobile users still have TodayTimeline
    // for today's view and /habitos/[id] for full week history, so we
    // only render this inline on sm+ where we have the horizontal room.
    <div className="hidden sm:block flex-shrink-0">
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
                    onToggleDay(d.date, done);
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

          // Future day — non-interactive placeholder. We deliberately do
          // not let users pre-complete future days: it corrupts streak
          // math and doesn't correspond to any actual practice happening
          // yet. The dot just shows that the week extends further.
          if (isFuture) {
            return (
              <div key={d.date} className={baseFlex} aria-hidden>
                <span
                  className={clsx(
                    baseSize,
                    "rounded-full block opacity-25 transition-opacity duration-150 ease-out"
                  )}
                  style={{
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    borderStyle: "solid",
                    borderColor: "rgb(var(--color-line))",
                  }}
                />
              </div>
            );
          }

          // Past day in the current week — interactive so users can mark
          // retroactive completion. Visually smaller than today (no accent
          // ring, no offset) and uses the neutral line token when empty so
          // dark mode gets a dark empty ring.
          return (
            <div key={d.date} className={baseFlex}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDay(d.date, done);
                }}
                aria-label={
                  done
                    ? `Desmarcar el ${d.date}`
                    : `Marcar como hecho el ${d.date}`
                }
                aria-pressed={done}
                className={clsx(
                  baseSize,
                  "rounded-full transition-all duration-150 ease-out",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  "hover:scale-110 active:scale-95"
                )}
                style={{
                  backgroundColor: done ? habit.color : "transparent",
                  borderWidth: done ? 0 : 2,
                  borderStyle: "solid",
                  borderColor: done ? "transparent" : "rgb(var(--color-line))",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
