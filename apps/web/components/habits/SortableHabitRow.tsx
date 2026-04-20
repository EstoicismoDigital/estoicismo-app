"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { clsx } from "clsx";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import { HabitRow } from "./HabitRow";

type Props = {
  habit: Habit;
  logs: HabitLog[];
  onToggle: (habit: Habit, isCompleted: boolean) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  onNote?: (habit: Habit, currentNote: string | null) => void;
  onViewDetail?: (habit: Habit) => void;
};

/**
 * Sortable wrapper around HabitRow. Owns the dnd-kit node + activator
 * wiring; the inner HabitRow stays presentational and testable in isolation.
 *
 * Interaction design:
 * - Drag handle lives at the row's leftmost position (GripVertical icon).
 * - `touch-none` on the handle prevents the page from scrolling while
 *   the user is dragging vertically; the rest of the row remains touch-
 *   scrollable so the list still behaves naturally on mobile.
 * - `cursor-grab` / `active:cursor-grabbing` communicates affordance on
 *   desktop. 44×40 target meets touch guidance once combined with the
 *   row's own vertical padding.
 * - Clicks on the handle are stopped from reaching the row's completion
 *   toggle, so grabbing never accidentally marks a habit done.
 * - Keyboard: the handle is a native <button>, so Tab reaches it. The
 *   dnd-kit KeyboardSensor (configured at the DndContext level) turns
 *   Space/Enter into "enter drag mode" and arrow keys into moves.
 */
export function SortableHabitRow(props: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.habit.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Mover ${props.habit.name} para reordenar`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // Stop Space/Enter from bubbling into HabitRow's own key handler
        // (which would toggle completion). dnd-kit still receives the
        // event because its listener is attached directly to this button.
        if (e.key === " " || e.key === "Enter") e.stopPropagation();
      }}
      className={clsx(
        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
        "text-muted hover:text-ink hover:bg-bg-alt",
        "cursor-grab active:cursor-grabbing touch-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      )}
    >
      <GripVertical size={16} aria-hidden />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "transition-shadow",
        isDragging &&
          "shadow-[0_12px_32px_rgba(0,0,0,0.18)] ring-2 ring-accent/40 rounded-card"
      )}
    >
      <HabitRow {...props} dragHandle={handle} />
    </div>
  );
}
