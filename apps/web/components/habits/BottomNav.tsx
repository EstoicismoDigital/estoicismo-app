"use client";
import Link from "next/link";
import { Home, Calendar, NotebookPen, Settings, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

type TabItem = { href: string; label: string; Icon: typeof Home };

const TABS: TabItem[] = [
  { href: "/", label: "Hoy", Icon: Home },
  { href: "/progreso", label: "Progreso", Icon: TrendingUp },
  { href: "/calendario", label: "Calendario", Icon: Calendar },
  { href: "/notas", label: "Notas", Icon: NotebookPen },
  { href: "/ajustes", label: "Ajustes", Icon: Settings },
];

/**
 * Mobile-only fixed bottom navigation bar with 5 primary tabs.
 *
 * - Labels + icons (MD `nav-label-icon`)
 * - Active state: icon + label in accent, bold weight
 * - Min touch target 44×44 px per tab
 * - Respects iOS safe-area (home indicator) via env(safe-area-inset-bottom)
 */
export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-alt/95 backdrop-blur-sm border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-14" role="list">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={clsx(
                  "h-full flex flex-col items-center justify-center gap-0.5 min-w-[44px] transition-colors duration-150 ease-out",
                  active ? "text-accent" : "text-muted hover:text-ink"
                )}
              >
                <Icon
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
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
