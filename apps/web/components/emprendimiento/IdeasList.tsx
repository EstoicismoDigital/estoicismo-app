"use client";
import { useState } from "react";
import { Star, StarOff, Trash2, ChevronDown, ChevronUp, Target, Skull } from "lucide-react";
import { clsx } from "clsx";
import type { BusinessIdea } from "@estoicismo/supabase";
import { ikigaiOverallScore, IKIGAI_AXES } from "../../lib/business/ikigai";
import { IkigaiRadar } from "./IkigaiRadar";

export function IdeasList(props: {
  ideas: BusinessIdea[];
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { ideas, onToggleFavorite, onDelete } = props;
  if (ideas.length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="font-display italic text-xl text-ink">Tus ideas guardadas</h3>
      <ul className="space-y-3">
        {ideas.map((i) => (
          <IdeaCard
            key={i.id}
            idea={i}
            onToggleFavorite={() => onToggleFavorite(i.id, i.is_favorite)}
            onDelete={() => onDelete(i.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function IdeaCard(props: {
  idea: BusinessIdea;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const { idea, onToggleFavorite, onDelete } = props;
  const [expanded, setExpanded] = useState(false);

  const meta = idea.meta ?? {};
  const ikigaiOverall = meta.ikigai
    ? ikigaiOverallScore(meta.ikigai)
    : null;
  const validWhys = (meta.whys ?? []).filter((w) => w.trim().length > 0);
  const deepestWhy = validWhys[validWhys.length - 1];
  const hasIkigai = ikigaiOverall && ikigaiOverall.filledAxes > 0;

  // Color del badge según el origen del wizard.
  const kindBadge =
    meta.kind === "have-idea"
      ? { label: "Validada", color: "#0EA5E9" }
      : meta.kind === "exploring"
      ? { label: "Exploración", color: "#9333EA" }
      : null;

  return (
    <li className="rounded-card border border-line bg-bg-alt/30 overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <button
          type="button"
          onClick={onToggleFavorite}
          className={
            idea.is_favorite
              ? "text-accent hover:opacity-80 mt-0.5"
              : "text-muted hover:text-accent mt-0.5"
          }
          aria-label="Favorito"
        >
          {idea.is_favorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="font-display italic text-base text-ink">
              {idea.title}
            </p>
            {kindBadge && (
              <span
                className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{ color: kindBadge.color, backgroundColor: `${kindBadge.color}15` }}
              >
                {kindBadge.label}
              </span>
            )}
            {hasIkigai && ikigaiOverall && (
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: scoreColor(ikigaiOverall.score),
                  backgroundColor: `${scoreColor(ikigaiOverall.score)}15`,
                }}
              >
                IKIGAI {ikigaiOverall.score}
              </span>
            )}
          </div>
          {idea.description && (
            <p className="text-[12px] text-muted leading-relaxed mt-1 line-clamp-2">
              {idea.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted flex-wrap">
            {idea.category && <span>· {idea.category}</span>}
            {idea.startup_cost_text && <span>· {idea.startup_cost_text}</span>}
            {validWhys.length > 0 && <span>· {validWhys.length} porqués</span>}
            {meta.premortem && <span>· pre-mortem</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {(hasIkigai || deepestWhy || meta.premortem) && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="text-muted hover:text-ink p-1"
              aria-label={expanded ? "Ocultar detalle" : "Ver detalle"}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="text-muted hover:text-danger p-1"
            aria-label="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-line/40 bg-bg/40 p-4 space-y-3">
          {/* Ikigai mini-radar + diagnóstico */}
          {hasIkigai && meta.ikigai && (
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-start">
              <div className="text-accent">
                <IkigaiRadar scores={meta.ikigai} size={140} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                  Ejes Ikigai
                </p>
                <ul className="space-y-1">
                  {IKIGAI_AXES.map((a) => {
                    const score = meta.ikigai?.[a.key] ?? null;
                    return (
                      <li
                        key={a.key}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-ink/90 inline-flex items-center gap-1.5">
                          <span>{a.emoji}</span>
                          {a.label}
                        </span>
                        <span
                          className="font-mono"
                          style={{ color: a.color }}
                        >
                          {score ?? "—"}/5
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Why profundo */}
          {deepestWhy && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent inline-flex items-center gap-1 mb-1">
                <Target size={11} /> Tu porqué profundo
              </p>
              <p className="text-[12px] text-ink/90 italic leading-relaxed">
                {deepestWhy}
              </p>
            </div>
          )}

          {/* Pre-mortem */}
          {meta.premortem && (
            <div className="rounded-lg border border-orange-400/30 bg-orange-400/5 p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400 inline-flex items-center gap-1 mb-1">
                <Skull size={11} /> Pre-mortem
              </p>
              <p className="text-[12px] text-ink/90 italic leading-relaxed">
                {meta.premortem}
              </p>
            </div>
          )}

          {/* Respuestas del flujo "exploring" */}
          {meta.kind === "exploring" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {meta.energy_gives && <SmallNote label="Te llena" text={meta.energy_gives} />}
              {meta.energy_drains && <SmallNote label="Te apaga" text={meta.energy_drains} />}
              {meta.free_8h && <SmallNote label="Sin pago harías" text={meta.free_8h} />}
              {meta.called_to_help && <SmallNote label="Te buscan para" text={meta.called_to_help} />}
              {meta.frustrating_problem && (
                <SmallNote label="Te frustra" text={meta.frustrating_problem} />
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function SmallNote({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded border border-line/40 bg-bg/30 p-2">
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="text-ink/90 italic line-clamp-2">{text}</p>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22774E";
  if (score >= 60) return "#65A30D";
  if (score >= 40) return "#CA8A04";
  if (score >= 20) return "#EA580C";
  return "#DC2626";
}
