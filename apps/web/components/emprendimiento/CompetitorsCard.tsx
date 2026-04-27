"use client";
import { useState } from "react";
import {
  Eye,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import {
  useCompetitors,
  useCreateCompetitor,
  useUpdateCompetitor,
  useDeleteCompetitor,
} from "../../hooks/useBusiness";
import type { BusinessCompetitor } from "@estoicismo/supabase";

/**
 * Competitor tracker (#98) · lista simple sin pretender ser CRM.
 *
 * Cada competidor: nombre, web, fortalezas, debilidades, notas.
 * El user los expande para ver detalle.
 */
export function CompetitorsCard() {
  const { data: competitors = [] } = useCompetitors();
  const create = useCreateCompetitor();
  const del = useDeleteCompetitor();
  const [adding, setAdding] = useState(false);

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Eye size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Competencia · {competitors.length}
        </p>
        <span className="h-px flex-1 bg-line min-w-4" />
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
        <CompetitorForm
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}

      {competitors.length === 0 && !adding && (
        <p className="font-body text-sm text-muted leading-relaxed py-3">
          Vigila a los que ya van adelante. No para imitarlos — para
          aprender qué funciona y qué no.
        </p>
      )}

      <ul className="space-y-2 mt-2">
        {competitors.map((c) => (
          <CompetitorRow
            key={c.id}
            competitor={c}
            onDelete={() => {
              if (confirm(`¿Eliminar "${c.name}"?`)) del.mutate(c.id);
            }}
          />
        ))}
      </ul>
    </section>
  );
}

function CompetitorForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const create = useCreateCompetitor();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");

  async function save() {
    if (!name.trim()) return;
    await create.mutateAsync({
      name: name.trim(),
      website: website.trim() || null,
      strengths: strengths.trim() || null,
      weaknesses: weaknesses.trim() || null,
    });
    onSaved();
  }

  return (
    <div className="rounded-lg border border-line bg-bg p-3 mb-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          maxLength={100}
          className="rounded-md border border-line bg-bg-alt px-3 py-1.5 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Sitio web"
          maxLength={200}
          className="rounded-md border border-line bg-bg-alt px-3 py-1.5 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <textarea
        value={strengths}
        onChange={(e) => setStrengths(e.target.value)}
        rows={2}
        placeholder="Lo que hacen bien (fortalezas)"
        maxLength={500}
        className="w-full rounded-md border border-line bg-bg-alt px-3 py-1.5 font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
      <textarea
        value={weaknesses}
        onChange={(e) => setWeaknesses(e.target.value)}
        rows={2}
        placeholder="Lo que puedo aprovechar (debilidades)"
        maxLength={500}
        className="w-full rounded-md border border-line bg-bg-alt px-3 py-1.5 font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="h-7 px-3 rounded-full text-muted hover:text-ink hover:bg-bg-alt font-mono text-[10px] uppercase tracking-widest inline-flex items-center gap-1"
        >
          <X size={10} /> Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!name.trim() || create.isPending}
          className="h-7 px-3 rounded-full bg-accent text-bg font-mono text-[10px] uppercase tracking-widest font-medium disabled:opacity-40 inline-flex items-center gap-1"
        >
          <Check size={10} /> Guardar
        </button>
      </div>
    </div>
  );
}

function CompetitorRow({
  competitor,
  onDelete,
}: {
  competitor: BusinessCompetitor;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail =
    competitor.strengths || competitor.weaknesses || competitor.notes;

  return (
    <li className="rounded-lg border border-line bg-bg group">
      <div className="p-3 flex items-center gap-2">
        <Eye size={14} className="text-muted shrink-0" />
        <p className="font-body text-sm text-ink flex-1 truncate">
          {competitor.name}
        </p>
        {competitor.website && (
          <a
            href={
              competitor.website.startsWith("http")
                ? competitor.website
                : `https://${competitor.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="h-6 w-6 rounded-full text-muted hover:text-accent flex items-center justify-center"
            title={competitor.website}
            aria-label="Abrir sitio web"
          >
            <ExternalLink size={11} />
          </a>
        )}
        {hasDetail && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="h-6 w-6 rounded-full text-muted hover:text-ink flex items-center justify-center"
            aria-label={expanded ? "Ocultar" : "Ver detalle"}
          >
            {expanded ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="h-6 w-6 rounded-full text-muted hover:text-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Eliminar"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {expanded && hasDetail && (
        <div className="border-t border-line/60 p-3 space-y-2">
          {competitor.strengths && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-success mb-0.5">
                Hacen bien
              </p>
              <p className="font-body text-xs text-ink leading-relaxed">
                {competitor.strengths}
              </p>
            </div>
          )}
          {competitor.weaknesses && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-accent mb-0.5">
                Aprovecho
              </p>
              <p className="font-body text-xs text-ink leading-relaxed">
                {competitor.weaknesses}
              </p>
            </div>
          )}
          {competitor.notes && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-0.5">
                Notas
              </p>
              <p className="font-body text-xs text-muted leading-relaxed">
                {competitor.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
