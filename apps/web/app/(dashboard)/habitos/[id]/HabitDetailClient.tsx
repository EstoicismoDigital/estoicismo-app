"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, MessageSquareText, Pencil, Archive } from "lucide-react";
import {
  fetchHabits,
  fetchHabitLogs,
  type Habit,
  type HabitLog,
} from "@estoicismo/supabase";
import { getSupabaseBrowserClient } from "../../../../lib/supabase-client";
import {
  computeStreak,
  computeLongestStreak,
  getTodayStr,
} from "../../../../lib/dateUtils";
import { computeInsights } from "../../../../lib/insights";
import { HabitModal } from "../../../../components/habits/HabitModal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import {
  useUpdateHabit,
  useArchiveHabit,
} from "../../../../hooks/useHabits";
import { buildHeatmap } from "../../progreso/ProgresoClient";

const HEATMAP_DAYS = 91;

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

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function frequencyLabel(freq: Habit["frequency"]): string {
  if (freq === "daily" || freq === "weekly") return "Todos los días";
  if (typeof freq === "object" && freq && "days" in freq) {
    if (freq.days.length === 7) return "Todos los días";
    if (freq.days.length === 0) return "Sin programar";
    return freq.days
      .slice()
      .sort()
      .map((d) => DAY_LABELS[d])
      .join(" · ");
  }
  return "Todos los días";
}

function formatNoteDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = [
    "DOMINGO",
    "LUNES",
    "MARTES",
    "MIÉRCOLES",
    "JUEVES",
    "VIERNES",
    "SÁBADO",
  ];
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export function HabitDetailClient({ habitId }: { habitId: string }) {
  const router = useRouter();
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
    queryKey: ["habit-detail-logs", habitId, from, to],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const all = await fetchHabitLogs(sb, await getUserId(), from, to);
      return all.filter((l) => l.habit_id === habitId);
    },
  });

  const habit = (habitsQ.data ?? []).find((h) => h.id === habitId) ?? null;
  const logs = logsQ.data ?? [];
  const loading = habitsQ.isLoading || logsQ.isLoading;

  const updateM = useUpdateHabit();
  const archiveM = useArchiveHabit();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const streak = useMemo(
    () => computeStreak(logs.map((l) => l.completed_at)),
    [logs]
  );
  const bestStreak = useMemo(
    () => computeLongestStreak(logs.map((l) => l.completed_at)),
    [logs]
  );
  const insights = useMemo(
    () => (habit ? computeInsights([habit], logs, today) : null),
    [habit, logs, today]
  );
  const weeks = useMemo(
    () => buildHeatmap(logs, today, HEATMAP_DAYS),
    [logs, today]
  );
  const notes = useMemo(
    () =>
      logs
        .filter((l) => l.note && l.note.trim().length > 0)
        .slice()
        .sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1)),
    [logs]
  );

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!habit) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
            No encontrado
          </p>
          <h1 className="font-display italic text-2xl text-ink mb-4">
            Este hábito ya no existe
          </h1>
          <Link
            href="/"
            className="inline-flex items-center h-11 px-5 rounded-lg bg-accent text-bg font-body text-sm hover:opacity-90"
          >
            Volver a Hoy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/70 hover:text-accent transition-colors mb-6 min-h-[44px]"
          >
            <ArrowLeft size={14} />
            Volver a Hoy
          </Link>

          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-3xl"
              style={{
                backgroundColor: `${habit.color}33`,
                color: habit.color,
              }}
              aria-hidden
            >
              <span>{habit.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
                Hábito
              </p>
              <h1 className="font-display italic text-3xl sm:text-4xl leading-tight break-words">
                {habit.name}
              </h1>
              <p className="font-body text-sm text-white/60 mt-2">
                {frequencyLabel(habit.frequency)}
                {habit.reminder_time ? ` · Recordatorio ${habit.reminder_time}` : ""}
              </p>
            </div>
          </div>

          {/* Stat pills — 2×2 on mobile, 4 cols from sm up */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill
              label="Racha"
              value={String(streak)}
              unit={streak === 1 ? "día" : "días"}
              icon={streak > 0 ? <Flame size={12} aria-hidden /> : null}
            />
            <StatPill
              label="Mejor racha"
              value={String(bestStreak)}
              unit={bestStreak === 1 ? "día" : "días"}
            />
            <StatPill
              label="Últimos 90d"
              value={String(logs.length)}
              unit={logs.length === 1 ? "registro" : "registros"}
            />
            <StatPill
              label="Consistencia 30d"
              value={`${insights?.consistency30 ?? 0}`}
              unit="%"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-body text-sm transition-colors"
            >
              <Pencil size={14} aria-hidden />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setConfirmArchive(true)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white/5 hover:bg-danger/20 text-white/80 hover:text-white font-body text-sm transition-colors"
            >
              <Archive size={14} aria-hidden />
              Archivar
            </button>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-10">
        {/* Heatmap */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Últimos 90 días
          </p>
          <h2 className="font-display italic text-2xl text-ink mb-5">Actividad</h2>
          <SingleHabitHeatmap weeks={weeks} color={habit.color} today={today} />
          {logs.length === 0 && (
            <p className="font-body text-sm text-muted mt-4">
              Aún no has completado este hábito. Un paso pequeño cada día se
              convierte en un camino.
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Diario
          </p>
          <h2 className="font-display italic text-2xl text-ink mb-5">
            Reflexiones
          </h2>
          {notes.length === 0 ? (
            <div className="rounded-card border border-line bg-bg-alt/40 p-6 text-center">
              <MessageSquareText
                size={24}
                className="mx-auto text-muted mb-3"
                aria-hidden
              />
              <p className="font-body text-sm text-muted max-w-md mx-auto leading-relaxed">
                Cuando añadas notas al completar tus hábitos, aparecerán aquí
                como un pequeño diario.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3" role="list">
              {notes.map((log) => (
                <li
                  key={log.id}
                  className="rounded-card bg-bg-alt border border-line/60 p-4 sm:p-5"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                    {formatNoteDate(log.completed_at)}
                  </p>
                  <p className="font-body text-[15px] text-ink whitespace-pre-wrap leading-relaxed">
                    {log.note}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <HabitModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={async (input) => {
          await updateM.mutateAsync({ id: habit.id, input });
          setEditOpen(false);
        }}
        editing={habit}
        saving={updateM.isPending}
      />

      <ConfirmDialog
        open={confirmArchive}
        title="Archivar hábito"
        description={`¿Archivar "${habit.name}"? Podrás verlo en historial.`}
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => {
          archiveM.mutate(habit.id, {
            onSuccess: () => router.push("/"),
          });
          setConfirmArchive(false);
        }}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}

function StatPill({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-card bg-white/5 border border-white/10 px-3 py-3">
      <p className="font-mono text-[9px] uppercase tracking-widest text-white/50 mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        {icon && <span className="text-accent self-center">{icon}</span>}
        <span className="font-display text-2xl sm:text-3xl text-white tabular-nums leading-none">
          {value}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">
          {unit}
        </span>
      </div>
    </div>
  );
}

function SingleHabitHeatmap({
  weeks,
  color,
  today,
}: {
  weeks: { date: string; count: number; inRange: boolean }[][];
  color: string;
  today: string;
}) {
  const labels = DAY_LABELS;
  return (
    <div
      className="inline-grid gap-[3px] overflow-x-auto"
      style={{ gridTemplateColumns: `auto repeat(${weeks.length}, 12px)` }}
      role="grid"
      aria-label="Mapa de calor del hábito en 90 días"
    >
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
            const done = cell.count > 0;
            const isToday = cell.date === today;
            return (
              <span
                key={`c-${colIdx}-${rowIdx}`}
                role="gridcell"
                aria-label={`${cell.date}: ${done ? "completado" : "sin completar"}`}
                title={cell.date}
                className="w-[12px] h-[12px] rounded-[2px] border transition-colors"
                style={{
                  backgroundColor: cell.inRange
                    ? done
                      ? color
                      : "#EDE6DB"
                    : "transparent",
                  borderColor: isToday ? color : "transparent",
                  outline: isToday ? `1px solid ${color}` : undefined,
                  opacity: cell.inRange ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="h-4 w-20 rounded bg-white/10 animate-pulse mb-6" />
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
              <div className="h-8 w-3/4 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-card bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">
        <div className="h-40 rounded-card bg-bg-alt animate-pulse" />
        <div className="h-40 rounded-card bg-bg-alt animate-pulse" />
      </section>
    </div>
  );
}
