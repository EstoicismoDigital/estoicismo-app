"use client";
import Link from "next/link";
import { Flame, Coins, Brain, NotebookPen, Settings } from "lucide-react";
import { clsx } from "clsx";

type TabItem = {
  href: string;
  label: string;
  Icon: typeof Flame;
  /** Module for per-tab accent color when active. */
  module?: "habits" | "finanzas" | "reflexiones";
  /** Additional pathnames that should light this tab as active. */
  matches?: string[];
};

/**
 * Mobile tabs mirror the desktop module model:
 *   Hábitos (home) — Finanzas — Mentalidad — Notas — Ajustes
 *
 * "Mentalidad" sigue viviendo bajo la ruta `/reflexiones` (el URL se
 * conserva por compatibilidad y porque aún alberga reflexiones), pero
 * la etiqueta visible es Mentalidad — el módulo gira en torno al MPD
 * de Napoleón Hill, meditación Dispenza y frecuencias (Aura).
 *
 * Notas stays in the bottom nav because it's high-use across the
 * habits module (users revisit reflections attached to completions).
 * All other habits sub-pages (calendario, progreso, revisión,
 * historial) are reached from the in-page sub-nav on each screen.
 */
const TABS: TabItem[] = [
  {
    href: "/",
    label: "Hábitos",
    Icon: Flame,
    module: "habits",
    matches: ["/calendario", "/progreso", "/revision", "/historial", "/habitos"],
  },
  { href: "/finanzas", label: "Finanzas", Icon: Coins, module: "finanzas" },
  {
    href: "/reflexiones",
    label: "Mentalidad",
    Icon: Brain,
    module: "reflexiones",
  },
  {
    href: "/notas",
    label: "Notas",
    Icon: NotebookPen,
    module: "habits",
  },
  { href: "/ajustes", label: "Ajustes", Icon: Settings },
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
  function isActive(tab: TabItem): boolean {
    if (tab.href === "/") {
      if (pathname === "/") return true;
      return tab.matches?.some((p) => isPathMatch(p, pathname)) ?? false;
    }
    if (pathname === tab.href || pathname.startsWith(tab.href + "/")) return true;
    return tab.matches?.some((p) => isPathMatch(p, pathname)) ?? false;
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-alt/95 backdrop-blur-sm border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-14" role="list">
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={tab.label}
                data-module={active && tab.module ? tab.module : undefined}
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
                    "font-body text-[11px] leading-none",
                    active ? "font-medium" : "font-normal"
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
