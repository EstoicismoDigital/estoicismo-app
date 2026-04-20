"use client";
import { useMemo, useState } from "react";
import { Flame, Target, NotebookPen, Lock, Check } from "lucide-react";
import { clsx } from "clsx";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import { computeAchievements, type Achievement } from "../../lib/achievements";

const CATEGORY_META: Record<
  Achievement["category"],
  { label: string; Icon: typeof Flame; lockedBg: string; unlockedBg: string }
> = {
  streak: {
    label: "Rachas",
    Icon: Flame,
    lockedBg: "bg-bg-alt",
    unlockedBg: "bg-accent/10",
  },
  volume: {
    label: "Constancia",
    Icon: Target,
    lockedBg: "bg-bg-alt",
    unlockedBg: "bg-accent/10",
  },
  reflection: {
    label: "Reflexiones",
    Icon: NotebookPen,
    lockedBg: "bg-bg-alt",
    unlockedBg: "bg-accent/10",
  },
};

/** Format an unlockedAt date as "12 Abr" for compact display. */
function formatUnlockDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function AchievementsPanel({
  habits,
  logs,
}: {
  habits: Habit[];
  logs: HabitLog[];
}) {
  const achievements = useMemo(
    () => computeAchievements(habits, logs),
    [habits, logs]
  );
  const unlocked = achievements.filter((a) => a.unlocked);
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  const visible = showOnlyUnlocked ? unlocked : achievements;

  return (
    <section aria-labelledby="logros-heading">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
        Logros
      </p>
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <h2
          id="logros-heading"
          className="font-display italic text-2xl text-ink"
        >
          Insignias
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted tabular-nums">
          {unlocked.length}/{achievements.length}
        </span>
      </div>

      {/* Toggle: filter to unlocked only */}
      {unlocked.length > 0 && (
        <div className="flex gap-2 mb-5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!showOnlyUnlocked}
            onClick={() => setShowOnlyUnlocked(false)}
            className={clsx(
              "inline-flex items-center min-h-[36px] h-9 px-3 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              !showOnlyUnlocked
                ? "bg-ink text-bg"
                : "bg-bg-alt text-muted hover:text-ink"
            )}
          >
            Todas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={showOnlyUnlocked}
            onClick={() => setShowOnlyUnlocked(true)}
            className={clsx(
              "inline-flex items-center min-h-[36px] h-9 px-3 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              showOnlyUnlocked
                ? "bg-ink text-bg"
                : "bg-bg-alt text-muted hover:text-ink"
            )}
          >
            Desbloqueadas
          </button>
        </div>
      )}

      <ul
        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
        role="list"
        aria-label="Lista de logros"
      >
        {visible.map((a) => (
          <li key={a.id}>
            <BadgeCard achievement={a} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function BadgeCard({ achievement }: { achievement: Achievement }) {
  const meta = CATEGORY_META[achievement.category];
  const Icon = meta.Icon;
  const pct = Math.min(
    100,
    Math.round((achievement.progress / achievement.target) * 100)
  );

  return (
    <div
      className={clsx(
        "h-full flex flex-col p-3 sm:p-4 rounded-card border transition-colors",
        achievement.unlocked
          ? "bg-bg-alt border-accent/30"
          : "bg-bg border-line"
      )}
      aria-label={
        achievement.unlocked
          ? `${achievement.title} — desbloqueado`
          : `${achievement.title} — ${pct}% completado`
      }
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={clsx(
            "inline-flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
            achievement.unlocked
              ? "bg-accent text-bg"
              : "bg-bg-alt text-muted"
          )}
          aria-hidden
        >
          {achievement.unlocked ? (
            <Icon size={14} strokeWidth={2} />
          ) : (
            <Lock size={13} strokeWidth={1.8} />
          )}
        </span>
        {achievement.unlocked && achievement.unlockedAt && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-accent flex items-center gap-1">
            <Check size={10} strokeWidth={2.5} aria-hidden />
            {formatUnlockDate(achievement.unlockedAt)}
          </span>
        )}
      </div>

      <h3
        className={clsx(
          "font-body text-[13px] font-medium leading-tight mb-0.5",
          achievement.unlocked ? "text-ink" : "text-muted"
        )}
      >
        {achievement.title}
      </h3>
      <p className="font-body text-[11px] text-muted leading-snug flex-1">
        {achievement.description}
      </p>

      {!achievement.unlocked && (
        <div className="mt-3">
          <div
            className="h-1 rounded-full bg-line overflow-hidden"
            role="progressbar"
            aria-valuenow={achievement.progress}
            aria-valuemin={0}
            aria-valuemax={achievement.target}
            aria-label={`Progreso: ${achievement.progress} de ${achievement.target}`}
          >
            <div
              className="h-full bg-accent/60 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted tabular-nums mt-1">
            {achievement.progress}/{achievement.target}
          </p>
        </div>
      )}
    </div>
  );
}
