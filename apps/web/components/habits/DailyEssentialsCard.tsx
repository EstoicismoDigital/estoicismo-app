"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Dumbbell, BookOpen, ChevronRight, Flame } from "lucide-react";
import {
  useFitnessMetricForDate,
  useWorkouts,
} from "../../hooks/useFitness";
import { useReadingSessions } from "../../hooks/useReading";
import { formatDuration } from "../../lib/reading/stats";

/**
 * Tarjeta cross-module en el dashboard principal de Hábitos:
 * resumen del día para Fitness y Lectura con quick-link.
 *
 * Filosofía: el dashboard de hoy debe responder en 2 segundos a
 * "¿hice mis básicos?" — entrenar y leer.
 */
export function DailyEssentialsCard() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: metric } = useFitnessMetricForDate(today);
  const { data: workouts = [] } = useWorkouts({ from: today, to: today });
  const { data: sessions = [] } = useReadingSessions({ limit: 50 });

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.occurred_on === today),
    [sessions, today]
  );
  const todaySeconds = todaySessions.reduce(
    (s, x) => s + (x.duration_seconds ?? 0),
    0
  );

  const trainedToday = workouts.length > 0;
  const sleptHours = metric?.sleep_hours ?? null;

  return (
    <section
      aria-label="Esenciales del día"
      className="rounded-card border border-line bg-bg-alt/30 p-4 sm:p-5"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
        Esenciales de hoy
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/habitos/fitness"
          className="group rounded-lg border border-line/60 hover:border-accent/40 p-3 transition-colors space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
              Fitness
            </span>
            <Dumbbell size={12} className="text-muted group-hover:text-accent" />
          </div>
          <p className="text-sm font-semibold text-ink leading-tight">
            {trainedToday
              ? `Entrenaste · ${workouts[0]?.name ?? "Sesión"}`
              : "Sin entrenar hoy"}
          </p>
          <p className="text-[11px] text-muted">
            {sleptHours !== null
              ? `${sleptHours}h de sueño`
              : "Sueño sin registrar"}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-accent group-hover:translate-x-0.5 transition-transform">
            <span>{trainedToday ? "Ver sesión" : "Iniciar"}</span>
            <ChevronRight size={11} />
          </div>
        </Link>

        <Link
          href="/habitos/lectura"
          className="group rounded-lg border border-line/60 hover:border-accent/40 p-3 transition-colors space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
              Lectura
            </span>
            <BookOpen size={12} className="text-muted group-hover:text-accent" />
          </div>
          <p className="text-sm font-semibold text-ink leading-tight">
            {todaySeconds > 0
              ? `Leíste ${formatDuration(todaySeconds)}`
              : "Sin leer hoy"}
          </p>
          <p className="text-[11px] text-muted flex items-center gap-1">
            {todaySessions.length > 0 ? (
              <>
                <Flame size={9} className="text-orange-400" />
                {todaySessions.length} sesión{todaySessions.length > 1 ? "es" : ""}
              </>
            ) : (
              "El cronómetro espera"
            )}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-accent group-hover:translate-x-0.5 transition-transform">
            <span>{todaySessions.length > 0 ? "Ver sesiones" : "Empezar"}</span>
            <ChevronRight size={11} />
          </div>
        </Link>
      </div>
    </section>
  );
}
