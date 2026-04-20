"use client";
import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import { WeekStrip } from "./WeekStrip";
import { computeStreak, getTodayStr } from "../../lib/dateUtils";

export function HabitRow({
  habit,
  logs,
  onToggle,
  onEdit,
  onArchive,
}: {
  habit: Habit;
  logs: HabitLog[];
  onToggle: (habit: Habit, isCompleted: boolean) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
}) {
  const today = getTodayStr();
  const habitLogDates = logs
    .filter((l) => l.habit_id === habit.id)
    .map((l) => l.completed_at);
  const isCompletedToday = habitLogDates.includes(today);
  const streak = computeStreak(habitLogDates);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

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
            <p className="font-mono text-[10px] uppercase tracking-widest text-success mt-0.5">
              Hecho hoy
            </p>
          )}
        </div>

        {/* Week strip */}
        <WeekStrip
          habit={habit}
          logs={logs}
          onToggleToday={handleToggle}
        />

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

      {/* Context menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute top-full right-3 mt-1 z-20 bg-bg border border-line rounded-card shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <button
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onEdit(habit);
            }}
            className="w-full text-left px-4 py-2.5 font-body text-sm text-ink hover:bg-bg-alt transition-colors"
          >
            Editar
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              if (confirm(`¿Archivar "${habit.name}"? Podrás verlo en historial.`)) {
                onArchive(habit);
              }
            }}
            className="w-full text-left px-4 py-2.5 font-body text-sm text-danger hover:bg-danger/5 transition-colors border-t border-line"
          >
            Archivar
          </button>
        </div>
      )}
    </div>
  );
}
