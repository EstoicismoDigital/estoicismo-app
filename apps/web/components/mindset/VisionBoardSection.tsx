"use client";
import { useState } from "react";
import {
  ImagePlus,
  Trophy,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import {
  useVisionItems,
  useCreateVisionItem,
  useUpdateVisionItem,
  useDeleteVisionItem,
} from "../../hooks/useMindset";
import type {
  MindsetVisionItem,
  VisionItemKind,
} from "@estoicismo/supabase";

/**
 * Vision Board · "manifesta-lo-que-quieres".
 *
 * Grid de items que el usuario añade: imagen, texto o cita.
 * Cada item tiene categoría (fitness/financial/love/carrera/viaje/otra),
 * peso 1-5 (qué tan urgente lo siente hoy), y estado achieved.
 *
 * UX:
 *  - Grid responsive 2/3/4 cols.
 *  - Click en item abre acciones (lograr / editar / borrar).
 *  - Botón "+" abre modal con tabs (image url / texto / cita).
 *  - Filtro: "todos" / "pendientes" / "logrados".
 */

const CATEGORIES = [
  { key: "fitness", label: "Fitness", emoji: "💪" },
  { key: "financial", label: "Financiero", emoji: "💰" },
  { key: "career", label: "Carrera", emoji: "🎯" },
  { key: "love", label: "Amor", emoji: "❤️" },
  { key: "travel", label: "Viaje", emoji: "✈️" },
  { key: "growth", label: "Crecimiento", emoji: "🌱" },
  { key: "family", label: "Familia", emoji: "👨‍👩‍👧" },
  { key: "other", label: "Otro", emoji: "✨" },
];

type Filter = "all" | "pending" | "achieved";

export function VisionBoardSection() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<MindsetVisionItem | null>(null);

  const { data: items = [] } = useVisionItems({});
  const del = useDeleteVisionItem();
  const upd = useUpdateVisionItem();

  const visible = items.filter((it) => {
    if (filter === "pending") return !it.achieved;
    if (filter === "achieved") return it.achieved;
    return true;
  });

  return (
    <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Sparkles size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Vision board
        </p>
        <span className="h-px flex-1 bg-line min-w-4" />
        <div className="inline-flex rounded-full border border-line bg-bg p-0.5">
          {(["pending", "achieved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "h-7 px-3 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors",
                filter === f ? "bg-accent text-bg" : "text-muted hover:text-ink"
              )}
            >
              {f === "pending"
                ? "pendientes"
                : f === "achieved"
                  ? "logrados"
                  : "todos"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-accent text-bg font-body text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={12} /> Añadir
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="py-10 text-center">
          <ImagePlus size={28} className="mx-auto text-muted/50 mb-3" />
          <p className="font-body text-sm text-muted">
            {filter === "achieved"
              ? "Aún no has marcado ningún sueño como logrado."
              : "Empieza tu vision board: añade tu primer sueño."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {visible.map((it) => (
            <VisionItemCard
              key={it.id}
              item={it}
              onAchieve={() =>
                upd.mutate({ id: it.id, input: { achieved: !it.achieved } })
              }
              onEdit={() => setEditing(it)}
              onDelete={() => {
                if (confirm("¿Borrar este item?")) del.mutate(it.id);
              }}
            />
          ))}
        </div>
      )}

      {(adding || editing) && (
        <VisionItemModal
          initial={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Item card
// ─────────────────────────────────────────────────────────────

function VisionItemCard({
  item,
  onAchieve,
  onEdit,
  onDelete,
}: {
  item: MindsetVisionItem;
  onAchieve: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.key === item.category);
  return (
    <div
      className={clsx(
        "group relative rounded-lg border bg-bg overflow-hidden transition-all",
        item.achieved ? "border-success/40 opacity-70" : "border-line"
      )}
    >
      {/* Image */}
      {item.kind === "image" && item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.caption ?? "Vision item"}
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div
          className={clsx(
            "w-full aspect-square flex items-center justify-center p-3",
            item.kind === "quote"
              ? "bg-bg-deep text-white"
              : "bg-bg-alt text-ink"
          )}
        >
          <p
            className={clsx(
              "text-center leading-snug",
              item.kind === "quote"
                ? "font-display italic text-sm"
                : "font-body text-sm"
            )}
          >
            {item.caption || "—"}
          </p>
        </div>
      )}

      {/* Caption + category */}
      {item.kind === "image" && item.caption && (
        <div className="p-2 border-t border-line">
          <p className="font-body text-xs text-ink line-clamp-2">
            {item.caption}
          </p>
        </div>
      )}

      {/* Top-left: category */}
      {cat && (
        <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-black/60 backdrop-blur-sm text-white">
          <span className="text-[11px] leading-none">{cat.emoji}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest">
            {cat.label}
          </span>
        </div>
      )}

      {/* Top-right: weight dots */}
      {item.weight && (
        <div className="absolute top-1.5 right-1.5 inline-flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={clsx(
                "w-1 h-1 rounded-full",
                i < (item.weight ?? 0) ? "bg-accent" : "bg-white/30"
              )}
            />
          ))}
        </div>
      )}

      {/* Achieved badge */}
      {item.achieved && (
        <div className="absolute inset-x-0 top-0 bg-success/90 text-white text-center py-0.5">
          <span className="font-mono text-[9px] uppercase tracking-widest inline-flex items-center gap-1 justify-center">
            <Trophy size={9} /> Logrado
          </span>
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-end gap-1 p-1.5 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={onAchieve}
          title={item.achieved ? "Desmarcar logrado" : "Marcar logrado"}
          className="h-7 w-7 rounded-full bg-success text-white flex items-center justify-center hover:opacity-90"
        >
          <Trophy size={12} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          title="Editar"
          className="h-7 w-7 rounded-full bg-white text-ink flex items-center justify-center hover:opacity-90"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Borrar"
          className="h-7 w-7 rounded-full bg-danger text-white flex items-center justify-center hover:opacity-90"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal: create/edit
// ─────────────────────────────────────────────────────────────

function VisionItemModal({
  initial,
  onClose,
}: {
  initial: MindsetVisionItem | null;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<VisionItemKind>(
    (initial?.kind as VisionItemKind) ?? "image"
  );
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [weight, setWeight] = useState<number | null>(initial?.weight ?? null);

  const create = useCreateVisionItem();
  const update = useUpdateVisionItem();
  const saving = create.isPending || update.isPending;

  async function save() {
    const payload = {
      kind,
      image_url: kind === "image" ? imageUrl.trim() || null : null,
      caption: caption.trim() || null,
      category: category || null,
      weight,
    };
    if (initial) {
      await update.mutateAsync({ id: initial.id, input: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  }

  const canSave =
    !saving &&
    ((kind === "image" && imageUrl.trim().length > 0) ||
      (kind !== "image" && caption.trim().length > 0));

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
            {initial ? "Editar item" : "Añadir al vision board"}
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Kind */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Tipo
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["image", "text", "quote"] as VisionItemKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={clsx(
                    "h-10 rounded-lg border font-body text-sm capitalize",
                    kind === k
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line bg-bg text-muted hover:text-ink"
                  )}
                >
                  {k === "image" ? "Imagen" : k === "text" ? "Texto" : "Cita"}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL */}
          {kind === "image" && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                URL de imagen
              </p>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {imageUrl.trim() && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="mt-3 w-full max-h-48 object-cover rounded-lg border border-line"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
          )}

          {/* Caption / text */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              {kind === "image"
                ? "Descripción (opcional)"
                : kind === "quote"
                  ? "Cita"
                  : "Texto"}
            </p>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={kind === "image" ? 2 : 4}
              maxLength={500}
              placeholder={
                kind === "quote"
                  ? "El presente sólo necesita ser presente. — Marco Aurelio"
                  : kind === "text"
                    ? "Una idea, un sueño, un recordatorio…"
                    : "Mi futuro yo…"
              }
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Categoría
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() =>
                    setCategory(category === c.key ? "" : c.key)
                  }
                  className={clsx(
                    "px-3 h-8 rounded-full border font-body text-xs inline-flex items-center gap-1",
                    category === c.key
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line bg-bg text-muted hover:text-ink"
                  )}
                >
                  <span>{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              ¿Qué tan urgente lo sientes? (opcional)
            </p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setWeight(weight === n ? null : n)}
                  className={clsx(
                    "h-9 flex-1 rounded-lg border font-mono text-[11px] transition-all",
                    weight !== null && n <= weight
                      ? "border-accent bg-accent text-bg"
                      : "border-line bg-bg text-muted hover:border-line-strong"
                  )}
                >
                  {n}
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
            {initial ? "Guardar" : "Añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}
