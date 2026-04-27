"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Pin, PinOff } from "lucide-react";
import { clsx } from "clsx";
import type { JournalEntry, JournalArea, CreateJournalEntryInput } from "@estoicismo/supabase";
import { JOURNAL_AREAS, getAreaMeta } from "../../lib/journal/areas";

export function JournalEntryModal(props: {
  open: boolean;
  entry?: JournalEntry | null;
  /** Área pre-seleccionada (cuando se abre desde un módulo concreto). */
  initialArea?: JournalArea;
  onClose: () => void;
  onSave: (input: CreateJournalEntryInput) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, entry, initialArea, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [area, setArea] = useState<JournalArea>(entry?.area ?? initialArea ?? "free");
  const [tagsInput, setTagsInput] = useState((entry?.tags ?? []).join(" "));
  const [occurredOn, setOccurredOn] = useState(entry?.occurred_on ?? today);
  const [pinned, setPinned] = useState(entry?.is_pinned ?? false);

  useEffect(() => {
    if (!open) return;
    setTitle(entry?.title ?? "");
    setContent(entry?.content ?? "");
    setMood(entry?.mood ?? null);
    setArea(entry?.area ?? initialArea ?? "free");
    setTagsInput((entry?.tags ?? []).join(" "));
    setOccurredOn(entry?.occurred_on ?? today);
    setPinned(entry?.is_pinned ?? false);
  }, [open, entry, initialArea, today]);

  async function handleSave() {
    if (!content.trim()) return;
    const tags = tagsInput
      .split(/\s+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    await onSave({
      title: title.trim() || null,
      content: content.trim(),
      mood,
      area,
      tags,
      occurred_on: occurredOn,
      is_pinned: pinned,
    });
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Cmd/Ctrl+Enter guarda desde cualquier campo del modal
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, content, tagsInput, title, mood, area, occurredOn, pinned]);

  if (!mounted || !open) return null;

  const meta = getAreaMeta(area);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">
            {entry ? "Editar entrada" : "Nueva entrada"}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPinned((p) => !p)}
              className={clsx(
                "p-1.5 rounded-full",
                pinned ? "text-accent" : "text-muted hover:text-ink"
              )}
              aria-label={pinned ? "Desfijar" : "Fijar"}
            >
              {pinned ? <Pin size={16} /> : <PinOff size={16} />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Área */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
              Área
            </label>
            <div className="flex gap-1 flex-wrap">
              {JOURNAL_AREAS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setArea(a.key)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-[11px] border transition-colors inline-flex items-center gap-1",
                    area === a.key
                      ? "border-current font-semibold"
                      : "border-line text-muted hover:text-ink"
                  )}
                  style={
                    area === a.key
                      ? { color: a.color, backgroundColor: `${a.color}15` }
                      : undefined
                  }
                >
                  <span>{a.emoji}</span>
                  {a.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted italic mt-1.5">
              {meta.description}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Título (opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Una palabra que la nombre"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Lo que cargas
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Escribe sin filtro. Después puedes editar."
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink resize-none focus:outline-none focus:border-accent leading-relaxed"
              autoFocus
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
              ¿Cómo te sientes?
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMood(mood === n ? null : n)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg border text-sm transition-colors",
                    mood === n
                      ? "bg-accent text-bg border-accent"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted mt-1">
              1 = muy mal · 5 = excelente · opcional
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Tags (separados por espacio)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="gratitud miedo papá meta-2026"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent font-mono text-[12px]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="border-t border-line px-5 py-3 flex justify-end gap-2 sticky bottom-0 bg-bg-alt/95">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!content.trim() || saving}
            onClick={handleSave}
            className={clsx(
              "px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest",
              "hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            )}
            title="Guardar (⌘ + Enter)"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {entry ? "Guardar" : "Crear entrada"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
