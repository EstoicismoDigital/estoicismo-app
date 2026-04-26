"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type { ReadingBook, CreateSessionInput } from "@estoicismo/supabase";
import { formatDuration } from "../../lib/reading/stats";

/**
 * Modal post-cronómetro: páginas leídas + resumen + cita destacada.
 *
 * El resumen "con tus palabras" es la pieza central: forzamos al
 * usuario a procesar lo que leyó, no a memorizar.
 */
export function SessionSummaryModal(props: {
  open: boolean;
  durationSeconds: number;
  currentBook: ReadingBook | null;
  onClose: () => void;
  onSave: (input: CreateSessionInput) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, durationSeconds, currentBook, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [pagesFrom, setPagesFrom] = useState<string>(
    currentBook?.current_page !== undefined ? String(currentBook.current_page) : ""
  );
  const [pagesTo, setPagesTo] = useState<string>("");
  const [summary, setSummary] = useState("");
  const [highlight, setHighlight] = useState("");
  const [mood, setMood] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setPagesFrom(
      currentBook?.current_page !== undefined ? String(currentBook.current_page) : ""
    );
    setPagesTo("");
    setSummary("");
    setHighlight("");
    setMood(null);
  }, [open, currentBook]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">Sesión registrada</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="text-center py-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Tiempo leído
            </p>
            <p className="font-display italic text-3xl text-ink">
              {formatDuration(durationSeconds)}
            </p>
          </div>

          {currentBook && (
            <div className="rounded-lg bg-bg/40 border border-line/60 p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                Libro actual
              </p>
              <p className="text-sm font-semibold text-ink">{currentBook.title}</p>
              {currentBook.author && (
                <p className="text-[11px] text-muted">{currentBook.author}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Página desde
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={pagesFrom}
                onChange={(e) => setPagesFrom(e.target.value)}
                placeholder="0"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Hasta
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={pagesTo}
                onChange={(e) => setPagesTo(e.target.value)}
                placeholder="0"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Resumen con tus palabras *
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              placeholder="¿Qué entendiste? ¿Qué te llevó? Sin pulir, en tu propio idioma."
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent resize-none"
            />
            <p className="text-[10px] text-muted mt-1 italic">
              Procesar {">"} memorizar. Tu cerebro retiene lo que reformula.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Cita destacada (opcional)
            </label>
            <textarea
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              rows={2}
              placeholder='"Una frase que vale guardar…"'
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
              ¿Cómo te dejó la lectura?
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
          </div>
        </div>

        <div className="border-t border-line px-5 py-3 flex justify-end gap-2 sticky bottom-0 bg-bg-alt/95">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink"
          >
            Descartar
          </button>
          <button
            type="button"
            disabled={!summary.trim() || saving}
            onClick={async () => {
              if (!summary.trim()) return;
              await onSave({
                book_id: currentBook?.id ?? null,
                duration_seconds: durationSeconds,
                pages_from: pagesFrom !== "" ? Number(pagesFrom) : null,
                pages_to: pagesTo !== "" ? Number(pagesTo) : null,
                summary: summary.trim(),
                highlight: highlight.trim() || null,
                mood,
              });
              onClose();
            }}
            className={clsx(
              "px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest",
              "hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Guardar sesión
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
