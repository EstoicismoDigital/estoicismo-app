"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, NotebookPen, X } from "lucide-react";
import { useAllNotes } from "../../../hooks/useAllNotes";
import {
  buildNoteEntries,
  filterNotes,
  formatNoteDayLabel,
  groupNotesByDate,
  type NoteEntry,
} from "../../../lib/notes";
import { getTodayStr } from "../../../lib/dateUtils";

export function NotasClient() {
  const { habits, logs, isLoading } = useAllNotes();
  const [query, setQuery] = useState("");

  const today = getTodayStr();
  const allEntries = useMemo(
    () => buildNoteEntries(logs, habits),
    [logs, habits]
  );
  const filtered = useMemo(
    () => filterNotes(allEntries, query),
    [allEntries, query]
  );
  const groups = useMemo(() => groupNotesByDate(filtered), [filtered]);

  return (
    <div className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Reflexiones
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl">
            Tus notas
          </h1>
          <p className="font-body text-white/60 text-sm mt-2 max-w-prose">
            &ldquo;Escribe lo que puedas enseñar a los demás; repite lo que
            puedas recordar.&rdquo; —{" "}
            <span className="italic">Séneca</span>. Cada completado puede
            llevar una nota; aquí las encontrarás todas juntas.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Search — only shown when there's something to search */}
        {!isLoading && allEntries.length > 0 && (
          <SearchBar query={query} onChange={setQuery} />
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : allEntries.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <NoMatchState query={query} onClear={() => setQuery("")} />
        ) : (
          <NoteTimeline groups={groups} today={today} />
        )}
      </section>
    </div>
  );
}

function SearchBar({
  query,
  onChange,
}: {
  query: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative mb-6">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
        <Search size={16} aria-hidden />
      </div>
      <input
        type="search"
        inputMode="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Busca en tus notas o por hábito"
        aria-label="Buscar notas"
        className="w-full min-h-[44px] h-11 pl-10 pr-10 rounded-lg bg-bg-alt border border-line font-body text-[15px] text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      {query && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute inset-y-0 right-2 flex items-center justify-center w-8 h-full text-muted hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        >
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <div className="h-4 w-24 bg-bg-alt rounded animate-pulse" />
          <div className="h-20 rounded-card bg-bg-alt animate-pulse" />
          <div className="h-20 rounded-card bg-bg-alt animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-full bg-bg-alt mx-auto mb-5 flex items-center justify-center text-muted">
        <NotebookPen size={22} />
      </div>
      <h2 className="font-display italic text-2xl text-ink mb-2">
        Aún no has escrito reflexiones.
      </h2>
      <p className="font-body text-muted text-sm mb-6 max-w-xs mx-auto">
        Cuando completes un hábito, toca el icono de nota y escribe una línea.
        Aparecerá aquí.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center min-h-[44px] h-12 px-6 rounded-lg bg-ink text-white font-body font-medium text-base hover:opacity-90 transition-opacity"
      >
        Ir a mis hábitos
      </Link>
    </div>
  );
}

function NoMatchState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="text-center py-12">
      <p className="font-body text-sm text-muted mb-4">
        Sin resultados para &ldquo;{query}&rdquo;.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center justify-center min-h-[44px] h-11 px-5 rounded-lg border border-line text-ink font-body text-sm hover:bg-bg-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Limpiar búsqueda
      </button>
    </div>
  );
}

function NoteTimeline({
  groups,
  today,
}: {
  groups: { date: string; notes: NoteEntry[] }[];
  today: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.date} aria-labelledby={`day-${group.date}`}>
          <h2
            id={`day-${group.date}`}
            className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3"
          >
            {formatNoteDayLabel(group.date, today)}
          </h2>
          <ul className="flex flex-col gap-2.5" role="list">
            {group.notes.map((n) => (
              <li key={n.logId}>
                <NoteCard entry={n} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function NoteCard({ entry }: { entry: NoteEntry }) {
  return (
    <Link
      href={`/habitos/${entry.habitId}`}
      className="block p-4 rounded-card bg-bg-alt border border-line hover:border-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm"
          style={{
            backgroundColor: `${entry.habitColor}22`,
            color: entry.habitColor,
          }}
        >
          {entry.habitIcon}
        </span>
        <span className="font-body text-[13px] font-medium text-ink">
          {entry.habitName}
        </span>
      </div>
      <p className="font-body text-[15px] text-ink leading-relaxed whitespace-pre-wrap break-words">
        {entry.text}
      </p>
    </Link>
  );
}
