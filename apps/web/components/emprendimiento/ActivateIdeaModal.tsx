"use client";
import { useState } from "react";
import {
  Loader2,
  X,
  Sparkles,
  Briefcase,
  ArrowRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  useUpsertBusinessProfile,
  useCreateBusinessTask,
  useUpdateIdea,
} from "../../hooks/useBusiness";
import type { BusinessIdea } from "@estoicismo/supabase";

/**
 * "Activar idea" — convierte una BusinessIdea en el perfil de negocio
 * activo + crea 5 tareas iniciales clásicas. La idea queda marcada
 * como inactiva (no la borra — la guarda en histórico vía soft-mark).
 *
 * Confirmación explícita: si el user ya tiene un negocio activo, le
 * advierte que esto sobrescribe nombre + descripción.
 */

const STARTER_TASKS: { title: string; description?: string; priority?: "low" | "medium" | "high" }[] = [
  {
    title: "Define tu primer producto o servicio",
    description: "Una sola cosa, lo más concreta posible.",
    priority: "high",
  },
  {
    title: "Identifica tu primer cliente potencial",
    description: "Una persona real que tú conozcas y que tendría sentido le ayudaras.",
    priority: "high",
  },
  {
    title: "Pon un precio honesto",
    description: "Suma costos + tu hora. No bajes el precio por miedo.",
    priority: "medium",
  },
  {
    title: "Lanza una versión MVP en 7 días",
    description: "Imperfecta y real > perfecta y mañana.",
    priority: "medium",
  },
  {
    title: "Cobra por primera vez",
    description: "Hasta que alguien pague, sigue siendo afición.",
    priority: "high",
  },
];

export function ActivateIdeaModal({
  idea,
  hasExistingBusiness,
  onClose,
}: {
  idea: BusinessIdea;
  hasExistingBusiness: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(idea.title);
  const [description, setDescription] = useState(idea.description ?? "");
  const [category, setCategory] = useState(idea.category ?? "");
  const upsertProfile = useUpsertBusinessProfile();
  const createTask = useCreateBusinessTask();
  const updateIdea = useUpdateIdea();

  const saving =
    upsertProfile.isPending ||
    createTask.isPending ||
    updateIdea.isPending;

  async function activate() {
    if (!name.trim()) {
      toast.error("Ponle nombre a tu negocio");
      return;
    }

    try {
      // 1. Upsert profile
      await upsertProfile.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        status: "starting",
        started_on: new Date().toISOString().slice(0, 10),
      });

      // 2. Crear tareas iniciales en serie (no Promise.all — quiero
      // que aparezcan en el orden definido por created_at)
      for (let i = 0; i < STARTER_TASKS.length; i++) {
        const t = STARTER_TASKS[i];
        await createTask.mutateAsync({
          title: t.title,
          description: t.description ?? null,
          priority: t.priority ?? "medium",
        });
      }

      // 3. Marcar la idea con un flag (no borrar — historial)
      // Como no hay flag "activated", la archivamos en is_favorite=false
      // y prefijamos el título con ✓
      await updateIdea.mutateAsync({
        id: idea.id,
        input: {
          title: idea.title.startsWith("✓ ")
            ? idea.title
            : `✓ ${idea.title}`,
          is_favorite: false,
        },
      });

      toast.success("Negocio activado", {
        description: `${name} · 5 tareas iniciales creadas.`,
      });
      onClose();
    } catch (err) {
      toast.error("No se pudo activar", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-bg rounded-card border border-line shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-line">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
              Activar idea
            </p>
            <h3 className="font-display italic text-xl text-ink">
              Convertir en tu negocio
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {hasExistingBusiness && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent inline-flex items-center gap-1 mb-1">
                <Sparkles size={11} /> Heads up
              </p>
              <p className="font-body text-xs text-ink leading-relaxed">
                Ya tienes un negocio configurado. Esto sobreescribe nombre,
                descripción y status — pero NO borra ventas, productos ni
                clientes existentes.
              </p>
            </div>
          )}

          {/* Profile fields */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Nombre del negocio
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-display italic text-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Descripción (opcional)
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              Categoría
            </p>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={60}
              placeholder="digital, físico, servicios, contenido…"
              className="w-full rounded-lg border border-line bg-bg-alt px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Preview tasks */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2 inline-flex items-center gap-1">
              <Briefcase size={11} /> 5 tareas que vamos a crear
            </p>
            <ul className="space-y-1.5">
              {STARTER_TASKS.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs"
                >
                  <span className="h-5 w-5 rounded-full bg-accent/15 text-accent flex items-center justify-center font-mono text-[10px] tabular-nums shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-body text-ink">{t.title}</p>
                    {t.description && (
                      <p className="font-body text-muted text-[11px] mt-0.5">
                        {t.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
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
            disabled={saving || !name.trim()}
            onClick={activate}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-accent text-bg font-body text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {saving ? "Activando…" : "Activar negocio"}
            {!saving && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
