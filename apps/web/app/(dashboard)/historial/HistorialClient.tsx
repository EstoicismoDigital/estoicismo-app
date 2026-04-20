"use client";
import { useState } from "react";
import Link from "next/link";
import { RotateCcw, Trash2, ArchiveRestore } from "lucide-react";
import {
  useArchivedHabits,
  useUnarchiveHabit,
  useDeleteHabit,
} from "../../../hooks/useArchivedHabits";
import type { Habit } from "@estoicismo/supabase";

export function HistorialClient() {
  const { data: habits = [], isLoading } = useArchivedHabits();
  const unarchive = useUnarchiveHabit();
  const del = useDeleteHabit();

  const [confirmDelete, setConfirmDelete] = useState<Habit | null>(null);

  return (
    <div className="min-h-screen bg-bg pb-24">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Archivo
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl">
            Hábitos archivados
          </h1>
          <p className="font-body text-white/60 text-sm mt-2">
            Restaura un hábito para volver a verlo en tu lista, o elimínalo
            definitivamente.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-card bg-bg-alt animate-pulse"
              />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <EmptyArchive />
        ) : (
          <ul className="flex flex-col gap-2.5" role="list">
            {habits.map((habit) => (
              <li key={habit.id}>
                <ArchivedRow
                  habit={habit}
                  onRestore={() => unarchive.mutate(habit.id)}
                  onDelete={() => setConfirmDelete(habit)}
                  busy={unarchive.isPending || del.isPending}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmDelete && (
        <DeleteConfirm
          habit={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            del.mutate(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

function EmptyArchive() {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-full bg-bg-alt mx-auto mb-5 flex items-center justify-center text-muted">
        <ArchiveRestore size={22} />
      </div>
      <h2 className="font-display italic text-2xl text-ink mb-2">
        Sin hábitos archivados.
      </h2>
      <p className="font-body text-muted text-sm mb-6 max-w-xs mx-auto">
        Los hábitos que archives desde tu lista aparecerán aquí.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center min-h-[44px] h-12 px-6 rounded-lg bg-ink text-white font-body font-medium text-base hover:opacity-90 transition-opacity"
      >
        Volver a mis hábitos
      </Link>
    </div>
  );
}

function ArchivedRow({
  habit,
  onRestore,
  onDelete,
  busy,
}: {
  habit: Habit;
  onRestore: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-card bg-bg border border-line">
      <div
        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        style={{ backgroundColor: `${habit.color}22`, color: habit.color }}
        aria-hidden
      >
        <span>{habit.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-body font-medium text-[15px] sm:text-base text-ink truncate">
          {habit.name}
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-0.5">
          Archivado
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onRestore}
          disabled={busy}
          aria-label={`Restaurar ${habit.name}`}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-bg-alt text-ink font-body text-sm hover:bg-line transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <RotateCcw size={14} />
          <span className="hidden sm:inline">Restaurar</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          aria-label={`Eliminar ${habit.name} definitivamente`}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:text-danger hover:bg-danger/5 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function DeleteConfirm({
  habit,
  onCancel,
  onConfirm,
}: {
  habit: Habit;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCancel}
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-150"
      />
      <div className="relative bg-bg rounded-card border border-line shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-150">
        <h3
          id="confirm-title"
          className="font-display italic text-2xl text-ink mb-2"
        >
          ¿Eliminar definitivamente?
        </h3>
        <p className="font-body text-sm text-muted leading-relaxed mb-6">
          Esto borrará &ldquo;{habit.name}&rdquo; y todo su historial de
          completados. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center min-h-[44px] h-11 px-5 rounded-lg border border-line text-ink font-body text-sm hover:bg-bg-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center min-h-[44px] h-11 px-5 rounded-lg bg-danger text-white font-body font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
