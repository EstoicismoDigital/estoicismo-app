"use client";
import { useState } from "react";
import {
  Quote,
  Plus,
  Star,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import {
  useHighlightsByBook,
  useCreateHighlight,
  useUpdateHighlight,
  useDeleteHighlight,
} from "../../hooks/useReading";
import type { ReadingHighlight } from "@estoicismo/supabase";

/**
 * HighlightsSection · citas/subrayados por libro.
 *
 * Pensado como Kindle highlights — el user transcribe a mano la
 * frase que le marcó. Opcional: número de página + nota personal.
 * Toggle favorito para revisión rápida.
 */
export function HighlightsSection({
  bookId,
  bookTitle,
}: {
  bookId: string;
  bookTitle: string;
}) {
  const { data: highlights = [] } = useHighlightsByBook(bookId);
  const create = useCreateHighlight();
  const update = useUpdateHighlight();
  const del = useDeleteHighlight();
  const [adding, setAdding] = useState(false);

  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Quote size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Citas · {highlights.length}
        </p>
        <span className="h-px flex-1 bg-line" />
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-accent text-bg font-mono text-[9px] uppercase tracking-widest font-medium"
          >
            <Plus size={10} /> Añadir
          </button>
        )}
      </div>

      {adding && (
        <HighlightForm
          bookId={bookId}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}

      {highlights.length === 0 && !adding && (
        <p className="font-body text-sm text-muted leading-relaxed py-3">
          Cita una frase de <span className="italic">{bookTitle}</span>{" "}
          que te marcó. Puedes añadir tu reflexión personal.
        </p>
      )}

      <ul className="space-y-2 mt-2">
        {highlights.map((h) => (
          <HighlightRow
            key={h.id}
            highlight={h}
            onToggleFavorite={() =>
              update.mutate({
                id: h.id,
                input: { is_favorite: !h.is_favorite },
              })
            }
            onDelete={() => {
              if (confirm("¿Borrar esta cita?")) del.mutate(h.id);
            }}
          />
        ))}
      </ul>
    </div>
  );
}

function HighlightForm({
  bookId,
  onCancel,
  onSaved,
}: {
  bookId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const create = useCreateHighlight();
  const [content, setContent] = useState("");
  const [page, setPage] = useState("");
  const [note, setNote] = useState("");

  async function save() {
    if (!content.trim()) return;
    await create.mutateAsync({
      book_id: bookId,
      content: content.trim(),
      page: page ? parseInt(page, 10) : null,
      note: note.trim() || null,
    });
    setContent("");
    setPage("");
    setNote("");
    onSaved();
  }

  return (
    <div className="rounded-lg border border-line bg-bg p-3 mb-3 space-y-2">
      <textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Cita textual de la página..."
        className="w-full rounded-md border border-line bg-bg-alt px-3 py-2 font-display italic text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          placeholder="Página"
          className="w-20 rounded-md border border-line bg-bg-alt px-2 py-1.5 font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent tabular-nums"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tu reflexión (opcional)"
          maxLength={300}
          className="flex-1 rounded-md border border-line bg-bg-alt px-3 py-1.5 font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink h-7 px-3 rounded-full hover:bg-bg-alt"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!content.trim() || create.isPending}
          className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-accent text-bg font-mono text-[10px] uppercase tracking-widest font-medium disabled:opacity-40"
        >
          <Check size={11} /> Guardar
        </button>
      </div>
    </div>
  );
}

function HighlightRow({
  highlight,
  onToggleFavorite,
  onDelete,
}: {
  highlight: ReadingHighlight;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={clsx(
        "rounded-lg border p-3 group transition-colors",
        highlight.is_favorite
          ? "border-accent/30 bg-accent/5"
          : "border-line bg-bg"
      )}
    >
      <p className="font-display italic text-sm text-ink leading-relaxed">
        &ldquo;{highlight.content}&rdquo;
      </p>
      {highlight.note && (
        <p className="font-body text-xs text-muted leading-relaxed mt-2 border-l-2 border-accent/30 pl-2">
          {highlight.note}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
          {highlight.page != null && <>p. {highlight.page} · </>}
          {formatDate(highlight.created_at)}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleFavorite}
            title={
              highlight.is_favorite ? "Quitar favorito" : "Marcar favorito"
            }
            className={clsx(
              "h-7 w-7 rounded-full flex items-center justify-center transition-colors",
              highlight.is_favorite
                ? "text-accent"
                : "text-muted hover:text-accent opacity-0 group-hover:opacity-100"
            )}
          >
            <Star
              size={12}
              fill={highlight.is_favorite ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Borrar"
            className="h-7 w-7 rounded-full text-muted hover:text-danger opacity-0 group-hover:opacity-100 flex items-center justify-center"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </li>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}
