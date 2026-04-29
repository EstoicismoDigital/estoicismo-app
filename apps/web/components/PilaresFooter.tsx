"use client";
import Link from "next/link";

type PilarKey = "hoy" | "habitos" | "finanzas" | "emprendimiento" | "reflexiones";

const ALL_PILARES: { key: PilarKey; href: string; label: string; desc: string }[] = [
  { key: "hoy", href: "/", label: "Hoy", desc: "Ritual diario" },
  { key: "habitos", href: "/habitos", label: "Hábitos", desc: "Epicteto" },
  { key: "finanzas", href: "/finanzas", label: "Finanzas", desc: "Marco Aurelio" },
  { key: "emprendimiento", href: "/emprendimiento", label: "Emprendimiento", desc: "Séneca" },
  { key: "reflexiones", href: "/reflexiones", label: "Mentalidad", desc: "Porcia Catón" },
];

/**
 * PilaresFooter · al final de cada página de pilar muestra los OTROS
 * pilares para reducir fricción de navegación. El pilar actual se
 * filtra automáticamente.
 */
export function PilaresFooter({ current }: { current: PilarKey }) {
  const items = ALL_PILARES.filter((p) => p.key !== current);

  return (
    <section className="mt-16 pt-12 border-t border-line">
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
