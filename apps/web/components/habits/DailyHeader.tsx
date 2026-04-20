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
}: {
  completedToday: number;
  totalHabits: number;
}) {
  const { data: quote } = useDailyQuote();
  const { data: profile } = useProfile();
  const dateStr = getHeaderDateStr();
  const greeting = getGreeting();
  const username = profile?.username?.trim() || null;

  return (
    <section className="bg-bg-deep text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-accent mb-2">
          {dateStr}
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
