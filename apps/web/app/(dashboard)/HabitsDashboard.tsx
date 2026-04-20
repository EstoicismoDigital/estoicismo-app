"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { DailyHeader } from "../../components/habits/DailyHeader";
import { SortableHabitRow } from "../../components/habits/SortableHabitRow";
import { EmptyHabits } from "../../components/habits/EmptyHabits";
import { HabitModal } from "../../components/habits/HabitModal";
import { HabitNoteDialog } from "../../components/habits/HabitNoteDialog";
import {
  TodayTimeline,
  isHabitDueOn,
} from "../../components/habits/TodayTimeline";
import { InsightsPanel } from "../../components/habits/InsightsPanel";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import {
  useHabits,
  useToggleHabit,
  useCreateHabit,
  useUpdateHabit,
  useArchiveHabit,
  useUpsertHabitLogNote,
  useReorderHabits,
} from "../../hooks/useHabits";
import { useProfile } from "../../hooks/useProfile";
import { computeStreak, getTodayStr } from "../../lib/dateUtils";
import { findCrossedMilestone } from "../../lib/streakMilestones";
import type { Habit, CreateHabitInput } from "@estoicismo/supabase";

const FREE_TIER_LIMIT = 3;

function HabitRowSkeleton() {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-card bg-bg border border-line">
      <div className="w-12 h-12 rounded-full bg-bg-alt animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/5 rounded bg-bg-alt animate-pulse" />
        <div className="h-3 w-1/4 rounded bg-bg-alt/70 animate-pulse" />
      </div>
      <div className="hidden sm:flex items-center gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full bg-bg-alt animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function HabitsDashboard() {
  const router = useRouter();
  const { habits, logs, isLoading } = useHabits();
  const { data: profile } = useProfile();
  const toggle = useToggleHabit();
  const createM = useCreateHabit();
  const updateM = useUpdateHabit();
  const archiveM = useArchiveHabit();
  const noteM = useUpsertHabitLogNote();
  const reorderM = useReorderHabits();

  // Sensors: pointer uses a 6px activation distance so casual taps never
  // start a drag; keyboard uses dnd-kit's sortable coordinate getter so
  // Space/Enter + arrow keys move items predictably between rows.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = habits.findIndex((h) => h.id === active.id);
    const newIndex = habits.findIndex((h) => h.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const orderedIds = arrayMove(habits, oldIndex, newIndex).map((h) => h.id);
    reorderM.mutate(orderedIds);
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [habitToArchive, setHabitToArchive] = useState<Habit | null>(null);
  const [noteTarget, setNoteTarget] = useState<
    { habit: Habit; currentNote: string | null } | null
  >(null);

  const today = getTodayStr();
  const completedToday = useMemo(
    () =>
      new Set(logs.filter((l) => l.completed_at === today).map((l) => l.habit_id))
        .size,
    [logs, today]
  );
  const dueToday = useMemo(
    () => habits.filter((h) => isHabitDueOn(h, today)).length,
    [habits, today]
  );

  // Celebrate when the user crosses from "incomplete" to "all done".
  const prevCompleteRef = useRef(false);
  useEffect(() => {
    const isAllDone = dueToday > 0 && completedToday >= dueToday;
    if (isAllDone && !prevCompleteRef.current) {
      toast.success("Día completo. Buen trabajo.", {
        description: "El filósofo actúa, no solo contempla.",
        duration: 4000,
      });
    }
    prevCompleteRef.current = isAllDone;
  }, [completedToday, dueToday]);

  // Celebrate per-habit streak milestones (3/7/14/30/60/100/365 days).
  // The ref is null on first mount so we don't toast existing streaks that
  // were already achieved before the page loaded — only genuine crossings
  // triggered by the user's actions in this session fire a celebration.
  const prevStreaksRef = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const h of habits) {
      const dates = logs
        .filter((l) => l.habit_id === h.id)
        .map((l) => l.completed_at);
      next[h.id] = computeStreak(dates);
    }
    if (prevStreaksRef.current !== null) {
      const prev = prevStreaksRef.current;
      for (const h of habits) {
        const milestone = findCrossedMilestone(prev[h.id] ?? 0, next[h.id]);
        if (milestone) {
          toast.success(`${h.icon}  ${h.name} · ${milestone.title}`, {
            description: milestone.description,
            duration: 5500,
          });
        }
      }
    }
    prevStreaksRef.current = next;
  }, [habits, logs]);

  function openNew() {
    const isPremium = profile?.plan === "premium";
    if (!isPremium && habits.length >= FREE_TIER_LIMIT) {
      router.push("/upgrade");
      return;
    }
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(habit: Habit) {
    setEditing(habit);
    setModalOpen(true);
  }

  async function handleSave(input: CreateHabitInput) {
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, input });
    } else {
      await createM.mutateAsync(input);
    }
    setModalOpen(false);
    setEditing(null);
  }

  function requestArchive(h: Habit) {
    setHabitToArchive(h);
  }

  function confirmArchive() {
    if (habitToArchive) {
      archiveM.mutate(habitToArchive.id);
    }
    setHabitToArchive(null);
  }

  function openNote(habit: Habit, currentNote: string | null) {
    setNoteTarget({ habit, currentNote });
  }

  async function handleSaveNote(note: string | null) {
    if (!noteTarget) return;
    await noteM.mutateAsync({
      habitId: noteTarget.habit.id,
      date: today,
      note,
    });
    setNoteTarget(null);
  }

  return (
    <div className="min-h-screen bg-bg">
      <DailyHeader
        completedToday={completedToday}
        totalHabits={habits.length}
        dueToday={dueToday}
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
        <div className="min-w-0">
          {/* Mobile timeline (chip list) sits above the habit list */}
          <div className="lg:hidden">
            {habits.length > 0 && (
              <TodayTimeline
                habits={habits}
                logs={logs}
                currentDate={today}
                onToggle={(h, isCompleted) =>
                  toggle.mutate({ habitId: h.id, isCompleted })
                }
              />
            )}
          </div>

          <div className="flex items-baseline justify-between mb-5 sm:mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
                Tus hábitos
              </p>
              <h2 className="font-display italic text-2xl sm:text-3xl text-ink">
                Hoy
              </h2>
            </div>
            {habits.length > 0 && (
              <button
                type="button"
                onClick={openNew}
                className="hidden md:inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-ink text-bg font-body text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Plus size={16} />
                Nuevo
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <HabitRowSkeleton key={i} />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <EmptyHabits onCreate={openNew} />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={habits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-2.5" role="list">
                  {habits.map((habit) => (
                    <li key={habit.id}>
                      <SortableHabitRow
                        habit={habit}
                        logs={logs}
                        onToggle={(h, isCompleted) =>
                          toggle.mutate({ habitId: h.id, isCompleted })
                        }
                        onEdit={openEdit}
                        onArchive={requestArchive}
                        onNote={openNote}
                        onViewDetail={(h) => router.push(`/habitos/${h.id}`)}
                      />
                    </li>
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {habits.length > 0 &&
            profile?.plan !== "premium" &&
            habits.length >= FREE_TIER_LIMIT && (
              <p className="text-center font-body text-xs text-muted mt-6">
                Has alcanzado el límite gratuito. Actualiza a{" "}
                <a href="/upgrade" className="text-accent font-medium hover:underline">
                  Premium
                </a>{" "}
                para añadir más.
              </p>
            )}

          {!isLoading && habits.length > 0 && (
            <InsightsPanel habits={habits} logs={logs} />
          )}
        </div>

        {/* Desktop: right-hand 320px timeline column */}
        <aside className="hidden lg:block">
          {habits.length > 0 && (
            <TodayTimeline
              habits={habits}
              logs={logs}
              currentDate={today}
              onToggle={(h, isCompleted) =>
                toggle.mutate({ habitId: h.id, isCompleted })
              }
            />
          )}
        </aside>
      </section>

      {/* FAB — floats above the bottom nav and respects the iOS home indicator */}
      <button
        type="button"
        onClick={openNew}
        aria-label="Crear nuevo hábito"
        className="md:hidden fixed right-5 z-50 w-14 h-14 rounded-full bg-accent text-bg shadow-[0_8px_24px_rgba(0,0,0,0.18)] flex items-center justify-center hover:opacity-95 active:scale-95 transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        <Plus size={24} />
      </button>

      <HabitModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        editing={editing}
        saving={createM.isPending || updateM.isPending}
      />

      <ConfirmDialog
        open={habitToArchive !== null}
        title="Archivar hábito"
        description={
          habitToArchive
            ? `¿Archivar "${habitToArchive.name}"? Podrás verlo en historial.`
            : undefined
        }
        confirmLabel="Archivar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={confirmArchive}
        onCancel={() => setHabitToArchive(null)}
      />

      <HabitNoteDialog
        open={noteTarget !== null}
        habitName={noteTarget?.habit.name ?? ""}
        initialNote={noteTarget?.currentNote ?? null}
        onSave={handleSaveNote}
        onClose={() => setNoteTarget(null)}
        saving={noteM.isPending}
      />
    </div>
  );
}
