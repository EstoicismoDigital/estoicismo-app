"use client";
import { getHeaderDateStr } from "../../lib/dateUtils";
import { useDailyQuote } from "../../hooks/useDailyQuote";
import { useProfile } from "../../hooks/useProfile";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Buenas noches";
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function DailyHeader({
  completedToday,
  totalHabits,
  dueToday,
}: {
  completedToday: number;
  totalHabits: number;
  /** How many habits are scheduled for today. Falls back to totalHabits if omitted. */
  dueToday?: number;
}) {
  const { data: quote } = useDailyQuote();
  const { data: profile } = useProfile();
  const dateStr = getHeaderDateStr();
  const greeting = getGreeting();
  const username = profile?.username?.trim() || null;

  const due = dueToday ?? totalHabits;
  const pct = due === 0 ? 0 : Math.min(100, Math.round((completedToday / due) * 100));
  const allDone = due > 0 && completedToday >= due;

  return (
    <section className="bg-bg-deep text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-accent mb-2">
          Hábitos · {dateStr}
        </p>

        <p className="font-display italic text-white/90 text-xl sm:text-2xl mb-5 leading-snug">
          {greeting}
          {username ? (
            <>
              , <span className="text-accent not-italic">{username}</span>
            </>
          ) : null}
          .
        </p>

        <blockquote className="font-display italic text-[22px] sm:text-3xl text-white leading-snug mb-6">
          &ldquo;{quote?.text ?? "El obstáculo es el camino."}&rdquo;
          <footer className="mt-2 font-body not-italic text-xs text-white/60 tracking-wide">
            — {quote?.author ?? "Marco Aurelio"}
          </footer>
        </blockquote>

        <div className="pt-4 border-t border-white/10">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-5xl sm:text-6xl text-accent leading-none tabular-nums">
              {completedToday}
            </span>
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-white/60">
              {totalHabits === 0
                ? "Sin hábitos todavía"
                : due === 0
                  ? "Ninguno programado hoy"
                  : allDone
                    ? "Día completo"
                    : `De ${due} ${due === 1 ? "hábito" : "hábitos"} hoy`}
            </p>
          </div>

          {totalHabits > 0 && due > 0 && (
            <div
              className="mt-4 h-1.5 w-full max-w-xs rounded-full bg-white/10 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={due}
              aria-valuenow={completedToday}
              aria-label={`${completedToday} de ${due} hábitos completados`}
            >
              <div
                className="h-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
