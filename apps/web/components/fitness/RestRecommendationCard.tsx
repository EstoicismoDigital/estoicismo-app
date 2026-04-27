"use client";
import { useMemo } from "react";
import { Bed, Dumbbell, ArrowRight, Flame, Pause } from "lucide-react";
import { clsx } from "clsx";
import { useWorkouts } from "../../hooks/useFitness";
import { computeRestRecommendation } from "../../lib/fitness/rest-day";

/**
 * Recomendación de descanso/entrenar — apparece como banner sutil
 * en /habitos/fitness antes de los logs. Detecta días consecutivos
 * y sugiere acción honesta sin ser un coach.
 */
export function RestRecommendationCard() {
  const { data: workouts = [] } = useWorkouts({ limit: 14 });

  const rec = useMemo(() => {
    try {
      return computeRestRecommendation(workouts);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Rest recommendation failed:", err);
      return null;
    }
  }, [workouts]);

  if (!rec) return null;
  // No mostrar nada si solo dice "go" (default neutral) — para que
  // el banner solo aparezca cuando hay algo que decir.
  if (rec.kind === "go" && rec.consecutiveDays <= 1) return null;

  const palette = {
    rest: {
      bg: "bg-accent/10",
      text: "text-ink",
      border: "border-accent/40",
      icon: <Bed size={14} className="text-accent" />,
      label: "Día de descanso",
    },
    moderate: {
      bg: "bg-accent/5",
      text: "text-ink",
      border: "border-accent/30",
      icon: <Pause size={14} className="text-accent" />,
      label: "Modera",
    },
    comeback: {
      bg: "bg-bg-alt/60",
      text: "text-ink",
      border: "border-line",
      icon: <ArrowRight size={14} className="text-accent" />,
      label: "Vuelve suave",
    },
    go: {
      bg: "bg-success/5",
      text: "text-ink",
      border: "border-success/30",
      icon: <Flame size={14} className="text-success" />,
      label: "Entra",
    },
  };
  const style = palette[rec.kind];

  return (
    <div
      className={clsx(
        "rounded-card border p-4 sm:p-5 flex items-start gap-3",
        style.border,
        style.bg
      )}
    >
      <div className="h-9 w-9 rounded-full bg-bg flex items-center justify-center shrink-0">
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
          {style.label}
        </p>
        <p className={clsx("font-body text-sm leading-relaxed", style.text)}>
          {rec.message}
        </p>
        {(rec.consecutiveDays > 0 || rec.daysSinceLast !== null) && (
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2 inline-flex items-center gap-3 flex-wrap">
            {rec.consecutiveDays > 1 && (
              <span className="inline-flex items-center gap-1">
                <Dumbbell size={10} /> {rec.consecutiveDays}d seguidos
              </span>
            )}
            {rec.daysSinceLast !== null && rec.daysSinceLast > 0 && (
              <span>{rec.daysSinceLast}d desde último</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
