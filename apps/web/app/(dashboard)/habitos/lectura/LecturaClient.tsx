"use client";
import { useMemo, useState } from "react";
import { Plus, BookOpen, Library, Trophy, Flame } from "lucide-react";
import { clsx } from "clsx";
import {
  useBooks,
  useCurrentBook,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
  useReadingSessions,
  useCreateReadingSession,
  useDeleteReadingSession,
} from "../../../../hooks/useReading";
import { ReadingTimer } from "../../../../components/lectura/ReadingTimer";
import { SessionSummaryModal } from "../../../../components/lectura/SessionSummaryModal";
import { BookModal } from "../../../../components/lectura/BookModal";
import {
  CurrentBookCard,
  BookListItem,
} from "../../../../components/lectura/CurrentBookCard";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { computeReadingStats, formatDuration } from "../../../../lib/reading/stats";
import type { ReadingBook, ReadingSession } from "@estoicismo/supabase";

export function LecturaClient() {
  const { data: currentBook } = useCurrentBook();
  const { data: activeBooks = [] } = useBooks({ is_finished: false });
  const { data: finishedBooks = [] } = useBooks({ is_finished: true });
  const { data: sessions = [] } = useReadingSessions({ limit: 30 });

  const createBookM = useCreateBook();
  const updateBookM = useUpdateBook();
  const deleteBookM = useDeleteBook();
  const createSessionM = useCreateReadingSession();
  const deleteSessionM = useDeleteReadingSession();

  // Modal state
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<ReadingBook | null>(null);
  const [confirmDeleteBook, setConfirmDeleteBook] = useState<ReadingBook | null>(null);

  // Timer state
  const [pendingSeconds, setPendingSeconds] = useState<number | null>(null);

  const stats = useMemo(
    () => computeReadingStats(sessions, [...activeBooks, ...finishedBooks]),
    [sessions, activeBooks, finishedBooks]
  );

  function handleTimerComplete(seconds: number) {
    if (seconds < 5) {
      // No abrimos resumen para sesiones de menos de 5s.
      return;
    }
    setPendingSeconds(seconds);
  }

  return (
    <div data-module="habits" className="min-h-screen bg-bg">
      {/* HERO */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Hábitos · Lectura
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            Leer es entrenar la mente.
          </h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
            <Stat icon={<Flame size={12} />} label="Racha" value={`${stats.currentStreak}d`} />
            <Stat icon={<BookOpen size={12} />} label="Tiempo" value={formatDuration(stats.totalSeconds)} />
            <Stat icon={<Trophy size={12} />} label="Terminados" value={String(stats.finishedBooks)} />
            <Stat icon={<Library size={12} />} label="Sesiones" value={String(stats.totalSessions)} />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Libro actual */}
        <CurrentBookCard
          book={currentBook ?? null}
          onEdit={() => {
            if (currentBook) {
              setEditingBook(currentBook);
              setBookModalOpen(true);
            }
          }}
          onMarkFinished={async () => {
            if (currentBook) {
              await updateBookM.mutateAsync({
                id: currentBook.id,
                input: {
                  is_finished: true,
                  is_current: false,
                  finished_at: new Date().toISOString().slice(0, 10),
                },
              });
            }
          }}
          onPickAnother={() => {
            setEditingBook(null);
            setBookModalOpen(true);
          }}
        />

        {/* Cronómetro */}
        <ReadingTimer onComplete={handleTimerComplete} />

        {/* Sesiones recientes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display italic text-xl text-ink">Sesiones recientes</h2>
            {stats.avgMinutesPerDay30d > 0 && (
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                {stats.avgMinutesPerDay30d}min/día (30d)
              </span>
            )}
          </div>
          {sessions.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-6 text-center">
              <p className="text-sm text-ink font-semibold">Aún no hay sesiones</p>
              <p className="text-[12px] text-muted">
                Inicia el cronómetro para empezar tu primera.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 10).map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  bookTitle={
                    [...activeBooks, ...finishedBooks].find((b) => b.id === s.book_id)?.title
                  }
                  onDelete={() => deleteSessionM.mutate(s.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Biblioteca */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display italic text-xl text-ink">Mi biblioteca</h2>
            <button
              type="button"
              onClick={() => {
                setEditingBook(null);
                setBookModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Plus size={12} /> Agregar libro
            </button>
          </div>

          {activeBooks.length > 0 && (
            <>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
                En curso
              </p>
              <ul className="space-y-2">
                {activeBooks.map((b) => (
                  <BookListItem
                    key={b.id}
                    book={b}
                    onEdit={() => {
                      setEditingBook(b);
                      setBookModalOpen(true);
                    }}
                    onSetCurrent={async () => {
                      await updateBookM.mutateAsync({
                        id: b.id,
                        input: { is_current: true },
                      });
                    }}
                    onDelete={() => setConfirmDeleteBook(b)}
                  />
                ))}
              </ul>
            </>
          )}

          {finishedBooks.length > 0 && (
            <>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mt-4 mb-2">
                Terminados ({finishedBooks.length})
              </p>
              <ul className="space-y-2">
                {finishedBooks.slice(0, 8).map((b) => (
                  <BookListItem
                    key={b.id}
                    book={b}
                    isFinished
                    onEdit={() => {
                      setEditingBook(b);
                      setBookModalOpen(true);
                    }}
                    onDelete={() => setConfirmDeleteBook(b)}
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* MODALS */}
      <BookModal
        open={bookModalOpen}
        book={editingBook}
        saving={createBookM.isPending || updateBookM.isPending}
        onClose={() => {
          setBookModalOpen(false);
          setEditingBook(null);
        }}
        onSave={async (input) => {
          try {
            if (editingBook) {
              await updateBookM.mutateAsync({ id: editingBook.id, input });
            } else {
              await createBookM.mutateAsync(input as Parameters<typeof createBookM.mutateAsync>[0]);
            }
            setBookModalOpen(false);
            setEditingBook(null);
          } catch {
            /* hook toasts */
          }
        }}
      />
      <SessionSummaryModal
        open={pendingSeconds !== null}
        durationSeconds={pendingSeconds ?? 0}
        currentBook={currentBook ?? null}
        saving={createSessionM.isPending}
        onClose={() => setPendingSeconds(null)}
        onSave={async (input) => {
          await createSessionM.mutateAsync(input);
          setPendingSeconds(null);
        }}
      />
      <ConfirmDialog
        open={!!confirmDeleteBook}
        title="¿Eliminar libro?"
        description="Las sesiones del libro se mantienen, pero pierden su referencia."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDeleteBook(null)}
        onConfirm={async () => {
          if (confirmDeleteBook) {
            await deleteBookM.mutateAsync(confirmDeleteBook.id);
          }
          setConfirmDeleteBook(null);
        }}
      />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 inline-flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function SessionRow(props: {
  session: ReadingSession;
  bookTitle?: string;
  onDelete: () => void;
}) {
  const { session, bookTitle, onDelete } = props;
  const date = new Date(session.occurred_on + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const pages =
    session.pages_to !== null && session.pages_from !== null
      ? Math.max(0, (session.pages_to ?? 0) - (session.pages_from ?? 0))
      : null;

  return (
    <li className="rounded-card border border-line bg-bg-alt/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink">
              {formatDuration(session.duration_seconds)}
            </span>
            {pages !== null && pages > 0 && (
              <span className="text-[11px] text-muted">· {pages} páginas</span>
            )}
            {session.mood !== null && (
              <span className="text-[11px] text-muted">· {"★".repeat(session.mood)}</span>
            )}
          </div>
          <p className="text-[11px] text-muted">
            {date}
            {bookTitle ? <span> · {bookTitle}</span> : null}
          </p>
          {session.summary && (
            <p className="text-[12px] text-ink/80 mt-1.5 italic line-clamp-3">
              {session.summary}
            </p>
          )}
          {session.highlight && (
            <p className="text-[11px] text-accent mt-1.5 border-l-2 border-accent/40 pl-2 italic">
              "{session.highlight}"
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded-md text-muted hover:text-danger"
          aria-label="Eliminar"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </li>
  );
}
