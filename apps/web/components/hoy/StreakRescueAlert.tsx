"use client";
import { useEffect, useMemo, useState } from "react";
import { Flame, Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useHabits, useAllHabitLogs, useToggleHabit } from "../../hooks/useHabits";
import { getTodayStr } from "../../lib/dateUtils";

/**
 * StreakRescueAlert · alerta para no romper rachas activas.
 *
 * Reglas:
 *  - Aparece solo después de las 18:00 (configurable abajo).
 *  - Lista hábitos que tienen racha activa de >= 3 días Y no se han
 *    completado hoy.
 *  - Cada uno tiene un botón "Listo" que toggle el hábito como hecho
 *    (mismo flow que la lista de hábitos).
 *
 * Si no hay nada en riesgo, no renderiza.
 */

const SHOW_AFTER_HOUR = 18;
const MIN_STREAK_TO_RESCUE = 3;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

export function StreakRescueAlert() {
  const today = getTodayStr();
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const { habits = [] } = useHabits();
  // Logs de últimos 60 días para calcular racha
  const { data: logs = [] } = useAllHabitLogs(daysAgoIso(60), today);
  const toggle = useToggleHabit();

  const atRisk = useMemo(() => {
    if (hour === null || hour < SHOW_AFTER_HOUR) return [];
    if (!habits.length) return [];

    // Index logs por habit
    const byHabit = new Map<string, Set<string>>();
    for (const l of logs) {
      const set = byHabit.get(l.habit_id) ?? new Set();
      set.add(l.completed_at);
      byHabit.set(l.habit_id, set);
    }

    function calcStreak(habitId: string): number {
      const dates = byHabit.get(habitId);
      if (!dates) return 0;
      let streak = 0;
      const cursor = new Date();
      // Si hoy NO está, partimos contando desde ayer (la racha sigue
      // viva hasta media noche).
      if (!dates.has(today)) {
        cursor.setDate(cursor.getDate() - 1);
      }
      while (true) {
        const iso = isoDate(cursor);
        if (dates.has(iso)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    }

    const out: { id: string; name: string; icon: string; streak: number }[] = [];
    for (const h of habits) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const habit = h as any;
      if (habit.is_archived) continue;
      const dates = byHabit.get(habit.id) ?? new Set();
      if (dates.has(today)) continue; // ya hecho hoy
      const streak = calcStreak(habit.id);
      if (streak < MIN_STREAK_TO_RESCUE) continue;
      out.push({
        id: habit.id,
        name: habit.name,
        icon: habit.icon ?? "✦",
        streak,
      });
    }
    // Más en riesgo primero (mayor racha = más a perder)
    return out.sort((a, b) => b.streak - a.streak);
  }, [habits, logs, hour, today]);

  if (atRisk.length === 0) return null;

  return (
    <section className="rounded-card border border-warning/40 bg-warning/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={14} className="text-warning" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-warning">
          Rachas en riesgo
        </p>
        <span className="h-px flex-1 bg-warning/30" />
      </div>

      <p className="font-body text-xs text-muted leading-relaxed mb-3">
        {atRisk.length === 1
          ? "Te queda 1 hábito por hacer hoy con racha activa."
          : `Te quedan ${atRisk.length} hábitos por hacer hoy con racha activa.`}{" "}
        Si los completas hoy, mantienes el hilo.
      </p>

      <ul className="space-y-2">
        {atRisk.map((h) => (
          <RescueRow
            key={h.id}
            name={h.name}
            icon={h.icon}
            streak={h.streak}
            onComplete={async () => {
              try {
                await toggle.mutateAsync({
                  habitId: h.id,
                  isCompleted: false, // actualmente NO está completed → toggle a true
                });
              } catch {
                /* hook ya muestra error */
              }
            }}
          />
        ))}
      </ul>
    </section>
  );
}

function RescueRow({
  name,
  icon,
  streak,
  onComplete,
}: {
  name: string;
  icon: string;
  streak: number;
  onComplete: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <li className="flex items-center gap-3 py-2 px-3 rounded-md bg-bg border border-line/60">
      <span className="text-base shrink-0" aria-hidden>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-ink truncate">{name}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-warning inline-flex items-center gap-1">
          <Flame size={10} />
          {streak} {streak === 1 ? "día" : "días"} de racha
        </p>
      </div>
      <button
        type="button"
        onClick={async () => {
          setBusy(true);
          try {
            await onComplete();
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        className={clsx(
          "inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-accent text-bg",
          "font-mono text-[10px] uppercase tracking-widest",
          "hover:opacity-90 disabled:opacity-40 transition-opacity"
        )}
      >
        {busy ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Check size={12} />
        )}
        Listo
      </button>
    </li>
  );
}
