"use client";
import { useMemo } from "react";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import { computeInsights } from "../../lib/insights";
import { getTodayStr } from "../../lib/dateUtils";

export function InsightsPanel({
  habits,
  logs,
}: {
  habits: Habit[];
  logs: HabitLog[];
}) {
  const today = getTodayStr();
  const insights = useMemo(
    () => computeInsights(habits, logs, today),
    [habits, logs, today]
  );

  if (habits.length === 0) return null;

  return (
    <section
      aria-label="Métricas"
      className="mt-10 pt-8 border-t border-line"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
        Resumen
      </p>
      <h2 className="font-display italic text-2xl text-ink mb-5">
        Tu progreso
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Racha más larga"
          value={String(insights.longestStreak)}
          unit="días consecutivos"
          ariaValue={`${insights.longestStreak} días consecutivos`}
        />
        <StatCard
          label="Completados esta semana"
          value={String(insights.weeklyCompleted)}
          unit={`de ${insights.weeklyTotal}`}
          ariaValue={`${insights.weeklyCompleted} de ${insights.weeklyTotal} posibles`}
        />
        <StatCard
          label="Consistencia 30d"
          value={`${insights.consistency30}`}
          unit="%"
          ariaValue={`${insights.consistency30} por ciento en los últimos 30 días`}
        />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  unit,
  ariaValue,
}: {
  label: string;
  value: string;
  unit: string;
  ariaValue: string;
}) {
  return (
    <div
      className="rounded-card bg-bg-alt p-4 sm:p-5 border border-line/60"
      role="group"
      aria-label={`${label}: ${ariaValue}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-display text-4xl sm:text-5xl text-accent tabular-nums leading-none"
          aria-hidden
        >
          {value}
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-widest text-muted"
          aria-hidden
        >
          {unit}
        </span>
      </div>
    </div>
  );
}
