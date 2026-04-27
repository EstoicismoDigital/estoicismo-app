"use client";
import Link from "next/link";
import { Sun, ListChecks, Coins, Brain, Briefcase } from "lucide-react";
import { clsx } from "clsx";
import { usePrefetchRoute, type PrefetchTarget } from "../../hooks/usePrefetchRoute";

type TabItem = {
  href: string;
  label: string;
  Icon: typeof Sun;
  /** Module for per-tab accent color when active. */
  module?: "habits" | "finanzas" | "reflexiones" | "emprendimiento";
  /** Additional pathnames that should light this tab as active. */
  matches?: string[];
};

/**
 * Mobile tabs — 5 módulos top-level:
 *   Hoy — Hábitos — Finanzas — Mentalidad — Negocio
 *
 * Ajustes vive en la top bar (junto a Diario, Pegasso, Plan) para
 * dejar este nav 100% dedicado a los pilares verticales.
 */
const TABS: TabItem[] = [
  {
    href: "/",
    label: "Hoy",
    Icon: Sun,
    module: "habits",
    matches: ["/anuario"],
  },
  {
    href: "/habitos",
    label: "Hábitos",
    Icon: ListChecks,
    module: "habits",
    matches: [
      "/habitos",
      "/calendario",
      "/progreso",
      "/revision",
      "/historial",
    ],
  },
  { href: "/finanzas", label: "Finanzas", Icon: Coins, module: "finanzas" },
  {
    href: "/reflexiones",
    label: "Mentalidad",
    Icon: Brain,
    module: "reflexiones",
  },
  {
    href: "/emprendimiento",
    label: "Negocio",
    Icon: Briefcase,
    module: "emprendimiento",
  },
];

/**
 * Mobile-only fixed bottom navigation bar.
 *
 * - Labels + icons (MD `nav-label-icon`)
 * - Active tab colors icon + label using its own module accent, so the
 *   gold / green / violet identity persists on mobile without having to
 *   restyle per route. The tab sets `data-module` on the link, which
 *   re-scopes `--color-accent` locally — matching the desktop masthead.
 * - Min touch target 44×44 px per tab (height 56px row)
 * - Respects iOS safe-area via env(safe-area-inset-bottom)
 */
export function BottomNav({ pathname }: { pathname: string }) {
  // Prefetch en touchstart/focus — en mobile no hay "hover", pero el
  // touchstart (primer contacto del dedo) llega ~80-120ms antes que
  // el click, así que el fetch arranca durante la animación del tap.
  const prefetch = usePrefetchRoute();

  function prefetchTargetFor(tab: TabItem): PrefetchTarget | null {
    if (tab.module === "habits") return "habits";
    if (tab.module === "finanzas") return "finanzas";
    if (tab.module === "reflexiones") return "reflexiones";
    if (tab.module === "emprendimiento") return "emprendimiento";
    return null;
  }

  function isActive(tab: TabItem): boolean {
    if (tab.href === "/") {
      // Hoy es solo "/" exacto (anuario etc. matchean por matches[]).
      if (pathname === "/") return true;
      return tab.matches?.some((p) => isPathMatch(p, pathname)) ?? false;
    }
    // Para otras tabs, evitar que /habitos también se active si estamos
    // en /finanzas o algo así. Solo prefix match si el path empieza con
    // tab.href.
    if (pathname === tab.href) return true;
    if (pathname.startsWith(tab.href + "/")) return true;
    return tab.matches?.some((p) => isPathMatch(p, pathname)) ?? false;
  }

  return (
    <nav
      aria-label="Navegación principal"
      data-print-hide
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-alt/95 backdrop-blur-sm border-t border-line print:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-14" role="list">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const target = prefetchTargetFor(tab);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={tab.label}
                data-module={active && tab.module ? tab.module : undefined}
                onTouchStart={target ? () => prefetch(target) : undefined}
                onMouseEnter={target ? () => prefetch(target) : undefined}
                onFocus={target ? () => prefetch(target) : undefined}
                className={clsx(
                  "h-full flex flex-col items-center justify-center gap-0.5 min-w-[44px] transition-colors duration-150 ease-out",
                  active ? "text-accent" : "text-muted hover:text-ink"
                )}
              >
                <tab.Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden
                />
                <span
                  className={clsx(
                    "font-body text-[11px] leading-none tracking-tight",
                    // Pesos Montserrat por rol:
                    // · inactivo = 500 (Medium)  — menú
                    // · activo   = 600 (Semibold) — menú activo
                    active ? "font-semibold" : "font-medium"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Small helper — pathname matches either exactly or as a segment prefix.
function isPathMatch(candidate: string, pathname: string): boolean {
  if (candidate === "/") return pathname === "/";
  return pathname === candidate || pathname.startsWith(candidate + "/");
}
