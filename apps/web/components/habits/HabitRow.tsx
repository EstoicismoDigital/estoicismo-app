"use client";
import { useState } from "react";
import { MoreVertical, MessageSquare, MessageSquareText } from "lucide-react";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import { WeekStrip } from "./WeekStrip";
import { HabitContextMenu } from "./HabitContextMenu";
import { computeStreak, getTodayStr } from "../../lib/dateUtils";

export function HabitRow({
  habit,
  logs,
  onToggle,
  onEdit,
  onArchive,
  onNote,
  onViewDetail,
}: {
  habit: Habit;
  logs: HabitLog[];
  onToggle: (habit: Habit, isCompleted: boolean) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  /** Optional. Opens the note dialog for today's log. Ignored if habit isn't completed today. */
  onNote?: (habit: Habit, currentNote: string | null) => void;
  /** Optional. Navigates to the habit's detail page. */
  onViewDetail?: (habit: Habit) => void;
}) {
  const today = getTodayStr();
  const habitLogs = logs.filter((l) => l.habit_id === habit.id);
  const habitLogDates = habitLogs.map((l) => l.completed_at);
  const isCompletedToday = habitLogDates.includes(today);
  const todayLog = habitLogs.find((l) => l.completed_at === today) ?? null;
  const noteForToday = todayLog?.note ?? null;
  const hasNote = !!(noteForToday && noteForToday.trim().length > 0);
  const streak = computeStreak(habitLogDates);

  const [menuOpen, setMenuOpen] = useState(false);

  function handleToggle() {
    onToggle(habit, isCompletedToday);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setMenuOpen(true);
  }

  return (
    <div
      className="relative group"
      onContextMenu={handleContextMenu}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label={`${habit.name}${isCompletedToday ? " — completado hoy" : ""}`}
        aria-pressed={isCompletedToday}
        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-card bg-bg border border-line shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-accent/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 cursor-pointer"
      >
        {/* Icon circle */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-transform duration-150 ease-out group-hover:scale-105"
          style={{
            backgroundColor: `${habit.color}22`,
            color: habit.color,
          }}
          aria-hidden="true"
        >
          <span>{habit.icon}</span>
        </div>

        {/* Name + streak */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-body font-medium text-[15px] sm:text-base text-ink truncate">
              {habit.name}
            </h3>
            {streak > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-bg-alt font-mono text-[10px] uppercase tracking-widest text-accent">
                <span aria-hidden>🔥</span>
                <span>{streak}d</span>
              </span>
            )}
          </div>
          {isCompletedToday && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-success mt-0.5 flex items-center gap-1.5">
              <span>Hecho hoy</span>
              {hasNote && (
                <span
                  className="inline-flex items-center gap-0.5 text-accent normal-case tracking-normal"
                  title="Tiene nota"
                >
                  <MessageSquareText size={11} aria-hidden />
                </span>
              )}
            </p>
          )}
        </div>

        {/* Week strip */}
        <WeekStrip
          habit={habit}
          logs={logs}
          onToggleToday={handleToggle}
        />

        {/* Note button — only when completed today and handler provided */}
        {isCompletedToday && onNote && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNote(habit, noteForToday);
            }}
            aria-label={
              hasNote ? `Editar nota de ${habit.name}` : `Añadir nota a ${habit.name}`
            }
            className="flex-shrink-0 w-8 h-8 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent hover:bg-bg-alt"
            style={{ color: hasNote ? habit.color : undefined }}
          >
            {hasNote ? (
              <MessageSquareText size={16} />
            ) : (
              <MessageSquare size={16} className="text-muted hover:text-ink" />
            )}
          </button>
        )}

        {/* More button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          aria-label={`Opciones para ${habit.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex-shrink-0 w-8 h-8 rounded-lg text-muted hover:text-ink hover:bg-bg-alt transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      <HabitContextMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onEdit={() => onEdit(habit)}
        onArchive={() => onArchive(habit)}
        onNote={
          isCompletedToday && onNote
            ? () => onNote(habit, noteForToday)
            : undefined
        }
        onViewDetail={onViewDetail ? () => onViewDetail(habit) : undefined}
        hasNote={hasNote}
      />
    </div>
  );
}
