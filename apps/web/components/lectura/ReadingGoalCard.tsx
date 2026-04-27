"use client";
import { useState } from "react";
import { Loader2, Pencil, BookOpen, Sparkles, X } from "lucide-react";
import {
  useReadingGoal,
  useUpsertReadingGoal,
  useBooksFinishedInYear,
} from "../../hooks/useReading";

/**
 * Reading goal card · meta anual de libros.
 *
 * Comportamiento:
 *  - Si no hay goal para el año actual → CTA para crearlo (15-50 sugeridos).
 *  - Si hay goal → muestra progreso (libros leídos / target) con barra
 *    horizontal y % al lado.
 *  - Edita inline con un botón "Editar" → modal pequeño.
 *
 * Año: derivado en cliente (year actual). El user puede ver años
 * pasados navegando otra UI más adelante.
 */
export function ReadingGoalCard() {
  const year = new Date().getFullYear();
  const { data: goal, isLoading: loadingGoal } = useReadingGoal(year);
  const { data: finished = 0, isLoading: loadingCount } =
    useBooksFinishedInYear(year);
  const [editing, setEditing] = useState(false);

  if (loadingGoal || loadingCount) {
    return (
      <div className="rounded-card border border-line bg-bg-alt/50 p-5 flex items-center justify-center min-h-[120px]">
        <Loader2 size={18} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!goal) {
    return (
      <>
        <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-accent" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Reto de lectura {year}
            </p>
          </div>
          <p className="font-display italic text-xl text-ink leading-tight">
            ¿Cuántos libros vas a leer este año?
          </p>
          <p className="font-body text-sm text-muted mt-2 mb-4 leading-relaxed">
            Define tu meta anual. Los grandes lectores leen entre 25 y 50
            libros al año — empieza donde te haga sentido.
          </p>
          <div className="flex flex-wrap gap-2">
            {[12, 24, 36, 50].map((n) => (
              <QuickGoalButton key={n} year={year} books={n} />
            ))}
            <button
              onClick={() => setEditing(true)}
              className="h-9 px-4 rounded-full border border-line bg-bg text-muted hover:text-ink hover:border-line-strong font-body text-xs"
            >
              Otra cantidad
            </button>
          </div>
        </div>
        {editing && (
          <ReadingGoalModal
            year={year}
            onClose={() => setEditing(false)}
            initial={null}
          />
        )}
      </>
    );
  }

  const ratio = Math.min(1, finished / goal.books_target);
  const pct = Math.round(ratio * 100);
  const remaining = Math.max(0, goal.books_target - finished);
  const onTrack = isOnTrack(finished, goal.books_target);

  return (
    <>
      <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={14} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Reto de lectura {year}
          </p>
          <span className="h-px flex-1 bg-line" />
          <button
            onClick={() => setEditing(true)}
            className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink inline-flex items-center gap-1"
          >
            <Pencil size={11} /> Editar
          </button>
        </div>

        <div className="flex items-baseline gap-2">
          <p className="font-display italic text-3xl text-ink">
            {finished}
          </p>
          <p className="font-body text-base text-muted">
            de {goal.books_target} libros
          </p>
          <span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-muted">
            {pct}%
          </span>
        </div>

        <div className="mt-3 h-2 bg-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-3 font-body text-xs text-muted">
          {finished >= goal.books_target ? (
            <>🏆 Cumpliste tu meta del año. ¿Sigues subiendo el reto?</>
          ) : remaining === 1 ? (
            <>1 libro más para alcanzar tu meta.</>
          ) : (
            <>
              {remaining} libros más · {onTrack ? "vas en ritmo" : "vas atrasado"}
            </>
          )}
        </p>
      </div>
      {editing && (
        <ReadingGoalModal
          year={year}
          onClose={() => setEditing(false)}
          initial={goal}
        />
      )}
    </>
  );
}

/**
 * Calcula si vas "en ritmo" comparando contra el % de año transcurrido.
 * Si finished/target >= dia_del_anho/365 → on track.
 */
function isOnTrack(finished: number, target: number): boolean {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const expected = (target * dayOfYear) / 365;
  return finished >= expected;
}

function QuickGoalButton({ year, books }: { year: number; books: number }) {
  const upsert = useUpsertReadingGoal();
  return (
    <button
      onClick={() => upsert.mutate({ year, books_target: books })}
      disabled={upsert.isPending}
      className="h-9 px-4 rounded-full bg-accent text-bg font-body text-xs font-medium hover:opacity-90 disabled:opacity-40"
    >
      {books} libros
    </button>
  );
}

function ReadingGoalModal({
  year,
  initial,
  onClose,
}: {
  year: number;
  initial: import("@estoicismo/supabase").ReadingGoal | null;
  onClose: () => void;
}) {
  const [target, setTarget] = useState(initial?.books_target ?? 24);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const upsert = useUpsertReadingGoal();

  async function save() {
    await upsert.mutateAsync({
      year,
      books_target: target,
      notes: notes.trim() || null,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-bg rounded-card border border-line shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h3 className="font-display italic text-xl text-ink">
            Meta de lectura {year}
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Libros este año
            </p>
            <input
              type="number"
              min={1}
              max={365}
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-display italic text-3xl text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Por qué (opcional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Lo que esperas ganar este año leyendo…"
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
        </div>
        <div className="p-4 border-t border-line flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg-alt"
          >
            Cancelar
          </button>
          <button
            disabled={upsert.isPending || target < 1}
            onClick={save}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-accent text-bg font-body text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            {upsert.isPending && <Loader2 size={14} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
