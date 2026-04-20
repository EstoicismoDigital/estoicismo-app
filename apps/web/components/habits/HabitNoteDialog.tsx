"use client";
import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

const MAX_NOTE_LENGTH = 500;

export function HabitNoteDialog({
  open,
  habitName,
  initialNote,
  onSave,
  onClose,
  saving,
}: {
  open: boolean;
  habitName: string;
  initialNote: string | null;
  onSave: (note: string | null) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
}) {
  const [note, setNote] = useState(initialNote ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Seed value whenever the dialog opens (so re-opens show persisted text)
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      setNote(initialNote ?? "");
      // Defer focus to let the dialog mount
      setTimeout(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        // Place cursor at end, not a distracting select-all
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }, 10);
    } else if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, [open, initialNote]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const trimmed = note.trim();
  const isUnchanged = trimmed === (initialNote?.trim() ?? "");
  const canSave = !saving && !isUnchanged;
  const remaining = MAX_NOTE_LENGTH - note.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    await onSave(trimmed.length > 0 ? trimmed : null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-note-title"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
      />

      <div className="relative bg-bg w-full sm:max-w-md sm:rounded-modal rounded-t-modal shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg border-b border-line px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Reflexión del día
            </p>
            <h2
              id="habit-note-title"
              className="font-display italic text-xl sm:text-2xl text-ink mt-0.5 truncate"
            >
              {habitName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 rounded-lg text-muted hover:text-ink hover:bg-bg-alt flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 flex flex-col gap-4">
          <label htmlFor="habit-note" className="sr-only">
            Nota para el día
          </label>
          <textarea
            id="habit-note"
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
            placeholder="¿Qué aprendiste hoy? ¿Cómo te sentiste?"
            rows={5}
            maxLength={MAX_NOTE_LENGTH}
            className="w-full rounded-lg border border-line bg-bg-alt px-4 py-3 font-body text-base text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent transition-shadow resize-none"
          />

          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {remaining} restantes
            </p>
            {initialNote && (
              <button
                type="button"
                onClick={() => setNote("")}
                className="font-body text-xs text-muted hover:text-danger transition-colors"
              >
                Borrar nota
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg-alt transition-colors min-w-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ease-out active:scale-[0.98]"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
