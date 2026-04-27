"use client";
import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  CalendarRange,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { useHabits, useAllHabitLogs } from "../../hooks/useHabits";
import { useTransactions } from "../../hooks/useFinance";
import { useDefaultCurrency } from "../../hooks/useDefaultCurrency";
import { useMoodLogs } from "../../hooks/useMindset";
import { useReadingSessions } from "../../hooks/useReading";
import { useJournal } from "../../hooks/useJournal";
import { formatMoney } from "../../lib/finance";

/**
 * Weekly Insights · "tu semana en 30s".
 *
 * Compara los últimos 7 días vs los 7 anteriores en 4 dimensiones:
 *   1. Hábitos completados (conteo de habit_logs)
 *   2. Gasto total (transactions kind=expense)
 *   3. Estado de ánimo promedio (mindset_mood_logs)
 *   4. Lecturas / minutos leídos (reading_sessions)
 *
 * + Resumen extra: día con más hábitos completados, días que
 * llevaste diario, mejor racha actual.
 *
 * Diseño: card horizontal con 4 KPIs comparativos. Tono:
 * "esto pasó, decide tú qué hacer". No moraliza.
 */

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

type Delta = {
  current: number;
  previous: number;
  /** Porcentaje firmado (positivo si aumentó, negativo si bajó). */
  pct: number;
};

function computeDelta(current: number, previous: number): Delta {
  if (previous === 0) {
    return { current, previous, pct: current > 0 ? 100 : 0 };
  }
  return {
    current,
    previous,
    pct: Math.round(((current - previous) / previous) * 100),
  };
}

export function WeeklyInsightsCard() {
  // Rangos: últimos 7 días vs 7 anteriores
  const ranges = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startCurrent = daysAgo(6); // hoy + 6 días atrás = 7 días
    const startPrev = daysAgo(13); // 7 más atrás
    const endPrev = daysAgo(7);
    return {
      currentFrom: isoDate(startCurrent),
      currentTo: isoDate(today),
      prevFrom: isoDate(startPrev),
      prevTo: isoDate(endPrev),
      // Para hooks que toman rango único combinado
      combinedFrom: isoDate(startPrev),
      combinedTo: isoDate(today),
    };
  }, []);

  const { habits = [] } = useHabits();
  const { data: allLogs = [] } = useAllHabitLogs(
    ranges.combinedFrom,
    ranges.combinedTo
  );
  const { data: txs = [] } = useTransactions({
    from: ranges.combinedFrom,
    to: ranges.combinedTo,
  });
  const { data: moods = [] } = useMoodLogs({
    from: ranges.combinedFrom,
    to: ranges.combinedTo,
  });
  const { data: readingSessions = [] } = useReadingSessions({ limit: 200 });
  const { data: journals = [] } = useJournal({
    from: ranges.combinedFrom,
    to: ranges.combinedTo,
    limit: 50,
  });
  const defaultCurrency = useDefaultCurrency();

  const insights = useMemo(() => {
    // 1. Hábitos: contar logs en cada ventana, separados por fecha
    const habitsCurrent = allLogs.filter(
      (l) =>
        l.completed_at >= ranges.currentFrom &&
        l.completed_at <= ranges.currentTo
    ).length;
    const habitsPrev = allLogs.filter(
      (l) =>
        l.completed_at >= ranges.prevFrom && l.completed_at <= ranges.prevTo
    ).length;
    const habitsDelta = computeDelta(habitsCurrent, habitsPrev);

    // 2. Gasto
    const expenseCurrent = txs
      .filter(
        (t) =>
          t.kind === "expense" &&
          t.occurred_on >= ranges.currentFrom &&
          t.occurred_on <= ranges.currentTo
      )
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const expensePrev = txs
      .filter(
        (t) =>
          t.kind === "expense" &&
          t.occurred_on >= ranges.prevFrom &&
          t.occurred_on <= ranges.prevTo
      )
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const expenseDelta = computeDelta(
      Math.round(expenseCurrent),
      Math.round(expensePrev)
    );
    const currency = txs[0]?.currency ?? defaultCurrency;

    // 3. Mood promedio (escala 1-5 típica)
    const moodCurrent = moods.filter(
      (m) =>
        m.occurred_on >= ranges.currentFrom &&
        m.occurred_on <= ranges.currentTo
    );
    const moodPrev = moods.filter(
      (m) =>
        m.occurred_on >= ranges.prevFrom && m.occurred_on <= ranges.prevTo
    );
    const moodAvgCurrent =
      moodCurrent.length > 0
        ? moodCurrent.reduce((acc, m) => acc + Number(m.mood ?? 0), 0) /
          moodCurrent.length
        : 0;
    const moodAvgPrev =
      moodPrev.length > 0
        ? moodPrev.reduce((acc, m) => acc + Number(m.mood ?? 0), 0) /
          moodPrev.length
        : 0;

    // 4. Lectura — minutos leídos (duration_seconds → minutos)
    const readCurrent = Math.round(
      readingSessions
        .filter(
          (s) =>
            s.occurred_on >= ranges.currentFrom &&
            s.occurred_on <= ranges.currentTo
        )
        .reduce((acc, s) => acc + Number(s.duration_seconds ?? 0), 0) / 60
    );
    const readPrev = Math.round(
      readingSessions
        .filter(
          (s) =>
            s.occurred_on >= ranges.prevFrom && s.occurred_on <= ranges.prevTo
        )
        .reduce((acc, s) => acc + Number(s.duration_seconds ?? 0), 0) / 60
    );
    const readDelta = computeDelta(readCurrent, readPrev);

    // 5. Mejor día de hábitos en la semana
    const byDay = new Map<string, number>();
    allLogs
      .filter(
        (l) =>
          l.completed_at >= ranges.currentFrom &&
          l.completed_at <= ranges.currentTo
      )
      .forEach((l) => {
        byDay.set(l.completed_at, (byDay.get(l.completed_at) ?? 0) + 1);
      });
    let bestDay: { date: string; count: number } | null = null;
    for (const [date, count] of byDay) {
      if (!bestDay || count > bestDay.count) bestDay = { date, count };
    }

    // 6. Días que llevaste diario
    const journalDays = new Set(
      journals
        .filter(
          (j) =>
            j.occurred_on >= ranges.currentFrom &&
            j.occurred_on <= ranges.currentTo
        )
        .map((j) => j.occurred_on)
    ).size;

    // 7. Total de hábitos activos (no archivados)
    const activeHabits = habits.filter((h: { is_archived: boolean }) => !h.is_archived).length;

    return {
      habitsDelta,
      expenseDelta,
      currency,
      moodAvgCurrent,
      moodAvgPrev,
      readDelta,
      bestDay,
      journalDays,
      activeHabits,
    };
  }, [allLogs, txs, moods, readingSessions, journals, habits, ranges, defaultCurrency]);

  // Si no hay datos en ninguna dimensión, no renderizar
  const hasAnyData =
    insights.habitsDelta.current > 0 ||
    insights.habitsDelta.previous > 0 ||
    insights.expenseDelta.current > 0 ||
    insights.expenseDelta.previous > 0 ||
    insights.readDelta.current > 0 ||
    insights.moodAvgCurrent > 0 ||
    insights.journalDays > 0;

  if (!hasAnyData) return null;

  return (
    <section className="rounded-card border border-line bg-bg-alt/30 p-5 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarRange size={14} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Tu semana en 30s
          </p>
        </div>
        <Link
          href="/historial"
          className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink inline-flex items-center gap-1"
        >
          Ver más <ArrowRight size={11} />
        </Link>
      </header>

      {/* KPIs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Hábitos */}
        <KpiCell
          label="Hábitos"
          value={`${insights.habitsDelta.current}`}
          sublabel={
            insights.activeHabits > 0
              ? `de ${insights.activeHabits * 7} posibles`
              : null
          }
          delta={insights.habitsDelta.pct}
          icon={<Target size={12} />}
        />
        {/* Gasto */}
        <KpiCell
          label="Gasto"
          value={formatMoney(insights.expenseDelta.current, insights.currency)}
          sublabel={
            insights.expenseDelta.previous > 0
              ? `vs ${formatMoney(insights.expenseDelta.previous, insights.currency)}`
              : null
          }
          delta={insights.expenseDelta.pct}
          /* En gasto, BAJAR es bueno → invertir colores */
          deltaInverted
        />
        {/* Mood */}
        <KpiCell
          label="Ánimo prom."
          value={
            insights.moodAvgCurrent > 0
              ? insights.moodAvgCurrent.toFixed(1)
              : "—"
          }
          sublabel={
            insights.moodAvgPrev > 0
              ? `vs ${insights.moodAvgPrev.toFixed(1)}`
              : null
          }
          delta={
            insights.moodAvgCurrent > 0 && insights.moodAvgPrev > 0
              ? Math.round(
                  ((insights.moodAvgCurrent - insights.moodAvgPrev) /
                    insights.moodAvgPrev) *
                    100
                )
              : null
          }
        />
        {/* Lectura */}
        <KpiCell
          label="Lectura"
          value={
            insights.readDelta.current > 0
              ? `${insights.readDelta.current}min`
              : "—"
          }
          sublabel={
            insights.readDelta.previous > 0
              ? `vs ${insights.readDelta.previous}min`
              : null
          }
          delta={insights.readDelta.pct}
        />
      </div>

      {/* Highlights de la semana */}
      <ul className="space-y-1.5 text-xs">
        {insights.bestDay && insights.bestDay.count > 0 && (
          <li className="flex items-center gap-2 text-muted">
            <Flame size={11} className="text-accent shrink-0" />
            <span>
              Tu mejor día fue{" "}
              <strong className="text-ink">
                {formatDayLabel(insights.bestDay.date)}
              </strong>{" "}
              con{" "}
              <strong className="text-ink tabular-nums">
                {insights.bestDay.count}
              </strong>{" "}
              hábitos completados.
            </span>
          </li>
        )}
        {insights.journalDays > 0 && (
          <li className="flex items-center gap-2 text-muted">
            <span className="text-accent text-[12px] leading-none">✦</span>
            <span>
              Escribiste en tu diario{" "}
              <strong className="text-ink">
                {insights.journalDays}{" "}
                {insights.journalDays === 1 ? "día" : "días"}
              </strong>{" "}
              esta semana.
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}

function KpiCell({
  label,
  value,
  sublabel,
  delta,
  icon,
  deltaInverted = false,
}: {
  label: string;
  value: string;
  sublabel?: string | null;
  delta: number | null;
  icon?: React.ReactNode;
  deltaInverted?: boolean;
}) {
  const positive = delta !== null && delta > 0;
  const negative = delta !== null && delta < 0;
  // Si deltaInverted (gasto): bajar es bueno
  const goodColor = deltaInverted
    ? negative
      ? "text-success"
      : positive
        ? "text-danger"
        : "text-muted"
    : positive
      ? "text-success"
      : negative
        ? "text-danger"
        : "text-muted";

  return (
    <div className="rounded-md border border-line/60 bg-bg p-3">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-1 inline-flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-display italic text-xl text-ink tabular-nums">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5 min-h-[14px]">
        {delta !== null && delta !== 0 && (
          <span
            className={clsx(
              "font-mono text-[10px] tabular-nums inline-flex items-center gap-0.5",
              goodColor
            )}
          >
            {delta > 0 ? (
              <TrendingUp size={10} />
            ) : (
              <TrendingDown size={10} />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        {sublabel && (
          <span className="font-mono text-[10px] text-muted truncate">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.getTime() === today.getTime()) return "hoy";
  if (d.getTime() === yesterday.getTime()) return "ayer";
  return d.toLocaleDateString("es-MX", { weekday: "long" });
}
