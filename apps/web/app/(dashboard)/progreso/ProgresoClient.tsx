"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame, ChevronRight } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";
import {
  fetchHabits,
  fetchHabitLogs,
  type Habit,
  type HabitLog,
} from "@estoicismo/supabase";
import { InsightsPanel } from "../../../components/habits/InsightsPanel";
import { AchievementsPanel } from "../../../components/habits/AchievementsPanel";
import {
  computeStreak,
  computeLongestStreak,
  getTodayStr,
} from "../../../lib/dateUtils";

function shiftDay(dateStr: string, deltaDays: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + deltaDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getHistoryRange(days: number): { from: string; to: string } {
  const to = getTodayStr();
  const from = shiftDay(to, -(days - 1));
  return { from, to };
}

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

const HEATMAP_DAYS = 91; // 13 weeks x 7 days

export function ProgresoClient() {
  const today = getTodayStr();
  const { from, to } = useMemo(() => getHistoryRange(HEATMAP_DAYS), []);

  const habitsQ = useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchHabits(sb, await getUserId());
    },
  });

  const logsQ = useQuery<HabitLog[]>({
    queryKey: ["progreso-logs", from, to],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchHabitLogs(sb, await getUserId(), from, to);
    },
  });

  const habits = habitsQ.data ?? [];
  const logs = logsQ.data ?? [];
  const loading = habitsQ.isLoading || logsQ.isLoading;

  const perHabitStreaks = useMemo(() => {
    const rows = habits.map((h) => {
      const dates = logs
        .filter((l) => l.habit_id === h.id)
        .map((l) => l.completed_at);
      return {
        habit: h,
        streak: computeStreak(dates),
        bestStreak: computeLongestStreak(dates),
        totalLogs: dates.length,
      };
    });
    rows.sort(
      (a, b) =>
        b.streak - a.streak ||
        b.bestStreak - a.bestStreak ||
        b.totalLogs - a.totalLogs
    );
    return rows;
  }, [habits, logs]);

  const heatmapWeeks = useMemo(
    () => buildHeatmap(logs, today, HEATMAP_DAYS),
    [logs, today]
  );

  return (
    <div className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Tu camino
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl">Progreso</h1>
          <p className="font-body text-sm text-white/70 mt-3 max-w-lg leading-relaxed">
            Una mirada honesta a tus últimos 90 días. Lo que midas, podrás
            mejorarlo.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-10">
        {loading ? (
          <SkeletonBlock />
        ) : habits.length === 0 ? (
          <EmptyProgress />
        ) : (
          <>
            {/* Reuse the insights panel card set but strip its own heading */}
            <InsightsPanel habits={habits} logs={logs} />

            {/* Per-habit active streaks */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
                Por hábito
              </p>
              <h2 className="font-display italic text-2xl text-ink mb-5">
                Rachas activas
              </h2>
              {perHabitStreaks.length === 0 ? (
                <p className="font-body text-sm text-muted">
                  Aún no tienes rachas. Empieza hoy.
                </p>
              ) : (
                <ul
                  className="flex flex-col gap-2"
                  role="list"
                  aria-label="Rachas por hábito"
                >
                  {perHabitStreaks.map(({ habit, streak, bestStreak, totalLogs }) => (
                    <li key={habit.id}>
                      <Link
                        href={`/habitos/${habit.id}`}
                        className="group flex items-center gap-3 px-4 py-3 rounded-card bg-bg-alt border border-line/60 hover:border-accent/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        aria-label={`Ver detalle de ${habit.name}`}
                      >
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
                          style={{
                            backgroundColor: `${habit.color}22`,
                            color: habit.color,
                          }}
                          aria-hidden
                        >
                          <span>{habit.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-ink truncate">
                            {habit.name}
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-0.5">
                            {bestStreak > 0 ? (
                              <>
                                Mejor: {bestStreak}{" "}
                                {bestStreak === 1 ? "día" : "días"}
                                {" · "}
                              </>
                            ) : null}
                            {totalLogs}{" "}
                            {totalLogs === 1 ? "registro" : "registros"} en 90d
                          </p>
                        </div>
                        <div className="flex-shrink-0 inline-flex items-baseline gap-1">
                          {streak > 0 && (
                            <Flame
                              size={14}
                              className="text-accent self-center"
                              aria-hidden
                            />
                          )}
                          <span
                            className="font-display text-2xl text-ink tabular-nums leading-none"
                            aria-label={`Racha: ${streak} ${streak === 1 ? "día" : "días"}`}
                          >
                            {streak}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                            {streak === 1 ? "día" : "días"}
                          </span>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-muted group-hover:text-accent transition-colors"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Achievements */}
            <AchievementsPanel habits={habits} logs={logs} />

            {/* Heatmap */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
                Últimos 90 días
              </p>
              <h2 className="font-display italic text-2xl text-ink mb-5">
                Actividad
              </h2>
              <Heatmap
                weeks={heatmapWeeks}
                habitsCount={habits.length}
                today={today}
              />
              <HeatmapLegend maxPerDay={Math.max(1, habits.length)} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card bg-bg-alt p-5 border border-line/60 animate-pulse h-28"
          />
        ))}
      </div>
      <div className="rounded-card bg-bg-alt border border-line/60 animate-pulse h-40" />
    </div>
  );
}

function EmptyProgress() {
  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-8 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
        Sin datos
      </p>
      <h2 className="font-display italic text-2xl text-ink mb-2">
        Tu historia empieza con un hábito
      </h2>
      <p className="font-body text-sm text-muted mb-4 max-w-md mx-auto leading-relaxed">
        Crea tu primer hábito en la pestaña Hoy y vuelve aquí en unos días.
      </p>
      <a
        href="/"
        className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-accent text-white font-body text-sm hover:opacity-90 transition-opacity"
      >
        Ir a Hoy
      </a>
    </div>
  );
}

// --- Heatmap helpers ---

type HeatCell = { date: string; count: number; inRange: boolean };

/**
 * Returns a 13 x 7 grid (weeks x weekdays, Mon-first) for the last `days` days
 * including today. Each cell tells how many completions happened that day and
 * whether it is within the query window (cells before the window are padding).
 */
export function buildHeatmap(
  logs: HabitLog[],
  today: string,
  days: number
): HeatCell[][] {
  // Count completions per date.
  const counts = new Map<string, number>();
  for (const l of logs) {
    counts.set(l.completed_at, (counts.get(l.completed_at) ?? 0) + 1);
  }

  // 1) Real window: from (days-1) ago up to today.
  const flat: HeatCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = shiftDay(today, -i);
    flat.push({ date, count: counts.get(date) ?? 0, inRange: true });
  }

  // 2) Pad trailing days so today's week ends on Sunday.
  const todayDow = monFirstDow(today); // 0..6 (Mon..Sun)
  const trailPad = 6 - todayDow;
  for (let i = 1; i <= trailPad; i++) {
    flat.push({
      date: shiftDay(today, i),
      count: 0,
      inRange: false,
    });
  }

  // Add leading padding so the grid starts on a Monday
  const startDow = monFirstDow(flat[0].date);
  const lead: HeatCell[] = [];
  for (let i = startDow; i > 0; i--) {
    lead.push({
      date: shiftDay(flat[0].date, -i),
      count: 0,
      inRange: false,
    });
  }
  const grid = [...lead, ...flat];

  // Chunk into weeks of 7 (Mon..Sun)
  const weeks: HeatCell[][] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }
  // Keep only the last 13 weeks if padding produced more
  return weeks.slice(-13);
}

/** Monday=0..Sunday=6 for "YYYY-MM-DD". */
function monFirstDow(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const jsDow = d.getDay();
  return jsDow === 0 ? 6 : jsDow - 1;
}

function Heatmap({
  weeks,
  habitsCount,
  today,
}: {
  weeks: HeatCell[][];
  habitsCount: number;
  today: string;
}) {
  const maxPerDay = Math.max(1, habitsCount);
  const labels = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div
      className="inline-grid gap-[3px] overflow-x-auto"
      style={{
        gridTemplateColumns: `auto repeat(${weeks.length}, 12px)`,
      }}
      role="grid"
      aria-label="Mapa de calor de actividad 90 días"
    >
      {/* Header row: first cell blank, then empty spacers (months could go here) */}
      {/* Weekday row labels column */}
      {labels.map((lab, rowIdx) => (
        <div key={`row-${rowIdx}`} className="contents">
          <span
            className="font-mono text-[9px] uppercase tracking-widest text-muted pr-1 flex items-center"
            aria-hidden
          >
            {rowIdx % 2 === 0 ? lab : ""}
          </span>
          {weeks.map((w, colIdx) => {
            const cell = w[rowIdx];
            if (!cell) {
              return <span key={`c-${colIdx}-${rowIdx}`} aria-hidden />;
            }
            const intensity =
              cell.count === 0 ? 0 : Math.min(1, cell.count / maxPerDay);
            const isToday = cell.date === today;
            return (
              <span
                key={`c-${colIdx}-${rowIdx}`}
                role="gridcell"
                aria-label={`${cell.date}: ${cell.count} ${cell.count === 1 ? "completado" : "completados"}`}
                title={`${cell.date} · ${cell.count}`}
                className="w-[12px] h-[12px] rounded-[2px] border"
                style={{
                  backgroundColor: cell.inRange
                    ? intensityColor(intensity)
                    : "transparent",
                  borderColor: isToday
                    ? "var(--tw-color-accent, #8B6F47)"
                    : cell.inRange
                      ? "transparent"
                      : "transparent",
                  outline: isToday ? "1px solid #8B6F47" : undefined,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function intensityColor(t: number): string {
  // 0 → soft line; 1 → accent gold. Clamp [0,1].
  const c = Math.max(0, Math.min(1, t));
  if (c === 0) return "#EDE6DB"; // line-ish
  // Interpolate from #F0E5D0 → #8B6F47
  const from = [240, 229, 208];
  const to = [139, 111, 71];
  const r = Math.round(from[0] + (to[0] - from[0]) * c);
  const g = Math.round(from[1] + (to[1] - from[1]) * c);
  const b = Math.round(from[2] + (to[2] - from[2]) * c);
  return `rgb(${r}, ${g}, ${b})`;
}

function HeatmapLegend({ maxPerDay }: { maxPerDay: number }) {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
        Menos
      </span>
      <div className="flex gap-[3px]">
        {steps.map((s) => (
          <span
            key={s}
            className="w-[12px] h-[12px] rounded-[2px]"
            style={{ backgroundColor: intensityColor(s) }}
            aria-hidden
          />
        ))}
      </div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
        Más
      </span>
      <span className="sr-only">
        Intensidad basada en completados por día (máx {maxPerDay}).
      </span>
    </div>
  );
}
