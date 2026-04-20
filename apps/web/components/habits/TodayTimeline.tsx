"use client";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import type { Habit, HabitLog } from "@estoicismo/supabase";

/**
 * Returns true when the habit is scheduled for the given date string.
 * - "daily": always true
 * - "weekly" (string): treated as daily for backward compat
 * - { days: number[] }: days use Monday=0..Sunday=6 convention (matches HabitModal)
 */
export function isHabitDueOn(habit: Habit, dateStr: string): boolean {
  const freq = habit.frequency;
  if (freq === "daily" || freq === "weekly") return true;
  if (typeof freq === "object" && freq && "days" in freq) {
    const d = new Date(dateStr + "T00:00:00");
    const jsDow = d.getDay(); // 0=Sun..6=Sat
    const monFirst = jsDow === 0 ? 6 : jsDow - 1; // 0=Mon..6=Sun
    return freq.days.includes(monFirst);
  }
  return true;
}

/**
 * Parses "HH:MM" or "HH:MM:SS" into total minutes. Returns null if invalid.
 */
export function parseReminderMinutes(time: string | null): number | null {
  if (!time) return null;
  const m = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

function formatReminderLabel(time: string): string {
  // Display HH:MM regardless of whether seconds are included
  const m = /^(\d{2}:\d{2})/.exec(time);
  return m ? m[1] : time;
}

type VisibleHabit = {
  habit: Habit;
  minutes: number | null; // null = sin horario
};

export function getVisibleTimelineHabits(
  habits: Habit[],
  currentDate: string
): { scheduled: VisibleHabit[]; unscheduled: VisibleHabit[] } {
  const scheduled: VisibleHabit[] = [];
  const unscheduled: VisibleHabit[] = [];
  for (const habit of habits) {
    if (!isHabitDueOn(habit, currentDate)) continue;
    const minutes = parseReminderMinutes(habit.reminder_time);
    if (minutes == null) {
      unscheduled.push({ habit, minutes: null });
    } else {
      scheduled.push({ habit, minutes });
    }
  }
  scheduled.sort((a, b) => (a.minutes ?? 0) - (b.minutes ?? 0));
  return { scheduled, unscheduled };
}

function useCurrentMinutes(): number {
  const [mins, setMins] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = window.setInterval(() => {
      const d = new Date();
      setMins(d.getHours() * 60 + d.getMinutes());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return mins;
}

export function TodayTimeline({
  habits,
  logs,
  onToggle,
  currentDate,
}: {
  habits: Habit[];
  logs: HabitLog[];
  onToggle: (habit: Habit, isCompleted: boolean) => void;
  currentDate: string;
}) {
  const { scheduled, unscheduled } = useMemo(
    () => getVisibleTimelineHabits(habits, currentDate),
    [habits, currentDate]
  );

  const completedSet = useMemo(
    () =>
      new Set(
        logs.filter((l) => l.completed_at === currentDate).map((l) => l.habit_id)
      ),
    [logs, currentDate]
  );

  if (scheduled.length === 0 && unscheduled.length === 0) return null;

  return (
    <section
      aria-label="Rutina de hoy"
      className="mb-6 lg:mb-0"
      data-testid="today-timeline"
    >
      {/* Mobile: horizontal chip list */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between mb-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Rutina de hoy
          </p>
        </div>
        {scheduled.length === 0 ? (
          <p className="font-body text-sm text-muted">Sin horario fijo.</p>
        ) : (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6"
            role="list"
          >
            {scheduled.map(({ habit, minutes }) => {
              const done = completedSet.has(habit.id);
              return (
                <button
                  key={habit.id}
                  type="button"
                  role="listitem"
                  onClick={() => onToggle(habit, done)}
                  aria-pressed={done}
                  aria-label={`${formatReminderLabel(habit.reminder_time ?? "")} ${habit.name}${done ? ", completado" : ""}`}
                  className={clsx(
                    "flex-shrink-0 inline-flex items-center gap-2 h-10 px-3 rounded-full border font-body text-sm transition-all duration-150 ease-out active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    done
                      ? "border-transparent text-ink/60 line-through"
                      : "border-line text-ink hover:border-accent/40"
                  )}
                  style={{
                    backgroundColor: done ? `${habit.color}11` : undefined,
                  }}
                >
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: habit.color }}
                  >
                    {formatReminderLabel(habit.reminder_time ?? "")}
                  </span>
                  <span>{habit.icon}</span>
                  <span className="whitespace-nowrap">{habit.name}</span>
                  {/* minutes hidden label for a11y; visible time above */}
                  <span className="sr-only">{minutes}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: vertical time-blocked timeline (lg+) */}
      <div className="hidden lg:block">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
          Rutina de hoy
        </p>
        <h3 className="font-display italic text-xl text-ink mb-4">Horario</h3>
        <DesktopTimeline
          scheduled={scheduled}
          unscheduled={unscheduled}
          completedSet={completedSet}
          onToggle={onToggle}
        />
      </div>
    </section>
  );
}

function DesktopTimeline({
  scheduled,
  unscheduled,
  completedSet,
  onToggle,
}: {
  scheduled: VisibleHabit[];
  unscheduled: VisibleHabit[];
  completedSet: Set<string>;
  onToggle: (habit: Habit, isCompleted: boolean) => void;
}) {
  const nowMinutes = useCurrentMinutes();

  // Work out where to place the "now" indicator among scheduled cards.
  // nowIndex = first scheduled index whose minutes >= nowMinutes; if none, append at end.
  const nowIndex = useMemo(() => {
    if (scheduled.length === 0) return -1;
    const idx = scheduled.findIndex((s) => (s.minutes ?? 0) >= nowMinutes);
    return idx === -1 ? scheduled.length : idx;
  }, [scheduled, nowMinutes]);

  return (
    <div className="relative flex flex-col">
      {/* Vertical rail */}
      <div className="absolute left-[10px] top-2 bottom-2 w-px bg-line" aria-hidden />

      {scheduled.length === 0 && unscheduled.length === 0 ? null : null}

      {scheduled.map(({ habit }, i) => (
        <div key={habit.id}>
          {nowIndex === i && (
            <NowIndicator minutes={nowMinutes} />
          )}
          <TimelineCard
            habit={habit}
            done={completedSet.has(habit.id)}
            onToggle={onToggle}
          />
        </div>
      ))}
      {/* If "now" sits after all scheduled, render the indicator at the tail */}
      {scheduled.length > 0 && nowIndex === scheduled.length && (
        <NowIndicator minutes={nowMinutes} />
      )}

      {unscheduled.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2 pl-6">
            Sin horario
          </p>
          {unscheduled.map(({ habit }) => (
            <TimelineCard
              key={habit.id}
              habit={habit}
              done={completedSet.has(habit.id)}
              onToggle={onToggle}
              noTime
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NowIndicator({ minutes }: { minutes: number }) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return (
    <div
      className="relative flex items-center gap-2 my-1.5 pl-6"
      role="presentation"
      aria-hidden
      data-testid="timeline-now"
    >
      <span className="absolute left-[6px] w-[9px] h-[9px] rounded-full bg-accent" />
      <span className="absolute left-4 right-0 h-px bg-accent/60" />
      <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-accent bg-bg pl-1 pr-0.5 relative">
        Ahora · {hh}:{mm}
      </span>
    </div>
  );
}

function TimelineCard({
  habit,
  done,
  onToggle,
  noTime = false,
}: {
  habit: Habit;
  done: boolean;
  onToggle: (habit: Habit, isCompleted: boolean) => void;
  noTime?: boolean;
}) {
  const timeLabel = habit.reminder_time
    ? formatReminderLabel(habit.reminder_time)
    : "";

  return (
    <div className="relative flex items-start gap-3 py-2 pl-6">
      {/* Rail dot */}
      {!noTime && (
        <span
          className="absolute left-[6px] top-[22px] w-[9px] h-[9px] rounded-full border-2 border-bg"
          style={{ backgroundColor: habit.color }}
          aria-hidden
        />
      )}

      <div className="flex-1 min-w-0">
        {!noTime && (
          <p
            className="font-mono text-[10px] uppercase tracking-widest mb-1"
            style={{ color: habit.color }}
          >
            {timeLabel}
          </p>
        )}
        <div
          role="group"
          className={clsx(
            "flex items-center gap-3 p-3 rounded-card border transition-all duration-150 ease-out",
            done
              ? "border-transparent"
              : "border-line hover:border-accent/30"
          )}
          style={{
            backgroundColor: done ? `${habit.color}11` : undefined,
          }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: `${habit.color}22`, color: habit.color }}
            aria-hidden
          >
            <span>{habit.icon}</span>
          </div>
          <p
            className={clsx(
              "flex-1 font-body font-medium text-[14px] text-ink truncate",
              done && "line-through text-ink/60"
            )}
          >
            {habit.name}
          </p>
          <button
            type="button"
            onClick={() => onToggle(habit, done)}
            aria-pressed={done}
            aria-label={
              done
                ? `Marcar "${habit.name}" como no hecho`
                : `Marcar "${habit.name}" como hecho`
            }
            className={clsx(
              "flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all duration-150 ease-out flex items-center justify-center active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            )}
            style={{
              backgroundColor: done ? habit.color : "transparent",
              borderColor: done ? "transparent" : habit.color,
              color: done ? "#FFFFFF" : habit.color,
            }}
          >
            {done && <Check size={16} strokeWidth={3} />}
          </button>
        </div>
      </div>
    </div>
  );
}
