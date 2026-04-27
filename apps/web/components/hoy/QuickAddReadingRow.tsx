"use client";
import { useState } from "react";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import {
  useCurrentBook,
  useCreateReadingSession,
} from "../../hooks/useReading";

/**
 * Inline reading session logger · una fila para registrar minutos
 * y páginas leídos hoy del libro actual.
 *
 * UX:
 *  - Si no hay libro activo → CTA a marcar uno.
 *  - Si lo hay → minutos + páginas (de/a) + Enter.
 */
export function QuickAddReadingRow() {
  const { data: book } = useCurrentBook();
  const create = useCreateReadingSession();
  const [minutes, setMinutes] = useState("");
  const [pagesFrom, setPagesFrom] = useState("");
  const [pagesTo, setPagesTo] = useState("");

  if (!book) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg p-4 text-center">
        <BookOpen size={20} className="mx-auto text-muted/60 mb-2" />
        <p className="font-body text-sm text-muted">
          Sin libro activo.{" "}
          <a
            href="/habitos/lectura"
            className="text-accent underline hover:opacity-80"
          >
            Elige uno →
          </a>
        </p>
      </div>
    );
  }

  async function save() {
    const m = parseInt(minutes, 10);
    if (!m || m <= 0) return;
    await create.mutateAsync({
      book_id: book?.id ?? null,
      duration_seconds: m * 60,
      pages_from: pagesFrom ? parseInt(pagesFrom, 10) : null,
      pages_to: pagesTo ? parseInt(pagesTo, 10) : null,
    });
    setMinutes("");
    setPagesFrom("");
    setPagesTo("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    }
  }

  // Suggest "from" as current_page
  const fromPlaceholder = book.current_page > 0 ? String(book.current_page) : "0";

  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <div className="flex items-center gap-2 mb-2 min-w-0">
        <BookOpen size={12} className="text-accent shrink-0" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted truncate flex-1">
          {book.title}
        </p>
        {book.total_pages && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted shrink-0">
            {book.current_page}/{book.total_pages}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
            Minutos
          </p>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            onKeyDown={handleKey}
            placeholder="20"
            className="w-full bg-bg-alt border border-line rounded-md px-2 py-1.5 font-display italic text-base text-ink placeholder:text-muted/40 focus:outline-none focus:border-accent tabular-nums"
          />
        </div>
        <div className="flex-1">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
            Página de
          </p>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={pagesFrom}
            onChange={(e) => setPagesFrom(e.target.value)}
            onKeyDown={handleKey}
            placeholder={fromPlaceholder}
            className="w-full bg-bg-alt border border-line rounded-md px-2 py-1.5 font-body text-sm text-ink placeholder:text-muted/40 focus:outline-none focus:border-accent tabular-nums"
          />
        </div>
        <div className="flex-1">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
            a
          </p>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={pagesTo}
            onChange={(e) => setPagesTo(e.target.value)}
            onKeyDown={handleKey}
            placeholder=""
            className="w-full bg-bg-alt border border-line rounded-md px-2 py-1.5 font-body text-sm text-ink placeholder:text-muted/40 focus:outline-none focus:border-accent tabular-nums"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={create.isPending || !minutes}
          className="h-9 w-9 rounded-full bg-accent text-bg flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-opacity shrink-0 mt-4"
          aria-label="Registrar sesión de lectura"
        >
          {create.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
