"use client";
import { getHeaderDateStr } from "../../lib/dateUtils";
import { useDailyQuote } from "../../hooks/useDailyQuote";

export function DailyHeader({
  completedToday,
  totalHabits,
}: {
  completedToday: number;
  totalHabits: number;
}) {
  const { data: quote } = useDailyQuote();
  const dateStr = getHeaderDateStr();

  return (
    <section className="bg-bg-deep text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-accent mb-4">
          {dateStr}
        </p>

        <blockquote className="font-display italic text-[22px] sm:text-3xl text-white leading-snug mb-6">
          &ldquo;{quote?.text ?? "El obstáculo es el camino."}&rdquo;
          <footer className="mt-2 font-body not-italic text-xs text-white/60 tracking-wide">
            — {quote?.author ?? "Marco Aurelio"}
          </footer>
        </blockquote>

        <div className="flex items-baseline gap-3 pt-4 border-t border-white/10">
          <span className="font-display text-5xl sm:text-6xl text-accent leading-none tabular-nums">
            {completedToday}
          </span>
          <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-white/60">
            {totalHabits === 0
              ? "Sin hábitos todavía"
              : `De ${totalHabits} ${totalHabits === 1 ? "hábito" : "hábitos"} completados`}
          </p>
        </div>
      </div>
    </section>
  );
}
