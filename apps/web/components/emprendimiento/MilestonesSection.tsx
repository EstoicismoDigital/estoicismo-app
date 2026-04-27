"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Trophy,
  Plus,
  X,
  Loader2,
  Check,
  Trash2,
  Pencil,
  Flag,
} from "lucide-react";
import { clsx } from "clsx";
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useBusinessSales,
  useClients,
} from "../../hooks/useBusiness";
import {
  computeMilestoneProgress,
  milestoneKindLabel,
  milestoneKindIcon,
} from "../../lib/business/milestone-progress";
import type {
  BusinessMilestone,
  BusinessMilestoneKind,
} from "@estoicismo/supabase";

/**
 * Hitos del negocio. Vista "open milestones" arriba con barras de
 * progreso, "achieved" abajo en versión compacta.
 *
 * UX:
 *  - Auto-suggest cuando el progreso llega a 100% — toast + permite
 *    marcar achieved con un click. No auto-cierra el hito sin consentir.
 *  - Crear con templates ("primera venta", "$10k MXN", "10 clientes")
 *    o custom.
 */

type Tab = "open" | "achieved";

export function MilestonesSection() {
  const [tab, setTab] = useState<Tab>("open");
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<BusinessMilestone | null>(null);

  const { data: milestones = [] } = useMilestones();
  const { data: sales = [] } = useBusinessSales({ limit: 1000 });
  const { data: clients = [] } = useClients();
  const update = useUpdateMilestone();
  const del = useDeleteMilestone();

  const open = useMemo(
    () => milestones.filter((m) => m.status === "open"),
    [milestones]
  );
  const achieved = useMemo(
    () => milestones.filter((m) => m.status === "achieved"),
    [milestones]
  );

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Trophy size={14} className="text-accent" />
        <h3 className="font-display italic text-lg text-ink">
          Hitos del negocio
        </h3>
        <span className="h-px flex-1 bg-line min-w-4" />
        <div className="inline-flex rounded-full border border-line bg-bg p-0.5">
          {(["open", "achieved"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "h-7 px-3 rounded-full font-mono text-[10px] uppercase tracking-widest",
                tab === t ? "bg-accent text-bg" : "text-muted hover:text-ink"
              )}
            >
              {t === "open"
                ? `Abiertos (${open.length})`
                : `Logrados (${achieved.length})`}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-accent text-bg font-body text-xs font-medium hover:opacity-90"
        >
          <Plus size={12} /> Hito
        </button>
      </div>

      {tab === "open" ? (
        open.length === 0 ? (
          <EmptyState onAdd={() => setComposing(true)} />
        ) : (
          <ul className="space-y-2.5">
            {open.map((m) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                progress={computeMilestoneProgress(m, sales, clients)}
                onAchieve={() =>
                  update.mutate({ id: m.id, input: { status: "achieved" } })
                }
                onEdit={() => setEditing(m)}
                onDelete={() => {
                  if (confirm("¿Borrar hito?")) del.mutate(m.id);
                }}
                onAbandon={() =>
                  update.mutate({ id: m.id, input: { status: "abandoned" } })
                }
              />
            ))}
          </ul>
        )
      ) : achieved.length === 0 ? (
        <p className="font-body text-sm text-muted text-center py-6">
          Aún no has marcado ningún hito como logrado.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {achieved.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2"
            >
              <span className="text-base">{milestoneKindIcon(m.kind)}</span>
              <p className="font-body text-sm text-ink flex-1 truncate">
                {m.title}
              </p>
              <span className="font-mono text-[9px] uppercase tracking-widest text-success">
                {formatDate(m.achieved_at)}
              </span>
              <button
                type="button"
                onClick={() =>
                  update.mutate({ id: m.id, input: { status: "open" } })
                }
                className="font-mono text-[9px] uppercase tracking-widest text-muted hover:text-ink px-2"
                title="Reabrir"
              >
                Reabrir
              </button>
            </li>
          ))}
        </ul>
      )}

      {(composing || editing) && (
        <MilestoneModal
          initial={editing}
          onClose={() => {
            setComposing(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-6">
      <Flag size={28} className="mx-auto text-muted/50 mb-2" />
      <p className="font-body text-sm text-muted max-w-xs mx-auto leading-relaxed mb-3">
        Define hitos para tu negocio: primera venta, primer $10k,
        primeros 10 clientes…
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 h-9 px-4 rounded-full bg-accent text-bg font-body text-xs font-medium"
      >
        <Plus size={12} /> Crear primer hito
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Row con barra de progreso
// ─────────────────────────────────────────────────────────────

function MilestoneRow({
  milestone,
  progress,
  onAchieve,
  onEdit,
  onDelete,
  onAbandon,
}: {
  milestone: BusinessMilestone;
  progress: { current: number; ratio: number | null } | null;
  onAchieve: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAbandon: () => void;
}) {
  const ratio = progress?.ratio ?? null;
  const pct = ratio === null ? null : Math.round(ratio * 100);
  const reached = ratio !== null && ratio >= 1;

  return (
    <li
      className={clsx(
        "rounded-lg border p-3 group transition-colors",
        reached
          ? "border-success/40 bg-success/5"
          : "border-line bg-bg hover:border-line-strong"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{milestoneKindIcon(milestone.kind)}</span>
        <p className="font-body text-sm font-medium text-ink flex-1 truncate">
          {milestone.title}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
          {milestoneKindLabel(milestone.kind)}
        </p>
      </div>

      {milestone.description && (
        <p className="font-body text-xs text-muted mb-2 line-clamp-2">
          {milestone.description}
        </p>
      )}

      {progress && progress.ratio !== null ? (
        <>
          <div className="h-1.5 bg-bg-alt rounded-full overflow-hidden">
            <div
              className={clsx(
                "h-full transition-all",
                reached ? "bg-success" : "bg-accent"
              )}
              style={{ width: `${Math.min(100, pct ?? 0)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {formatProgress(milestone, progress.current)}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {pct}%
            </p>
          </div>
        </>
      ) : milestone.target_date ? (
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Meta · {formatDate(milestone.target_date)}
        </p>
      ) : null}

      <div className="mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onAchieve}
          className={clsx(
            "inline-flex items-center gap-1 h-7 px-2.5 rounded-full font-mono text-[10px] uppercase tracking-widest",
            reached
              ? "bg-success text-white"
              : "bg-bg-alt text-muted hover:text-ink"
          )}
        >
          <Trophy size={10} /> Lograr
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink hover:bg-bg-alt"
        >
          <Pencil size={10} /> Editar
        </button>
        <button
          type="button"
          onClick={onAbandon}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink hover:bg-bg-alt"
        >
          Pausar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto inline-flex items-center gap-1 h-7 px-2.5 rounded-full font-mono text-[10px] uppercase tracking-widest text-muted hover:text-danger hover:bg-bg-alt"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal create / edit
// ─────────────────────────────────────────────────────────────

const TEMPLATES: {
  label: string;
  kind: BusinessMilestoneKind;
  title: string;
  target?: number;
  description?: string;
}[] = [
  {
    label: "Primera venta",
    kind: "sales_count",
    title: "Mi primera venta",
    target: 1,
  },
  {
    label: "$10k en ventas",
    kind: "sales_total",
    title: "Acumular $10,000 en ventas",
    target: 10000,
  },
  {
    label: "10 clientes",
    kind: "clients_count",
    title: "Llegar a 10 clientes",
    target: 10,
  },
  {
    label: "Lanzar producto",
    kind: "product_launch",
    title: "Lanzar mi primer producto",
  },
];

function MilestoneModal({
  initial,
  onClose,
}: {
  initial: BusinessMilestone | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [kind, setKind] = useState<BusinessMilestoneKind>(
    initial?.kind ?? "custom"
  );
  const [target, setTarget] = useState<string>(
    initial?.target_amount?.toString() ?? ""
  );
  const [targetDate, setTargetDate] = useState(initial?.target_date ?? "");

  const create = useCreateMilestone();
  const update = useUpdateMilestone();
  const saving = create.isPending || update.isPending;

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setTitle(t.title);
    setKind(t.kind);
    if (t.target) setTarget(String(t.target));
    if (t.description) setDescription(t.description);
  }

  // Auto-clear target when kind doesn't use it
  useEffect(() => {
    if (kind === "product_launch" || kind === "custom") setTarget("");
  }, [kind]);

  const needsTarget = kind === "sales_total" || kind === "sales_count" || kind === "clients_count";
  const canSave =
    !saving && title.trim().length > 0 && (!needsTarget || Number(target) > 0);

  async function save() {
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      kind,
      target_amount: needsTarget && target ? Number(target) : null,
      target_date: targetDate || null,
    };
    if (initial) {
      await update.mutateAsync({ id: initial.id, input: payload });
    } else {
      await create.mutateAsync(payload);
    }
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
            {initial ? "Editar hito" : "Nuevo hito"}
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!initial && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                Plantillas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="h-8 px-3 rounded-full border border-line bg-bg-alt text-muted hover:text-ink hover:border-line-strong font-body text-xs"
                  >
                    {milestoneKindIcon(t.kind)} {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Título
            </p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Mi primera venta…"
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Tipo
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  "sales_total",
                  "sales_count",
                  "clients_count",
                  "product_launch",
                  "custom",
                ] as BusinessMilestoneKind[]
              ).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={clsx(
                    "h-10 rounded-lg border font-body text-xs inline-flex items-center justify-center gap-1.5",
                    kind === k
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line bg-bg text-muted hover:text-ink"
                  )}
                >
                  <span>{milestoneKindIcon(k)}</span>
                  <span className="truncate">{milestoneKindLabel(k)}</span>
                </button>
              ))}
            </div>
          </div>

          {needsTarget && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                {kind === "sales_total" ? "Monto objetivo" : "Cantidad objetivo"}
              </p>
              <input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={kind === "sales_total" ? "10000" : "10"}
                className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Descripción (opcional)
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Fecha objetivo (opcional)
            </p>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
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
            {saving && <Loader2 size={14} className="animate-spin" />}
            <Check size={14} />
            {initial ? "Guardar" : "Crear hito"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatProgress(m: BusinessMilestone, current: number): string {
  const target = m.target_amount ?? 0;
  if (m.kind === "sales_total") {
    const fmt = (n: number) =>
      n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
    return `${fmt(current)} / ${fmt(Number(target))}`;
  }
  return `${current} / ${target}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
