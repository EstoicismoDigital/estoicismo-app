"use client";
import { useMemo, useState } from "react";
import { Mail, MailOpen, Lock, Plus, X, Check, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import {
  useFutureLetters,
  useCreateFutureLetter,
  useOpenFutureLetter,
  useDeleteFutureLetter,
} from "../../hooks/useMindset";
import type { MindsetFutureLetter } from "@estoicismo/supabase";
import { getTodayStr } from "../../lib/dateUtils";

/**
 * Cartas a tu yo del futuro.
 *
 * UX:
 *  - El usuario escribe carta + define open_on (fecha).
 *  - Antes de open_on: visible pero sellada (no se puede leer).
 *  - En open_on o después: se puede "abrir" (toca un botón → marca
 *    is_opened y muestra contenido).
 *  - Tono: solemne, ritual. Sin notificaciones automáticas — el usuario
 *    es responsable de regresar.
 */

export function FutureLetterSection() {
  const today = useMemo(() => getTodayStr(), []);
  const [composing, setComposing] = useState(false);
  const [reading, setReading] = useState<MindsetFutureLetter | null>(null);

  const { data: letters = [] } = useFutureLetters();
  const open = useOpenFutureLetter();
  const del = useDeleteFutureLetter();

  const sorted = useMemo(() => {
    return [...letters].sort((a, b) => {
      // Próximas a abrir primero, luego abiertas, luego ya pasadas no abiertas.
      const aReady = a.open_on <= today && !a.is_opened ? 0 : a.is_opened ? 2 : 1;
      const bReady = b.open_on <= today && !b.is_opened ? 0 : b.is_opened ? 2 : 1;
      if (aReady !== bReady) return aReady - bReady;
      return a.open_on.localeCompare(b.open_on);
    });
  }, [letters, today]);

  const readyCount = letters.filter(
    (l) => l.open_on <= today && !l.is_opened
  ).length;

  return (
    <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Mail size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Cartas a tu yo del futuro
        </p>
        <span className="h-px flex-1 bg-line min-w-4" />
        {readyCount > 0 && (
          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-accent/10 text-accent font-mono text-[9px] uppercase tracking-widest">
            <MailOpen size={10} /> {readyCount} esperándote
          </span>
        )}
        <button
          onClick={() => setComposing(true)}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-accent text-bg font-body text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={12} /> Escribir
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center">
          <Mail size={28} className="mx-auto text-muted/50 mb-3" />
          <p className="font-body text-sm text-muted max-w-xs mx-auto leading-relaxed">
            Escríbele algo a tu yo de mañana, del próximo año, de los 50.
            Cuando llegue la fecha, podrás abrirla.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((letter) => {
            const ready = letter.open_on <= today;
            const opened = letter.is_opened;
            return (
              <li
                key={letter.id}
                className={clsx(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  opened
                    ? "border-line bg-bg/50"
                    : ready
                      ? "border-accent bg-accent/5 hover:bg-accent/10 cursor-pointer"
                      : "border-line bg-bg-alt/40"
                )}
                onClick={() => {
                  if (opened || ready) setReading(letter);
                }}
              >
                <div
                  className={clsx(
                    "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
                    opened
                      ? "bg-bg-alt text-muted"
                      : ready
                        ? "bg-accent text-bg"
                        : "bg-bg-alt text-muted"
                  )}
                >
                  {opened ? (
                    <MailOpen size={14} />
                  ) : ready ? (
                    <Mail size={14} />
                  ) : (
                    <Lock size={14} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink truncate">
                    {letter.title || "Carta sin título"}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {opened
                      ? `Leída · ${formatDate(letter.opened_at)}`
                      : ready
                        ? `Lista · ${formatDate(letter.open_on)}`
                        : `Sellada · abre ${formatDate(letter.open_on)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("¿Borrar carta?")) del.mutate(letter.id);
                  }}
                  className="h-7 w-7 rounded-full text-muted hover:bg-bg-alt hover:text-danger flex items-center justify-center"
                  title="Borrar"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {composing && <ComposeLetterModal onClose={() => setComposing(false)} />}
      {reading && (
        <ReadLetterModal
          letter={reading}
          onClose={() => setReading(null)}
          onOpen={() => {
            if (!reading.is_opened) open.mutate(reading.id);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────

function ComposeLetterModal({ onClose }: { onClose: () => void }) {
  const today = getTodayStr();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [openOn, setOpenOn] = useState(addDays(today, 7));
  const create = useCreateFutureLetter();

  const canSave =
    !create.isPending &&
    content.trim().length > 0 &&
    openOn > today;

  async function save() {
    if (!canSave) return;
    await create.mutateAsync({
      title: title.trim() || null,
      content: content.trim(),
      open_on: openOn,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-bg rounded-card border border-line shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h3 className="font-display italic text-xl text-ink">
            Carta a tu yo del futuro
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Título (opcional)
            </p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="A mi yo de los 30…"
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Tu carta
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Querido yo del futuro…"
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none leading-relaxed"
            />
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              ¿Cuándo se podrá abrir?
            </p>
            <input
              type="date"
              value={openOn}
              min={addDays(today, 1)}
              onChange={(e) => setOpenOn(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex gap-1.5 mt-2">
              {[
                { label: "+7 días", v: addDays(today, 7) },
                { label: "+1 mes", v: addDays(today, 30) },
                { label: "+6 meses", v: addDays(today, 180) },
                { label: "+1 año", v: addDays(today, 365) },
                { label: "+5 años", v: addDays(today, 365 * 5) },
              ].map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setOpenOn(q.v)}
                  className={clsx(
                    "h-7 px-2.5 rounded-full border font-mono text-[10px] uppercase tracking-widest",
                    openOn === q.v
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line bg-bg text-muted hover:text-ink"
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
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
            disabled={!canSave}
            onClick={save}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-accent text-bg font-body text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            <Check size={14} />
            Sellar carta
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadLetterModal({
  letter,
  onClose,
  onOpen,
}: {
  letter: MindsetFutureLetter;
  onClose: () => void;
  onOpen: () => void;
}) {
  const today = getTodayStr();
  const ready = letter.open_on <= today;
  const opened = letter.is_opened;
  const [revealed, setRevealed] = useState(opened);

  function reveal() {
    onOpen();
    setRevealed(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-bg rounded-card border border-line shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-line">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {opened
                ? `Abierta ${formatDate(letter.opened_at)}`
                : ready
                  ? "Listo para abrir"
                  : `Sellada hasta ${formatDate(letter.open_on)}`}
            </p>
            <h3 className="font-display italic text-xl text-ink truncate">
              {letter.title || "Carta sin título"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {revealed ? (
            <p className="font-body text-base text-ink whitespace-pre-wrap leading-relaxed">
              {letter.content}
            </p>
          ) : ready ? (
            <div className="text-center py-10">
              <MailOpen size={40} className="mx-auto text-accent mb-4" />
              <p className="font-body text-sm text-muted mb-6 max-w-xs mx-auto leading-relaxed">
                Escribiste esta carta el{" "}
                <span className="text-ink">
                  {formatDate(letter.created_at)}
                </span>
                . Hoy es el día.
              </p>
              <button
                onClick={reveal}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90"
              >
                <MailOpen size={16} />
                Abrir carta
              </button>
            </div>
          ) : (
            <div className="text-center py-10">
              <Lock size={40} className="mx-auto text-muted mb-4" />
              <p className="font-body text-sm text-muted max-w-xs mx-auto leading-relaxed">
                Esta carta se abrirá el{" "}
                <span className="text-ink">{formatDate(letter.open_on)}</span>.
                Hasta entonces, está sellada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function addDays(yyyymmdd: string, n: number): string {
  const [y, m, d] = yyyymmdd.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  return dt.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
