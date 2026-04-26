"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search,
  NotebookPen,
  X,
  Plus,
  Pin,
  Pencil,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";
import { useAllNotes } from "../../../hooks/useAllNotes";
import {
  useJournal,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from "../../../hooks/useJournal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

const JournalEntryModal = dynamic(
  () => import("../../../components/journal/JournalEntryModal").then((m) => m.JournalEntryModal),
  { ssr: false }
);
import {
  buildNoteEntries,
  formatNoteDayLabel,
  type NoteEntry,
} from "../../../lib/notes";
import { JOURNAL_AREAS, getAreaMeta } from "../../../lib/journal/areas";
import { getTodayStr } from "../../../lib/dateUtils";
import type { JournalArea, JournalEntry } from "@estoicismo/supabase";

/**
 * Diario unificado.
 *
 * Fusiona dos fuentes en un timeline:
 *   1. journal_entries — entradas libres del user (cualquier área)
 *   2. habit_logs.note — notas de cada hábito completado
 *
 * Ambas se ordenan por occurred_on/completed_at desc. Cada tipo
 * tiene su tarjeta visual (la de hábito linkea al detalle del
 * hábito; la de journal abre el modal de edición).
 *
 * Filtros:
 *   - Texto libre (busca en title + content + tags + nombre del hábito)
 *   - Por área (chips horizontales)
 */
export function NotasClient() {
  const today = getTodayStr();
  const { habits, logs, isLoading: loadingHabits } = useAllNotes();
  const [areaFilter, setAreaFilter] = useState<JournalArea | null>(null);
  const { data: journalEntries = [], isLoading: loadingJournal } = useJournal({
    area: areaFilter ?? undefined,
  });

  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<JournalEntry | null>(null);

  const createM = useCreateJournalEntry();
  const updateM = useUpdateJournalEntry();
  const deleteM = useDeleteJournalEntry();

  // Notas de hábitos como NoteEntry; sólo se muestran si areaFilter
  // es null o "habits".
  const habitNotes = useMemo(
    () =>
      areaFilter && areaFilter !== "habits" ? [] : buildNoteEntries(logs, habits),
    [logs, habits, areaFilter]
  );

  // Unificar todo en un timeline con tipo discriminante.
  type TimelineItem =
    | { kind: "journal"; date: string; pinned: boolean; data: JournalEntry }
    | { kind: "habit"; date: string; pinned: boolean; data: NoteEntry };

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];
    for (const j of journalEntries) {
      items.push({ kind: "journal", date: j.occurred_on, pinned: j.is_pinned, data: j });
    }
    for (const h of habitNotes) {
      items.push({ kind: "habit", date: h.date, pinned: false, data: h });
    }
    // Pinned primero, luego por fecha desc.
    items.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
    // Filtro de búsqueda
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter((item) => {
      if (item.kind === "journal") {
        const j = item.data;
        return (
          j.content.toLowerCase().includes(q) ||
          (j.title ?? "").toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      const h = item.data;
      return h.text.toLowerCase().includes(q) || h.habitName.toLowerCase().includes(q);
    });
  }, [journalEntries, habitNotes, query]);

  const isLoading = loadingHabits || loadingJournal;
  const hasAny = journalEntries.length > 0 || habitNotes.length > 0;

  // Agrupar por fecha (manteniendo pinned como sección "Fijadas").
  type DateGroup = { date: string; items: TimelineItem[]; isPinned?: boolean };
  const groups = useMemo<DateGroup[]>(() => {
    const result: DateGroup[] = [];
    const pinned = timeline.filter((t) => t.pinned);
    if (pinned.length > 0) result.push({ date: "pinned", items: pinned, isPinned: true });
    const rest = timeline.filter((t) => !t.pinned);
    let current: DateGroup | null = null;
    for (const it of rest) {
      if (!current || current.date !== it.date) {
        current = { date: it.date, items: [] };
        result.push(current);
      }
      current.items.push(it);
    }
    return result;
  }, [timeline]);

  return (
    <div className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Diario
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl">
            Tus pensamientos en un solo lugar.
          </h1>
          <p className="font-body text-white/60 text-sm mt-2 max-w-prose">
            Un diario para escribir lo que cargas. Etiquétalo por área de tu
            vida — fitness, finanzas, mentalidad — o déjalo libre.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Búsqueda + filtros */}
        <div className="space-y-3">
          {hasAny && <SearchBar query={query} onChange={setQuery} />}
          <AreaFilter value={areaFilter} onChange={setAreaFilter} />
        </div>

        {/* CTA flotante */}
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="w-full py-3 rounded-card bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 inline-flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Nueva entrada
        </button>

        {isLoading ? (
          <LoadingSkeleton />
        ) : !hasAny ? (
          <EmptyState onCreate={() => setModalOpen(true)} />
        ) : timeline.length === 0 ? (
          <NoMatchState
            query={query}
            onClear={() => {
              setQuery("");
              setAreaFilter(null);
            }}
          />
        ) : (
          <div className="space-y-7">
            {groups.map((group) => (
              <section key={group.date}>
                <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2.5 inline-flex items-center gap-1.5">
                  {group.isPinned ? (
                    <>
                      <Pin size={11} />
                      Fijadas
                    </>
                  ) : (
                    formatNoteDayLabel(group.date, today)
                  )}
                </h2>
                <ul className="space-y-2" role="list">
                  {group.items.map((it) =>
                    it.kind === "journal" ? (
                      <JournalCard
                        key={`j-${it.data.id}`}
                        entry={it.data}
                        onEdit={() => {
                          setEditing(it.data);
                          setModalOpen(true);
                        }}
                        onDelete={() => setConfirmDelete(it.data)}
                      />
                    ) : (
                      <HabitNoteCard key={`h-${it.data.logId}`} entry={it.data} />
                    )
                  )}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      <JournalEntryModal
        open={modalOpen}
        entry={editing}
        saving={createM.isPending || updateM.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={async (input) => {
          try {
            if (editing) {
              await updateM.mutateAsync({ id: editing.id, input });
            } else {
              await createM.mutateAsync(input);
            }
            setModalOpen(false);
            setEditing(null);
          } catch {
            /* hook toasts */
          }
        }}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Eliminar entrada?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteM.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
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
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
        <Search size={16} aria-hidden />
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Busca por texto, hábito o tag"
        aria-label="Buscar"
        className="w-full h-11 pl-10 pr-10 rounded-lg bg-bg-alt border border-line text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      {query && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar"
          className="absolute inset-y-0 right-2 flex items-center text-muted hover:text-ink"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function AreaFilter(props: {
  value: JournalArea | null;
  onChange: (v: JournalArea | null) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => props.onChange(null)}
        className={clsx(
          "px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest border whitespace-nowrap shrink-0",
          props.value === null
            ? "bg-ink text-bg border-ink"
            : "border-line text-muted hover:text-ink"
        )}
      >
        Todas
      </button>
      {JOURNAL_AREAS.map((a) => (
        <button
          key={a.key}
          type="button"
          onClick={() => props.onChange(a.key)}
          className={clsx(
            "px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest border whitespace-nowrap shrink-0 inline-flex items-center gap-1",
            props.value === a.key
              ? "border-current font-semibold"
              : "border-line text-muted hover:text-ink"
          )}
          style={
            props.value === a.key
              ? { color: a.color, backgroundColor: `${a.color}15` }
              : undefined
          }
        >
          <span className="text-xs">{a.emoji}</span>
          {a.label}
        </button>
      ))}
    </div>
  );
}

function JournalCard(props: {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { entry, onEdit, onDelete } = props;
  const meta = getAreaMeta(entry.area);
  return (
    <li
      className="rounded-card border bg-bg-alt/40 p-4 group"
      style={{ borderColor: `${meta.color}40` }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0"
            style={{ color: meta.color, backgroundColor: `${meta.color}15` }}
          >
            {meta.emoji} {meta.label}
          </span>
          {entry.title && (
            <p className="font-display italic text-base text-ink truncate">
              {entry.title}
            </p>
          )}
          {entry.is_pinned && <Pin size={12} className="text-accent shrink-0" />}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 text-muted hover:text-ink rounded"
            aria-label="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-muted hover:text-danger rounded"
            aria-label="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p className="text-[14px] text-ink/90 whitespace-pre-wrap leading-relaxed">
        {entry.content}
      </p>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted flex-wrap">
        {entry.mood !== null && <span>{"★".repeat(entry.mood)}</span>}
        {entry.tags.map((t) => (
          <span key={t} className="font-mono">
            #{t}
          </span>
        ))}
      </div>
    </li>
  );
}

function HabitNoteCard({ entry }: { entry: NoteEntry }) {
  return (
    <li>
      <Link
        href={`/habitos/${entry.habitId}`}
        className="block rounded-card bg-bg-alt/40 border border-line hover:border-accent/40 p-4 transition-colors"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm"
            style={{
              backgroundColor: `${entry.habitColor}22`,
              color: entry.habitColor,
            }}
          >
            {entry.habitIcon}
          </span>
          <span className="text-[13px] font-semibold text-ink">{entry.habitName}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted ml-auto">
            Hábito
          </span>
        </div>
        <p className="text-[14px] text-ink/90 whitespace-pre-wrap leading-relaxed">
          {entry.text}
        </p>
      </Link>
    </li>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 rounded-card bg-bg-alt animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="w-14 h-14 rounded-full bg-bg-alt mx-auto flex items-center justify-center text-muted">
        <NotebookPen size={22} />
      </div>
      <h2 className="font-display italic text-2xl text-ink">
        Tu diario empieza con una sola línea.
      </h2>
      <p className="text-sm text-muted max-w-xs mx-auto">
        Escribe algo — una preocupación, una victoria, una idea suelta.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest"
      >
        Empezar a escribir
      </button>
    </div>
  );
}

function NoMatchState(props: { query: string; onClear: () => void }) {
  return (
    <div className="text-center py-10">
      <p className="text-sm text-muted mb-3">
        Sin coincidencias{props.query ? ` para "${props.query}"` : ""}.
      </p>
      <button
        type="button"
        onClick={props.onClear}
        className="px-5 py-2 rounded-lg border border-line text-ink hover:bg-bg-alt"
      >
        Quitar filtros
      </button>
    </div>
  );
}
