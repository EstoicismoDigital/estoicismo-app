"use client";
import { useMemo } from "react";
import {
  TrendingUp,
  Minus,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import {
  useExercises,
  useAllUserSets,
  useWorkouts,
} from "../../hooks/useFitness";
import { computeOverloadSuggestions } from "../../lib/fitness/progressive-overload";

/**
 * Progressive Overload Card · sugerencias de "subir / mantener / deload"
 * por ejercicio basadas en las últimas 2-3 sesiones.
 *
 * Heurística simple, no AI. El user puede ignorar — es una pista, no
 * una orden.
 *
 * Si no hay sets registrados, no renderiza.
 */
export function ProgressiveOverloadCard() {
  const { data: exercises = [] } = useExercises();
  const { data: sets = [] } = useAllUserSets({ limit: 500 });
  const { data: workouts = [] } = useWorkouts({ limit: 60 });

  const suggestions = useMemo(() => {
    try {
      return computeOverloadSuggestions(sets, exercises, workouts);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Overload suggestions failed:", err);
      return [];
    }
  }, [sets, exercises, workouts]);

  if (suggestions.length === 0) return null;

  // Top 5 suggestions (priorizando "up")
  const top = suggestions.slice(0, 5);

  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Próximo paso · sobrecarga progresiva
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="font-body text-sm text-muted mb-4 leading-relaxed">
        Basado en tus últimas sesiones. Heurística simple — el músculo
        crece cuando le pides más, sosteniéndolo.
      </p>
      <ul className="space-y-2">
        {top.map((s) => (
          <li
            key={s.exerciseId}
            className={clsx(
              "rounded-lg border p-3",
              s.action === "up"
                ? "border-success/30 bg-success/5"
                : s.action === "deload"
                  ? "border-danger/30 bg-danger/5"
                  : "border-line bg-bg"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <ActionIcon action={s.action} />
              <p className="font-body text-sm font-medium text-ink flex-1 truncate">
                {s.exerciseName}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted shrink-0">
                {s.sessionCount} {s.sessionCount === 1 ? "sesión" : "sesiones"}
              </p>
            </div>
            <div className="flex items-baseline gap-2 ml-7">
              <p className="font-display italic text-lg text-ink tabular-nums">
                {s.currentWeight}kg
              </p>
              <span className="font-mono text-[10px] text-muted">→</span>
              <p
                className={clsx(
                  "font-display italic text-lg tabular-nums",
                  s.action === "up"
                    ? "text-success"
                    : s.action === "deload"
                      ? "text-danger"
                      : "text-ink"
                )}
              >
                {s.suggestedWeight}kg
              </p>
              {s.action === "up" && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-success">
                  +{(s.suggestedWeight - s.currentWeight).toFixed(1)}kg
                </span>
              )}
              {s.action === "deload" && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-danger">
                  -{(s.currentWeight - s.suggestedWeight).toFixed(1)}kg
                </span>
              )}
            </div>
            <p className="font-body text-xs text-muted mt-1.5 ml-7 leading-snug">
              {s.reason}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionIcon({ action }: { action: "up" | "hold" | "deload" }) {
  if (action === "up")
    return (
      <span className="h-5 w-5 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0">
        <TrendingUp size={11} />
      </span>
    );
  if (action === "deload")
    return (
      <span className="h-5 w-5 rounded-full bg-danger/20 text-danger flex items-center justify-center shrink-0">
        <TrendingDown size={11} />
      </span>
    );
  return (
    <span className="h-5 w-5 rounded-full bg-bg-alt text-muted flex items-center justify-center shrink-0">
      <Minus size={11} />
    </span>
  );
}
