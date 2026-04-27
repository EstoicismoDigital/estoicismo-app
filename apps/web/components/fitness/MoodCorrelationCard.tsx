"use client";
import { useMemo } from "react";
import { HeartPulse, Loader2, Dumbbell, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { useWorkouts } from "../../hooks/useFitness";
import { useMoodLogs } from "../../hooks/useMindset";
import { computeMoodCorrelation } from "../../lib/fitness/mood-correlation";

/**
 * MoodCorrelationCard · "Tu mood × entrenar".
 *
 * Compara mood promedio en días con workout vs días sin. Insight
 * inmediato sobre si entrenar realmente te sube el ánimo o no.
 *
 * Datos: últimos 60 días. Requiere al menos 3 días de cada lado
 * con mood registrado para mostrar resultados.
 */
export function MoodCorrelationCard() {
  const range = useMemo(() => {
    const today = new Date();
    const sixty = new Date(today);
    sixty.setDate(sixty.getDate() - 60);
    return {
      from: sixty.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
    };
  }, []);

  const { data: workouts = [], isLoading: lw } = useWorkouts({
    from: range.from,
    to: range.to,
  });
  const { data: moods = [], isLoading: lm } = useMoodLogs({
    from: range.from,
    to: range.to,
  });

  const corr = useMemo(
    () => computeMoodCorrelation(workouts, moods),
    [workouts, moods]
  );

  if (lw || lm) {
    return (
      <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6 flex items-center justify-center min-h-[120px]">
        <Loader2 size={18} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <HeartPulse size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Mood × entrenar · últ. 60 días
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Two columns: workout vs rest */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <ColumnStat
          icon={<Dumbbell size={12} />}
          label="Días entrenando"
          value={
            corr.workoutMoodAvg !== null ? `${corr.workoutMoodAvg}/5` : "—"
          }
          sub={`${corr.workoutDays} días`}
          highlight={
            corr.delta !== null && corr.delta > 0.1
              ? "good"
              : corr.delta !== null && corr.delta < -0.1
                ? "bad"
                : null
          }
        />
        <ColumnStat
          icon={<HeartPulse size={12} />}
          label="Días de descanso"
          value={corr.restMoodAvg !== null ? `${corr.restMoodAvg}/5` : "—"}
          sub={`${corr.restDays} días`}
        />
      </div>

      {/* Delta visualization */}
      {corr.delta !== null && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={clsx(
              "font-display italic text-xl tabular-nums",
              corr.delta > 0.1
                ? "text-success"
                : corr.delta < -0.1
                  ? "text-danger"
                  : "text-muted"
            )}
          >
            {corr.delta > 0 ? "+" : ""}
            {corr.delta}
          </span>
          <ArrowRight size={12} className="text-muted" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            diferencia mood
          </span>
        </div>
      )}

      <p className="mt-4 font-body text-sm text-muted leading-relaxed border-l-2 border-accent/30 pl-3">
        {corr.insight}
      </p>
    </div>
  );
}

function ColumnStat({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: "good" | "bad" | null;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-3 transition-colors",
        highlight === "good"
          ? "border-success/30 bg-success/5"
          : highlight === "bad"
            ? "border-danger/30 bg-danger/5"
            : "border-line bg-bg"
      )}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted inline-flex items-center gap-1 mb-1">
        {icon}
        {label}
      </p>
      <p className="font-display italic text-2xl text-ink tabular-nums">
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-0.5">
        {sub}
      </p>
    </div>
  );
}
