"use client";
import { useMemo, useState } from "react";
import { Target, Plus, Trash2, X, Check } from "lucide-react";
import { clsx } from "clsx";
import {
  useOkrs,
  useCreateOkr,
  useUpdateOkr,
  useDeleteOkr,
} from "../../hooks/useBusiness";
import type { BusinessOkr } from "@estoicismo/supabase";

const MAX_OKRS = 3;

/**
 * OKRs trimestrales · 3 ambiciones por trimestre con progreso 0-100.
 *
 * Filosofía: máximo 3 — si todo es prioridad, nada es prioridad.
 * El user mueve el slider manualmente; no hay auto-tracking porque
 * cada OKR es subjetivo (ej. "lanzar producto X" no es contable).
 */
export function OkrsCard() {
  const quarter = useMemo(() => currentQuarterIso(), []);
  const { data: okrs = [] } = useOkrs(quarter);
  const create = useCreateOkr();
  const update = useUpdateOkr();
  const del = useDeleteOkr();

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const active = okrs.filter((o) => o.status !== "dropped");
  const canAdd = active.length < MAX_OKRS;

  async function add() {
    const t = newTitle.trim();
    if (!t) return;
    await create.mutateAsync({
      quarter,
      title: t,
      progress: 0,
      position: active.length,
    });
    setNewTitle("");
    setAdding(false);
  }

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Target size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          OKRs · {prettyQuarter(quarter)}
        </p>
        <span className="h-px flex-1 bg-line min-w-4" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
          {active.length}/{MAX_OKRS}
        </span>
      </div>
      <p className="font-body text-sm text-muted mb-4 leading-relaxed">
        Máximo 3 ambiciones por trimestre. Si todo es prioridad, nada
        es prioridad.
      </p>

      {active.length === 0 && !adding && (
        <div className="text-center py-6">
          <Target size={28} className="mx-auto text-muted/50 mb-2" />
          <p className="font-body text-sm text-muted mb-3">
            Define lo que sí importa este trimestre.
          </p>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 h-9 px-4 rounded-full bg-accent text-bg font-body text-xs font-medium"
          >
            <Plus size={12} /> Mi primer OKR
          </button>
        </div>
      )}

      {active.length > 0 && (
        <ul className="space-y-3 mb-3">
          {active.map((o) => (
            <OkrRow
              key={o.id}
              okr={o}
              onProgressChange={(p) =>
                update.mutate({
                  id: o.id,
                  input: { progress: p, status: p >= 100 ? "done" : "active" },
                })
              }
              onTitleChange={(t) =>
                update.mutate({ id: o.id, input: { title: t } })
              }
              onDelete={() => del.mutate(o.id)}
            />
          ))}
        </ul>
      )}

      {adding ? (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-bg p-2">
          <Target size={14} className="text-accent shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void add();
              if (e.key === "Escape") {
                setAdding(false);
                setNewTitle("");
              }
            }}
            placeholder="Ej: Llegar a $20k/mes en ventas"
            maxLength={120}
            className="flex-1 bg-transparent border-0 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewTitle("");
            }}
            className="h-8 w-8 rounded-full text-muted hover:bg-bg-alt flex items-center justify-center"
            aria-label="Cancelar"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={add}
            disabled={!newTitle.trim() || create.isPending}
            className="h-8 w-8 rounded-full bg-accent text-bg flex items-center justify-center disabled:opacity-30"
          >
            <Check size={14} />
          </button>
        </div>
      ) : canAdd && active.length > 0 ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink"
        >
          <Plus size={12} /> Añadir OKR
        </button>
      ) : null}
    </section>
  );
}

function OkrRow({
  okr,
  onProgressChange,
  onTitleChange,
  onDelete,
}: {
  okr: BusinessOkr;
  onProgressChange: (p: number) => void;
  onTitleChange: (t: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(okr.title);
  const done = okr.status === "done" || okr.progress >= 100;

  return (
    <li
      className={clsx(
        "rounded-lg border p-3 group transition-colors",
        done ? "border-success/30 bg-success/5" : "border-line bg-bg"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {editing ? (
          <input
            type="text"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft.trim() && draft !== okr.title) onTitleChange(draft.trim());
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (draft.trim() && draft !== okr.title)
                  onTitleChange(draft.trim());
                setEditing(false);
              }
              if (e.key === "Escape") {
                setDraft(okr.title);
                setEditing(false);
              }
            }}
            className="flex-1 bg-bg-alt border border-line rounded px-2 py-1 font-body text-sm text-ink focus:outline-none focus:border-accent"
            maxLength={120}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 text-left font-body text-sm text-ink truncate hover:text-accent"
          >
            {okr.title}
          </button>
        )}
        <span
          className={clsx(
            "font-mono text-[10px] uppercase tracking-widest tabular-nums shrink-0",
            done ? "text-success" : "text-accent"
          )}
        >
          {okr.progress}%
        </span>
        <button
          type="button"
          onClick={() => {
            if (confirm(`¿Eliminar "${okr.title}"?`)) onDelete();
          }}
          className="h-6 w-6 rounded-full text-muted hover:text-danger opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          aria-label="Eliminar OKR"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={okr.progress}
        onChange={(e) => onProgressChange(parseInt(e.target.value, 10))}
        className={clsx(
          "w-full",
          done ? "accent-success" : "accent-accent"
        )}
        aria-label="Progreso del OKR"
      />
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function currentQuarterIso(date: Date = new Date()): string {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}

function prettyQuarter(iso: string): string {
  const [year, q] = iso.split("-");
  return `${q} ${year}`;
}
