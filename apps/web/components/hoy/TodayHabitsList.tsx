"use client";
import Link from "next/link";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { useHabits, useToggleHabit } from "../../hooks/useHabits";
import { getTodayStr } from "../../lib/dateUtils";
import { isHabitDueOn } from "../habits/TodayTimeline";

/**
 * Lista compacta de hábitos del día — solo los que aplican hoy.
 * Tap = toggle. Sin reordenar, sin editar — para eso está /habitos.
 *
 * Si no hay hábitos: empty state con CTA.
 * Si hay > 8: muestra los primeros 8 + "ver todos →".
 */
export function TodayHabitsList() {
  const { habits, logs, isLoading } = useHabits();
  const toggle = useToggleHabit();
  const today = getTodayStr();

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 size={16} className="animate-spin text-muted" />
      </div>
    );
  }

  // Solo los que aplican hoy según frecuencia
  const dueToday = habits.filter((h) => isHabitDueOn(h, today));
  const limit = 8;
  const visible = dueToday.slice(0, limit);

  if (habits.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg p-4 text-center">
        <p className="font-body text-sm text-muted mb-2">
          Sin hábitos todavía.
        </p>
        <Link
          href="/habitos"
          className="inline-flex items-center gap-1 h-9 px-4 rounded-full bg-accent text-bg font-body text-xs font-medium"
        >
          Crear mi primer hábito <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  if (dueToday.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-bg p-3 text-center">
        <p className="font-body text-sm text-muted">
          Sin hábitos para hoy según tu frecuencia. ✓
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {visible.map((h) => {
        const isDoneToday = logs.some(
          (l) => l.habit_id === h.id && l.completed_at === today
        );
        return (
          <li key={h.id}>
            <button
              type="button"
              onClick={() =>
                toggle.mutate({
                  habitId: h.id,
                  isCompleted: isDoneToday,
                  date: today,
                })
              }
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                isDoneToday
                  ? "border-success/30 bg-success/5"
                  : "border-line bg-bg hover:border-line-strong"
              )}
            >
              <span
                className={clsx(
                  "h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                  isDoneToday
                    ? "bg-success text-white"
                    : "bg-bg-alt text-muted border border-line"
                )}
              >
                {isDoneToday ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <span className="text-base">{h.icon}</span>
                )}
              </span>
              <span
                className={clsx(
                  "font-body text-sm truncate flex-1",
                  isDoneToday ? "text-muted line-through" : "text-ink"
                )}
              >
                {h.name}
              </span>
            </button>
          </li>
        );
      })}
      {dueToday.length > limit && (
        <li>
          <Link
            href="/habitos"
            className="block text-center font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink py-2"
          >
            +{dueToday.length - limit} más en /habitos →
          </Link>
        </li>
      )}
    </ul>
  );
}
