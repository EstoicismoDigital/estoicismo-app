"use client";
import Link from "next/link";
import { useState, type ReactNode, type AnchorHTMLAttributes } from "react";

/**
 * HoverPrefetchLink — Link de Next que prefetchea SOLO al hover/touch
 * en vez de al renderizar. Se usa en listas/grids de navegación con
 * muchos items donde prefetch agresivo quema bandwidth y memoria sin
 * beneficio real.
 *
 * Patrón documentado en:
 * https://nextjs.org/docs/app/guides/prefetching
 *
 * Comportamiento:
 *   - Hasta el primer hover/touch: prefetch={false}
 *   - A partir de ahí: prefetch={null} (default Next, on-screen prefetch)
 */
export function HoverPrefetchLink({
  href,
  children,
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const [active, setActive] = useState(false);
  return (
    <Link
      href={href}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
      onTouchStart={() => setActive(true)}
      onFocus={() => setActive(true)}
      className={className}
      {...rest}
    >
      {children}
    </Link>
  );
}
