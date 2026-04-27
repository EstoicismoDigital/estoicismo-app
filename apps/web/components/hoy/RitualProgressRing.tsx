"use client";
import { clsx } from "clsx";
import {
  SECTION_EMOJIS,
  SECTION_LABELS,
  type RitualStatus,
} from "../../lib/hoy/ritual";

/**
 * Ring de progreso del ritual del día. Muestra cuántas secciones
 * completadas / disponibles, y debajo emojis de cada sección con
 * el estado (gris no hecho, color cuando hecho).
 *
 * Tamaño compacto vertical → cabe en hero del /hoy sin dominar.
 */
export function RitualProgressRing({
  status,
  streak,
  size = 88,
  onJump,
}: {
  status: RitualStatus;
  streak: number;
  size?: number;
  onJump?: (sectionId: string) => void;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - status.ratio);
  const pct = Math.round(status.ratio * 100);

  return (
    <div className="flex items-center gap-4">
      {/* Ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={4}
            fill="none"
            className="text-line"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={4}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={clsx(
              "transition-all duration-500",
              status.ritualMet ? "text-success" : "text-accent"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display italic text-xl text-ink leading-none tabular-nums">
            {status.completedCount}
            <span className="text-muted text-sm">/{status.availableCount}</span>
          </p>
          <p className="font-mono text-[8px] uppercase tracking-widest text-muted mt-0.5">
            {pct}%
          </p>
        </div>
      </div>

      {/* Sections + streak */}
      <div className="flex-1 min-w-0">
        {streak > 0 && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1.5">
            🔥 {streak}d ritual
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {status.sections
            .filter((s) => s.available)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onJump?.(s.id)}
                title={SECTION_LABELS[s.id]}
                className={clsx(
                  "h-7 w-7 rounded-full border text-[12px] flex items-center justify-center transition-all",
                  s.done
                    ? "border-accent bg-accent/15 grayscale-0"
                    : "border-line bg-bg grayscale opacity-50 hover:opacity-80 hover:grayscale-0"
                )}
              >
                {SECTION_EMOJIS[s.id]}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
