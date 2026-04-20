"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Flame, Calendar, NotebookPen, ChevronRight } from "lucide-react";
import { useHabits } from "../../../hooks/useHabits";
import { computeWeekReview, STOIC_PROMPTS } from "../../../lib/weekReview";
import { getCurrentWeekDays } from "../../../lib/dateUtils";

export function RevisionClient() {
  const { habits, logs, isLoading } = useHabits();

  const review = useMemo(
    () => computeWeekReview(habits, logs),
    [habits, logs]
  );
  const weekLabel = useMemo(() => {
    const days = getCurrentWeekDays();
    const first = fmtShort(days[0].date);
    const last = fmtShort(days[6].date);
    return `${first} – ${last}`;
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Revisión semanal
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl">
            Mira hacia atrás
          </h1>
          <p className="font-body text-white/60 text-sm mt-2 max-w-prose">
            Semana del{" "}
            <span className="font-mono text-white/80 tabular-nums">
              {weekLabel}
            </span>
            . Detenerse un instante para ver lo caminado es parte del camino.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-10">
        {isLoading ? (
          <Skeleton />
        ) : habits.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <StatRow
              totalCompletions={review.totalCompletions}
              activeDays={review.activeDays}
              notedCompletions={review.notedCompletions}
            />
            <TopHabitCard review={review} />
            <PromptCard promptIndex={review.promptIndex} />
            <HabitBreakdown perHabit={review.perHabit} />
          </>
        )}
      </section>
    </div>
  );
}

function StatRow({
  totalCompletions,
  activeDays,
  notedCompletions,
}: {
  totalCompletions: number;
  activeDays: number;
  notedCompletions: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      <StatCard
        Icon={Flame}
        label="Completados"
        value={totalCompletions}
      />
      <StatCard Icon={Calendar} label="Días activos" value={activeDays} />
      <StatCard
        Icon={NotebookPen}
        label="Reflexiones"
        value={notedCompletions}
      />
    </div>
  );
}

function StatCard({
  Icon,
  label,
  value,
}: {
  Icon: typeof Flame;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-card bg-bg-alt border border-line p-4 sm:p-5 flex flex-col gap-2">
      <span
        aria-hidden
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent"
      >
        <Icon size={14} />
      </span>
      <span className="font-display text-3xl sm:text-4xl text-ink tabular-nums leading-none">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </span>
    </div>
  );
}

function TopHabitCard({
  review,
}: {
  review: ReturnType<typeof computeWeekReview>;
}) {
  if (!review.topHabit) {
    return (
      <div className="rounded-card border border-line bg-bg-alt/40 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
          Esta semana
        </p>
        <h2 className="font-display italic text-2xl text-ink mb-1">
          Aún no hay completados
        </h2>
        <p className="font-body text-sm text-muted leading-relaxed">
          Empieza hoy marcando un hábito. La semana todavía no termina.
        </p>
      </div>
    );
  }
  const top = review.topHabit;
  const row = review.perHabit[0];
  return (
    <Link
      href={`/habitos/${top.id}`}
      className="block rounded-card border border-accent/30 bg-bg-alt p-5 hover:border-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
        Hábito destacado
      </p>
      <div className="flex items-center gap-3">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${top.color}22`, color: top.color }}
          aria-hidden
        >
          <span>{top.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display italic text-2xl text-ink truncate">
            {top.name}
          </h2>
          <p className="font-body text-sm text-muted">
            {row.completions}{" "}
            {row.completions === 1 ? "completado" : "completados"} esta semana
            {row.notes > 0 && (
              <>
                {" · "}
                {row.notes} {row.notes === 1 ? "nota" : "notas"}
              </>
            )}
          </p>
        </div>
        <ChevronRight size={18} className="text-muted" aria-hidden />
      </div>
    </Link>
  );
}

function PromptCard({ promptIndex }: { promptIndex: number }) {
  const prompt = STOIC_PROMPTS[promptIndex];
  return (
    <div className="rounded-card border border-line bg-bg p-6 sm:p-7">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
        Pregúntate
      </p>
      <blockquote className="font-display italic text-xl sm:text-2xl text-ink leading-snug mb-4">
        &ldquo;{prompt}&rdquo;
      </blockquote>
      <p className="font-body text-sm text-muted leading-relaxed mb-5">
        Escribe tu respuesta en la nota de algún hábito — así queda junto al
        día en que la pensaste, y la encontrarás más adelante.
      </p>
      <Link
        href="/notas"
        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] h-11 px-5 rounded-lg bg-ink text-bg font-body text-sm hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <NotebookPen size={14} aria-hidden />
        Ver mis notas
      </Link>
    </div>
  );
}

function HabitBreakdown({
  perHabit,
}: {
  perHabit: ReturnType<typeof computeWeekReview>["perHabit"];
}) {
  if (perHabit.length === 0) return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
        Tus 7 días
      </p>
      <h2 className="font-display italic text-2xl text-ink mb-5">
        Por hábito
      </h2>
      <ul className="flex flex-col gap-2" role="list">
        {perHabit.map(({ habit, completions, notes }) => (
          <li key={habit.id}>
            <Link
              href={`/habitos/${habit.id}`}
              className="group flex items-center gap-3 px-4 py-3 rounded-card bg-bg-alt border border-line hover:border-accent/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                {notes > 0 && (
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-0.5">
                    {notes} {notes === 1 ? "nota" : "notas"}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-baseline gap-1">
                <span className="font-display text-2xl text-ink tabular-nums leading-none">
                  {completions}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  /7
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
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-card bg-bg-alt border border-line animate-pulse"
          />
        ))}
      </div>
      <div className="h-28 rounded-card bg-bg-alt border border-line animate-pulse" />
      <div className="h-40 rounded-card bg-bg-alt border border-line animate-pulse" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-8 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
        Sin datos
      </p>
      <h2 className="font-display italic text-2xl text-ink mb-2">
        Primero, siembra un hábito
      </h2>
      <p className="font-body text-sm text-muted mb-4 max-w-md mx-auto leading-relaxed">
        Vuelve aquí cuando tengas completados esta semana — te esperaré con
        la pregunta correcta.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-accent text-bg font-body text-sm hover:opacity-90 transition-opacity"
      >
        Ir a Hoy
      </Link>
    </div>
  );
}

function fmtShort(ymd: string): string {
  const [_, mm, dd] = ymd.split("-");
  return `${Number(dd)}/${Number(mm)}`;
}
