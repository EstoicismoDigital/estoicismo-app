"use client";
import Image from "next/image";
import { BookOpen, Pencil, CheckCircle2, Star } from "lucide-react";
import { clsx } from "clsx";
import type { ReadingBook } from "@estoicismo/supabase";

export function CurrentBookCard(props: {
  book: ReadingBook | null;
  onEdit: () => void;
  onMarkFinished: () => void;
  onPickAnother: () => void;
}) {
  const { book, onEdit, onMarkFinished, onPickAnother } = props;

  if (!book) {
    return (
      <section className="rounded-card border border-dashed border-line p-6 text-center space-y-2">
        <BookOpen className="mx-auto text-muted" size={28} />
        <p className="text-sm font-semibold text-ink">No tienes libro actual</p>
        <p className="text-[12px] text-muted">
          Empieza por agregar uno — el primero abre la racha.
        </p>
        <button
          type="button"
          onClick={onPickAnother}
          className="mt-2 px-4 py-2 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90"
        >
          Agregar libro
        </button>
      </section>
    );
  }

  const total = book.total_pages ?? 0;
  const cur = book.current_page ?? 0;
  const pct = total > 0 ? Math.min(100, (cur / total) * 100) : 0;

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-5 flex gap-4">
      {book.cover_url ? (
        <div className="relative w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-md overflow-hidden bg-bg shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-md bg-bg border border-line flex items-center justify-center">
          <BookOpen className="text-muted" size={28} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-0.5">
          Libro actual
        </p>
        <h2 className="font-display italic text-xl text-ink leading-tight truncate">
          {book.title}
        </h2>
        {book.author && (
          <p className="text-sm text-muted mt-0.5 truncate">{book.author}</p>
        )}
        {total > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-muted mb-1">
              <span>
                {cur} / {total} páginas
              </span>
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-1.5 bg-line/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-mono uppercase tracking-widest text-muted hover:text-ink inline-flex items-center gap-1"
          >
            <Pencil size={11} /> {book.my_summary ? "Editar / resumen" : "Editar"}
          </button>
          <span className="text-muted">·</span>
          <button
            type="button"
            onClick={onMarkFinished}
            className="text-[11px] font-mono uppercase tracking-widest text-success hover:opacity-80 inline-flex items-center gap-1"
          >
            <CheckCircle2 size={11} /> Marcar terminado
          </button>
        </div>
      </div>

      {/* Mi resumen del libro — sólo si está lleno. Bloque ancho debajo. */}
      {book.my_summary && (
        <div className="basis-full mt-2 pt-3 border-t border-line/40">
          <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-1">
            Mi resumen
          </p>
          <p className="text-[13px] text-ink/90 leading-relaxed whitespace-pre-wrap italic">
            {book.my_summary}
          </p>
        </div>
      )}
    </section>
  );
}

export function BookListItem(props: {
  book: ReadingBook;
  isFinished?: boolean;
  onEdit: () => void;
  onSetCurrent?: () => void;
  onDelete: () => void;
}) {
  const { book, isFinished, onEdit, onSetCurrent, onDelete } = props;
  const total = book.total_pages ?? 0;
  const cur = book.current_page ?? 0;
  const pct = total > 0 ? Math.min(100, (cur / total) * 100) : 0;

  return (
    <li className="rounded-card border border-line bg-bg-alt/30 p-3 flex items-center gap-3">
      {book.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover_url}
          alt={book.title}
          className="w-10 h-14 object-cover rounded-sm shrink-0"
        />
      ) : (
        <div className="w-10 h-14 rounded-sm bg-bg border border-line shrink-0 flex items-center justify-center">
          <BookOpen size={14} className="text-muted" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{book.title}</p>
        {book.author && (
          <p className="text-[11px] text-muted truncate">{book.author}</p>
        )}
        {!isFinished && total > 0 && (
          <div className="mt-1 h-1 bg-line/40 rounded-full overflow-hidden max-w-[160px]">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        )}
        {isFinished && book.rating && (
          <p className="text-[11px] text-muted flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: book.rating }).map((_, i) => (
              <Star key={i} size={10} className="fill-accent text-accent" />
            ))}
          </p>
        )}
        {book.my_summary && (
          <p className="text-[10px] text-muted italic mt-0.5 line-clamp-1">
            "{book.my_summary}"
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {onSetCurrent && !book.is_current && !isFinished && (
          <button
            type="button"
            onClick={onSetCurrent}
            className={clsx(
              "px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest",
              "border border-line text-muted hover:text-ink"
            )}
          >
            Activar
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-md text-muted hover:text-ink"
          aria-label="Editar"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-md text-muted hover:text-danger"
          aria-label="Eliminar"
        >
          <span className="text-base leading-none">×</span>
        </button>
      </div>
    </li>
  );
}
