"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Mini-row de chips bajo el hero de un módulo, mostrando "qué
 * encuentras aquí" en una línea: las sub-secciones del módulo.
 *
 * Pensado para el dark hero del módulo — chips translúcidos blancos.
 *
 * Uso:
 *   <ModuleHeroNav
 *     items={[
 *       { href: "/finanzas/cuentas", label: "Cuentas" },
 *       { href: "/finanzas/recurrentes", label: "Recurrentes" },
 *     ]}
 *   />
 */
export function ModuleHeroNav({
  items,
  variant = "dark",
}: {
  items: { href: string; label: string; emoji?: string }[];
  variant?: "dark" | "light";
}) {
  const baseClass =
    variant === "dark"
      ? "border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
      : "border-line bg-bg-alt/40 hover:bg-bg-alt text-muted hover:text-ink";
  return (
    <nav
      aria-label="Sub-secciones del módulo"
      className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <span
        className={
          variant === "dark"
            ? "font-mono text-[9px] uppercase tracking-widest text-white/50 shrink-0 pr-1"
            : "font-mono text-[9px] uppercase tracking-widest text-muted/70 shrink-0 pr-1"
        }
      >
        Aquí encuentras
      </span>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`shrink-0 inline-flex items-center gap-1 h-7 px-3 rounded-full border transition-colors font-body text-xs ${baseClass}`}
        >
          {it.emoji && <span>{it.emoji}</span>}
          {it.label}
          <ArrowRight size={10} className="opacity-70" />
        </Link>
      ))}
    </nav>
  );
}
