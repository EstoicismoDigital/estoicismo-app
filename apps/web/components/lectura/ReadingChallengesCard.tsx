"use client";
import { useMemo, useState } from "react";
import {
  Trophy,
  Plus,
  X,
  Trash2,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import {
  useReadingChallenges,
  useCreateReadingChallenge,
  useDeleteReadingChallenge,
  useBooks,
} from "../../hooks/useReading";
import type { ReadingChallenge } from "@estoicismo/supabase";

const PRESETS = [
  { category: "estoicismo", label: "Estoicismo", emoji: "🏛", target: 5 },
  { category: "ficcion", label: "Ficción", emoji: "📚", target: 3 },
  { category: "negocios", label: "Negocios", emoji: "💼", target: 3 },
  { category: "biografia", label: "Biografía", emoji: "👤", target: 2 },
  { category: "filosofia", label: "Filosofía", emoji: "🧠", target: 3 },
  { category: "tecnico", label: "Técnico", emoji: "🔧", target: 2 },
];

/**
 * Reading Challenges Card · metas categorizadas anuales.
 *
 * El user define desafíos como "5 estoicos", "3 ficción". El progreso
 * se calcula client-side filtrando reading_books por category +
 * is_finished + finished_at en el año.
 *
 * No bloquea ni renombra categorías existentes — el matching es por
 * substring case-insensitive sobre book.category.
 */
export function ReadingChallengesCard() {
  const year = new Date().getFullYear();
  const { data: challenges = [] } = useReadingChallenges(year);
  const { data: books = [] } = useBooks({ is_finished: true });
  const create = useCreateReadingChallenge();
  const del = useDeleteReadingChallenge();
  const [adding, setAdding] = useState(false);

  // Filtrar libros completados en el año actual
  const finishedThisYear = useMemo(() => {
    return books.filter((b) => {
      if (!b.is_finished || !b.finished_at) return false;
      return b.finished_at.startsWith(String(year));
    });
  }, [books, year]);

  // Categorías disponibles para sugerir (presets + las que ya tienen
  // challenge). Filtro las que ya existen para no permitir duplicados.
  const usedCategories = new Set(
    challenges.map((c) => c.category.toLowerCase())
  );
  const availablePresets = PRESETS.filter(
    (p) => !usedCategories.has(p.category.toLowerCase())
  );

  if (challenges.length === 0) {
    return (
      <div className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Desafíos {year}
          </p>
          <span className="h-px flex-1 bg-line" />
        </div>
        <p className="font-body text-sm text-muted mb-4 leading-relaxed">
          Además del total de libros, define metas por género: estoicos,
          ficción, negocios. Lee con intención.
        </p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 h-9 px-4 rounded-full bg-accent text-bg font-body text-xs font-medium"
        >
          <Plus size={12} /> Agregar mi primer desafío
        </button>

        {adding && (
          <ChallengeAdder
            year={year}
            availablePresets={availablePresets}
            onClose={() => setAdding(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Trophy size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Desafíos {year} · {challenges.length}
        </p>
        <span className="h-px flex-1 bg-line min-w-4" />
      </div>

      <ul className="space-y-2.5">
        {challenges.map((c) => (
          <ChallengeRow
            key={c.id}
            challenge={c}
            booksFinished={finishedThisYear.filter((b) =>
              matchesCategory(b.category, c.category)
            ).length}
            onDelete={() => {
              if (confirm(`¿Eliminar desafío "${c.label}"?`))
                del.mutate(c.id);
            }}
          />
        ))}
      </ul>

      {availablePresets.length > 0 && !adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink"
        >
          <Plus size={12} /> Agregar otro
        </button>
      )}
      {adding && (
        <ChallengeAdder
          year={year}
          availablePresets={availablePresets}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}

function ChallengeRow({
  challenge,
  booksFinished,
  onDelete,
}: {
  challenge: ReadingChallenge;
  booksFinished: number;
  onDelete: () => void;
}) {
  const ratio = Math.min(1, booksFinished / challenge.target);
  const pct = Math.round(ratio * 100);
  const done = booksFinished >= challenge.target;

  return (
    <li
      className={clsx(
        "rounded-lg border p-3 group transition-colors",
        done ? "border-success/30 bg-success/5" : "border-line bg-bg"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{challenge.emoji}</span>
        <p className="font-body text-sm text-ink flex-1 truncate">
          {challenge.label}
        </p>
        <span
          className={clsx(
            "font-mono text-[10px] uppercase tracking-widest tabular-nums shrink-0",
            done ? "text-success" : "text-muted"
          )}
        >
          {booksFinished}/{challenge.target}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="h-6 w-6 rounded-full text-muted hover:text-danger opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          aria-label="Eliminar"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <div className="h-1.5 bg-bg-alt rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full transition-all",
            done ? "bg-success" : "bg-accent"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function ChallengeAdder({
  year,
  availablePresets,
  onClose,
}: {
  year: number;
  availablePresets: typeof PRESETS;
  onClose: () => void;
}) {
  const create = useCreateReadingChallenge();
  const [customLabel, setCustomLabel] = useState("");
  const [customTarget, setCustomTarget] = useState("3");
  const [showCustom, setShowCustom] = useState(false);

  async function addPreset(p: (typeof PRESETS)[number]) {
    await create.mutateAsync({
      year,
      category: p.category,
      label: p.label,
      target: p.target,
      emoji: p.emoji,
    });
    onClose();
  }

  async function addCustom() {
    const t = customLabel.trim();
    if (!t) return;
    const target = parseInt(customTarget, 10) || 1;
    await create.mutateAsync({
      year,
      category: t.toLowerCase().replace(/\s+/g, "_"),
      label: t,
      target,
    });
    onClose();
  }

  return (
    <div className="mt-3 rounded-lg border border-line bg-bg p-3 space-y-3">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted flex-1">
          Elige un género
        </p>
        <button
          type="button"
          onClick={onClose}
          className="h-6 w-6 rounded-full text-muted hover:bg-bg-alt flex items-center justify-center"
        >
          <X size={12} />
        </button>
      </div>

      {!showCustom && availablePresets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availablePresets.map((p) => (
            <button
              key={p.category}
              type="button"
              onClick={() => addPreset(p)}
              disabled={create.isPending}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-line bg-bg-alt hover:border-line-strong text-ink font-body text-xs disabled:opacity-50"
            >
              <span>{p.emoji}</span>
              {p.label} · {p.target}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-dashed border-line text-muted hover:text-ink font-body text-xs"
          >
            <Plus size={11} /> Otro
          </button>
        </div>
      )}

      {(showCustom || availablePresets.length === 0) && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            autoFocus
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Ej: Filosofía oriental"
            maxLength={60}
            className="flex-1 rounded-md border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="number"
            min={1}
            max={50}
            value={customTarget}
            onChange={(e) => setCustomTarget(e.target.value)}
            className="w-16 rounded-md border border-line bg-bg-alt px-2 py-2 font-display italic text-base text-ink text-center focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customLabel.trim() || create.isPending}
            className="h-9 w-9 rounded-full bg-accent text-bg flex items-center justify-center disabled:opacity-30"
            aria-label="Agregar"
          >
            <Check size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function matchesCategory(
  bookCat: string | null,
  challengeCat: string
): boolean {
  if (!bookCat) return false;
  return bookCat.toLowerCase().includes(challengeCat.toLowerCase());
}
