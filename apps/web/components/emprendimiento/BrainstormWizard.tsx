"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Lightbulb, Compass, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import type { CreateIdeaInput } from "@estoicismo/supabase";

// Lazy-load de los flujos pesados — sólo cargan cuando el user
// elige el camino. Reduce ~10KB del bundle inicial.
const IdeaValidator = dynamic(
  () => import("./IdeaValidator").then((m) => m.IdeaValidator),
  { ssr: false }
);
const ExploreFlow = dynamic(
  () => import("./ExploreFlow").then((m) => m.ExploreFlow),
  { ssr: false }
);

/**
 * Brainstorm Wizard — punto de entrada que ramifica:
 *
 *   "Ya tengo una idea" → IdeaValidator
 *     · 5 pasos: idea + 5 whys + ikigai + premortem + resultado
 *     · Apoya y profundiza lo que ya está en tu cabeza
 *
 *   "Estoy explorando" → ExploreFlow
 *     · 5 preguntas profundas (no chips fríos): energía, sin pago,
 *       quién te busca, qué problema te frustra, tags
 *     · 6 ideas matchadas + tu pliego de respuestas guardado
 */
export function BrainstormWizard(props: {
  /** Compatibilidad con la API previa — sigue funcionando. */
  onSaveIdea?: (idea: { title: string; description: string; category: string }) => void;
  onSaveIdeaFull?: (input: CreateIdeaInput) => Promise<void> | void;
}) {
  const [path, setPath] = useState<"choose" | "have-idea" | "exploring">("choose");

  // Adapter — el componente padre puede haber pasado el onSaveIdea
  // viejo o el nuevo. Normalizamos.
  async function save(input: CreateIdeaInput) {
    if (props.onSaveIdeaFull) {
      await props.onSaveIdeaFull(input);
    } else if (props.onSaveIdea) {
      props.onSaveIdea({
        title: input.title,
        description: input.description ?? "",
        category: input.category ?? "free",
      });
    }
  }

  if (path === "have-idea") {
    return (
      <IdeaValidator
        onSave={async (input) => {
          await save(input);
          setPath("choose");
        }}
        onCancel={() => setPath("choose")}
      />
    );
  }
  if (path === "exploring") {
    return (
      <ExploreFlow
        onSaveIdea={async (input) => {
          await save(input);
          setPath("choose");
        }}
        onCancel={() => setPath("choose")}
      />
    );
  }

  // Pantalla de selección de camino. Cards grandes, no chips.
  return (
    <section className="space-y-4">
      <div className="text-center space-y-1.5 py-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent inline-flex items-center gap-1.5">
          <Sparkles size={11} />
          Brainstorm
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          ¿Por dónde empezamos?
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PathCard
          icon={<Lightbulb size={28} className="text-accent" />}
          eyebrow="Ya tengo algo en mente"
          title="Vamos a validarla."
          description="5 pasos profundos: tu porqué real, ikigai, riesgos. Salida con un mapa claro de tu idea."
          steps={[
            "Tu idea en una frase",
            "5 porqués — bajar al hueso",
            "Ikigai — los 4 ejes",
            "Pre-mortem — qué la mataría",
            "Tu mapa, listo para actuar",
          ]}
          onClick={() => setPath("have-idea")}
        />
        <PathCard
          icon={<Compass size={28} className="text-accent" />}
          eyebrow="Estoy explorando"
          title="Te ayudo a verla."
          description="5 preguntas que abren la puerta: dónde está tu energía, qué te buscan, qué te frustra. Salida con ideas matchadas."
          steps={[
            "¿Qué te llena? ¿Qué te apaga?",
            "8 horas libres y sin pago",
            "En qué te buscan tus cercanos",
            "El problema que te incomoda",
            "Tu pliego + ideas curadas",
          ]}
          onClick={() => setPath("exploring")}
        />
      </div>
    </section>
  );
}

function PathCard(props: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  steps: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={clsx(
        "group text-left rounded-card border-2 border-line bg-bg-alt/40 p-5 sm:p-6",
        "hover:border-accent/60 hover:bg-accent/5 transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      )}
    >
      <div className="space-y-3">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          {props.icon}
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {props.eyebrow}
          </p>
          <h3 className="font-display italic text-2xl text-ink leading-tight mt-1">
            {props.title}
          </h3>
        </div>
        <p className="text-[13px] text-muted leading-relaxed">{props.description}</p>
        <ul className="text-[11px] space-y-1 pt-2 border-t border-line/40">
          {props.steps.map((s, i) => (
            <li key={i} className="text-muted/90 flex items-baseline gap-1.5">
              <span className="font-mono text-accent">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}
