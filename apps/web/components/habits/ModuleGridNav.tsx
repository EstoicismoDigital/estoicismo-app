"use client";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import { usePrefetchRoute } from "../../hooks/usePrefetchRoute";

/**
 * URL del bucket público de Supabase Storage donde viven las
 * imágenes de los estoicos. Si tu env tiene NEXT_PUBLIC_SUPABASE_URL
 * la usamos; si no, fallback al monograma.
 */
function stoicImageUrl(slug: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/stoic-portraits/${slug}.jpg`;
}

/**
 * ModuleGridNav · navegación principal visual.
 *
 * 4 cards rectangulares, cada una representando un módulo + el
 * estoico que lo encarna:
 *
 *   Hábitos       · Epicteto (disciplina, lo que depende de ti)
 *   Finanzas      · Marco Aurelio (orden imperial, deber, recursos)
 *   Emprendimiento · Séneca (negocio, riqueza con virtud)
 *   Mentalidad    · Porcia Catón (coraje, fortaleza interior)
 *
 * Las imágenes viven en /public/stoics/. Si una no carga, mostramos
 * un monograma con la letra inicial del filósofo.
 *
 * Diseño: portrait cards (más altas que anchas) con la imagen como
 * focal, color del módulo como tinte, nombre grande abajo. En mobile
 * se vuelve grid 2x2; en desktop, fila de 4.
 */

type ModuleCard = {
  /** Slug interno (matchea data-module). */
  key: "habits" | "finanzas" | "emprendimiento" | "reflexiones";
  href: string;
  label: string;
  /** Filósofo que encarna el módulo. */
  philosopher: string;
  /** Frase corta debajo del nombre. */
  tagline: string;
  /** URL pública en Supabase Storage. null si no está configurada. */
  image: string | null;
  /** Letra para el monograma fallback. */
  initial: string;
  /** Hex color del módulo. */
  color: string;
  /** Color para el gradiente sobre la imagen. */
  gradient: string;
};

const MODULES: ModuleCard[] = [
  {
    key: "habits",
    href: "/habitos",
    label: "Hábitos",
    philosopher: "Epicteto",
    tagline: "Disciplina diaria. Lo que depende de ti.",
    image: stoicImageUrl("epicteto"),
    initial: "E",
    color: "#B48A28",
    gradient: "from-[#B48A28]/10 via-[#B48A28]/5 to-transparent",
  },
  {
    key: "finanzas",
    href: "/finanzas",
    label: "Finanzas",
    philosopher: "Marco Aurelio",
    tagline: "Orden, deber, recursos bien dirigidos.",
    image: stoicImageUrl("marco-aurelio"),
    initial: "M",
    color: "#22774E",
    gradient: "from-[#22774E]/10 via-[#22774E]/5 to-transparent",
  },
  {
    key: "emprendimiento",
    href: "/emprendimiento",
    label: "Emprendimiento",
    philosopher: "Séneca",
    tagline: "Negocio con virtud. Riqueza al servicio.",
    image: stoicImageUrl("seneca"),
    initial: "S",
    color: "#1E58A3",
    gradient: "from-[#1E58A3]/10 via-[#1E58A3]/5 to-transparent",
  },
  {
    key: "reflexiones",
    href: "/reflexiones",
    label: "Mentalidad",
    philosopher: "Porcia Catón",
    tagline: "Coraje, fortaleza interior.",
    image: stoicImageUrl("porcia"),
    initial: "P",
    color: "#B2443A",
    gradient: "from-[#B2443A]/10 via-[#B2443A]/5 to-transparent",
  },
];

export function ModuleGridNav({
  variant = "full",
}: {
  /** "full": cards grandes para /hoy. "compact": cards pequeños inline. */
  variant?: "full" | "compact";
}) {
  const prefetch = usePrefetchRoute();

  return (
    <nav
      aria-label="Navegación principal"
      className={clsx(
        "grid gap-3",
        variant === "full"
          ? "grid-cols-2 lg:grid-cols-4 sm:gap-4"
          : "grid-cols-4 gap-2"
      )}
    >
      {MODULES.map((m) => (
        <ModuleCardItem key={m.key} module={m} variant={variant} onPrefetch={() => prefetch(m.key as never)} />
      ))}
    </nav>
  );
}

function ModuleCardItem({
  module: m,
  variant,
  onPrefetch,
}: {
  module: ModuleCard;
  variant: "full" | "compact";
  onPrefetch: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const isCompact = variant === "compact";

  return (
    <Link
      href={m.href}
      data-module={m.key}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      className={clsx(
        "group relative overflow-hidden rounded-card border border-line bg-bg-alt/30",
        "transition-all duration-200 focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        "focus-visible:ring-offset-bg",
        "hover:shadow-lg hover:-translate-y-0.5",
        isCompact ? "aspect-[3/4]" : "aspect-[3/4] sm:aspect-[4/5]"
      )}
      style={
        {
          // Tinte color del módulo en hover
          "--mod-color": m.color,
        } as React.CSSProperties
      }
    >
      {/* Imagen del estoico */}
      <div className="absolute inset-0">
        {m.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.image}
            alt={m.philosopher}
            className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0"
            onError={() => setImgError(true)}
          />
        ) : (
          <MonogramFallback initial={m.initial} color={m.color} />
        )}
      </div>

      {/* Gradient overlay (oscurece la parte baja para legibilidad del label) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
      />

      {/* Tinte de color sutil */}
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-multiply opacity-0 group-hover:opacity-30 transition-opacity duration-300"
        style={{ background: m.color }}
      />

      {/* Top accent bar */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-1 transition-all"
        style={{ background: m.color }}
      />

      {/* Label inferior */}
      <div className={clsx("absolute left-0 right-0 bottom-0 px-3", isCompact ? "py-2" : "py-3 sm:py-4")}>
        <p
          className={clsx(
            "font-mono uppercase tracking-widest opacity-80",
            isCompact ? "text-[8px]" : "text-[9px] sm:text-[10px]"
          )}
          style={{ color: m.color }}
        >
          {m.philosopher}
        </p>
        <h2
          className={clsx(
            "font-display italic text-white leading-tight",
            isCompact ? "text-base" : "text-xl sm:text-2xl"
          )}
        >
          {m.label}
        </h2>
        {!isCompact && (
          <p className="hidden sm:block font-body text-[11px] text-white/70 mt-1 leading-snug line-clamp-2">
            {m.tagline}
          </p>
        )}
      </div>
    </Link>
  );
}

function MonogramFallback({
  initial,
  color,
}: {
  initial: string;
  color: string;
}) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${color}40, ${color}10)`,
      }}
    >
      <span
        className="font-display italic text-white/80"
        style={{ fontSize: "9rem", lineHeight: 1 }}
      >
        {initial}
      </span>
    </div>
  );
}
