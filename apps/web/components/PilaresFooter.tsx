"use client";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  getPromptByPillar,
  currentMoment,
  type StoicPillar,
} from "../lib/journal/prompts";

type PilarKey = "hoy" | "habitos" | "finanzas" | "emprendimiento" | "reflexiones";

const ALL_PILARES: {
  key: PilarKey;
  href: string;
  label: string;
  desc: string;
  /** Pillar key del pool de prompts (solo los 4 estoicos). */
  pillar?: StoicPillar;
}[] = [
  { key: "hoy", href: "/", label: "Hoy", desc: "Ritual diario" },
  { key: "habitos", href: "/habitos", label: "Hábitos", desc: "Epicteto", pillar: "epicteto" },
  { key: "finanzas", href: "/finanzas", label: "Finanzas", desc: "Marco Aurelio", pillar: "marco_aurelio" },
  { key: "emprendimiento", href: "/emprendimiento", label: "Emprendimiento", desc: "Séneca", pillar: "seneca" },
  { key: "reflexiones", href: "/reflexiones", label: "Mentalidad", desc: "Porcia Catón", pillar: "porcia" },
];

/**
 * PilaresFooter · al final de cada página de pilar muestra:
 *   1. Un prompt del día específico al pilar actual (si tiene `pillar`).
 *   2. Links a los otros pilares para reducir fricción de navegación.
 *
 * El prompt se calcula con `getPromptByPillar(pillar, moment)` —
 * determinístico por día, así que misma pregunta cada vez que abres
 * la página el mismo día.
 */
export function PilaresFooter({ current }: { current: PilarKey }) {
  const currentMeta = ALL_PILARES.find((p) => p.key === current);
  const items = ALL_PILARES.filter((p) => p.key !== current);

  // Prompt contextual del pilar actual. Si current="hoy", no hay
  // pillar y simplemente no se renderiza esta sección.
  const prompt = currentMeta?.pillar
    ? getPromptByPillar(currentMeta.pillar, currentMoment())
    : null;

  return (
    <section className="mt-16 pt-12 border-t border-line">
      {prompt && currentMeta && (
        <div className="max-w-2xl mx-auto mb-10 px-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2 inline-flex items-center gap-1">
            <Sparkles size={11} aria-hidden />
            Reflexión del día · {currentMeta.desc}
          </p>
          <p className="font-display italic text-lg sm:text-xl text-ink leading-snug">
            {prompt.text}
          </p>
        </div>
      )}

      <p className="font-mono text-xs uppercase tracking-widest text-muted text-center mb-6">
        Sigue tu camino
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
        {items.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group flex flex-col items-center gap-1 p-4 rounded-lg border border-line bg-bg-alt hover:bg-bg hover:border-accent/40 transition-colors min-h-[88px] justify-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="font-display text-base text-ink group-hover:text-accent transition-colors">
              {p.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {p.desc}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
