"use client";
import { Star, StarOff, Trash2 } from "lucide-react";
import type { BusinessIdea } from "@estoicismo/supabase";

export function IdeasList(props: {
  ideas: BusinessIdea[];
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { ideas, onToggleFavorite, onDelete } = props;
  if (ideas.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="font-display italic text-lg text-ink">Tus ideas guardadas</h3>
      <ul className="space-y-2">
        {ideas.map((i) => (
          <li
            key={i.id}
            className="rounded-card border border-line bg-bg-alt/30 p-3 flex items-start gap-2"
          >
            <button
              type="button"
              onClick={() => onToggleFavorite(i.id, i.is_favorite)}
              className={
                i.is_favorite
                  ? "text-accent hover:opacity-80"
                  : "text-muted hover:text-accent"
              }
              aria-label="Favorito"
            >
              {i.is_favorite ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{i.title}</p>
              {i.description && (
                <p className="text-[11px] text-muted line-clamp-2">{i.description}</p>
              )}
              <div className="flex gap-2 mt-1 text-[10px] text-muted">
                {i.category && <span>· {i.category}</span>}
                {i.excitement !== null && <span>· {i.excitement}/5 emoción</span>}
                {i.feasibility !== null && <span>· {i.feasibility}/5 factibilidad</span>}
                {i.startup_cost_text && <span>· {i.startup_cost_text}</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDelete(i.id)}
              className="text-muted hover:text-danger p-1"
              aria-label="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
