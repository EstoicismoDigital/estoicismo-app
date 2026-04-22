"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Settings, LogOut, Crown } from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "../../hooks/useProfile";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";
import { BottomNav } from "./BottomNav";

/**
 * Top-level modules. Each owns a colored accent (see globals.css
 * [data-module="..."] blocks) and a contextual sub-nav. Order matters:
 * the masthead renders them left-to-right in this array.
 */
type ModuleKey = "habits" | "finanzas" | "reflexiones";
type Module = {
  key: ModuleKey;
  label: string;
  href: string;
  /** Pathnames (prefix match) that belong to this module. */
  matches: string[];
};

const MODULES: Module[] = [
  {
    key: "habits",
    label: "Hábitos",
    href: "/",
    matches: [
      "/",
      "/calendario",
      "/progreso",
      "/revision",
      "/notas",
      "/historial",
      "/habitos",
    ],
  },
  {
    key: "finanzas",
    label: "Finanzas",
    href: "/finanzas",
    matches: ["/finanzas"],
  },
  {
    key: "reflexiones",
    label: "Reflexiones",
    href: "/reflexiones",
    matches: ["/reflexiones"],
  },
];

/** Sub-nav surfaced when the user is inside the Hábitos module. Built
 * out of plain links (no icons) and a single typographic treatment. */
const HABITS_SUBNAV: { href: string; label: string }[] = [
  { href: "/", label: "Hoy" },
  { href: "/calendario", label: "Calendario" },
  { href: "/progreso", label: "Progreso" },
  { href: "/revision", label: "Revisión" },
  { href: "/notas", label: "Notas" },
  { href: "/historial", label: "Historial" },
];

function moduleFromPathname(pathname: string): ModuleKey {
  // /ajustes and /upgrade are neutral — no module accent.
  if (pathname.startsWith("/ajustes")) return "habits"; // default; but ajustes itself sets no data-module
  for (const m of MODULES) {
    const hit = m.matches.some((p) =>
      p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
    );
    if (hit) return m.key;
  }
  return "habits";
}

function isActiveHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function PlanPill({ compact = false }: { compact?: boolean }) {
  const { data: profile } = useProfile();
  const isPremium = profile?.plan === "premium";
  return (
    <Link
      href="/upgrade"
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-widest transition-colors",
        compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]",
        isPremium
          ? "bg-accent text-bg hover:opacity-90"
          : "border border-line text-muted hover:text-ink hover:border-accent/40"
      )}
    >
      {isPremium ? (
        <>
          <Crown size={compact ? 9 : 10} aria-hidden /> Premium
        </>
      ) : (
        "Hazte Premium"
      )}
    </Link>
  );
}

function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function handleSignOut() {
    setLoading(true);
    const sb = getSupabaseBrowserClient();
    await sb.auth.signOut();
    router.push("/sign-in");
  }
  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      aria-label="Cerrar sesión"
      className="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-ink hover:bg-bg-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
    >
      <LogOut size={16} aria-hidden />
    </button>
  );
}

function SettingsLink({ active }: { active: boolean }) {
  return (
    <Link
      href="/ajustes"
      aria-label="Ajustes"
      aria-current={active ? "page" : undefined}
      className={clsx(
        "inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "text-ink bg-bg-alt"
          : "text-muted hover:text-ink hover:bg-bg-alt"
      )}
    >
      <Settings size={16} aria-hidden />
    </Link>
  );
}

/**
 * Desktop masthead — editorial, typography-forward. Replaces the old
 * left icon sidebar the user called out as "generic AI-app".
 *
 * Structure:
 *   Row 1: brand (ESTOICISMO / Digital) — right: plan pill, ajustes, signout
 *   Row 2: module tabs in italic display type (Hábitos · Finanzas · Reflexiones)
 *          active module gets an underline in its module accent color.
 *   Row 3: contextual sub-nav (only when inside Hábitos).
 */
function DesktopMasthead({
  pathname,
  activeModule,
}: {
  pathname: string;
  activeModule: ModuleKey;
}) {
  const onAjustes = pathname.startsWith("/ajustes");
  const showHabitsSub = activeModule === "habits" && !onAjustes;

  return (
    <header
      className="hidden md:block sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-line"
      aria-label="Navegación principal"
    >
      <div className="max-w-6xl mx-auto px-6 pt-5 pb-3">
        {/* Row 1 — brand + utilities */}
        <div className="flex items-end justify-between mb-4">
          <Link href="/" className="block group" aria-label="Ir a Hoy">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-0.5 group-hover:text-ink transition-colors">
              Estoicismo
            </p>
            <h1 className="font-display italic text-3xl lg:text-[34px] leading-none text-ink">
              Digital
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <PlanPill />
            <SettingsLink active={onAjustes} />
            <SignOutButton />
          </div>
        </div>

        {/* Row 2 — module tabs (editorial, italic serif, no icons) */}
        <nav aria-label="Módulos" className="flex items-baseline gap-6 lg:gap-9">
          {MODULES.map((m) => {
            const active = !onAjustes && activeModule === m.key;
            return (
              <Link
                key={m.key}
                href={m.href}
                aria-current={active ? "page" : undefined}
                data-module={m.key}
                className={clsx(
                  "relative pb-2 font-display italic text-xl lg:text-[22px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm",
                  active
                    ? "text-ink"
                    : "text-muted hover:text-ink"
                )}
              >
                {m.label}
                {active && (
                  // Module-colored underline. The [data-module] on this
                  // Link scopes --color-accent for this single element,
                  // so the line is gold under Hábitos, green under
                  // Finanzas, violet under Reflexiones.
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Row 3 — contextual sub-nav (only inside Hábitos) */}
      {showHabitsSub && (
        <div className="border-t border-line/60">
          <div className="max-w-6xl mx-auto px-6">
            <nav
              aria-label="Secciones de Hábitos"
              className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1"
            >
              {HABITS_SUBNAV.map((item) => {
                const active = isActiveHref(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.18em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:text-ink hover:bg-bg-alt"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeModule = moduleFromPathname(pathname);
  const onAjustes = pathname.startsWith("/ajustes");
  // /ajustes is a neutral shell — no module accent. Everything else
  // gets scoped by the active module so --color-accent matches.
  const dataModule = onAjustes ? undefined : activeModule;

  return (
    <div data-module={dataModule} className="min-h-screen bg-bg">
      {/* Desktop masthead */}
      <DesktopMasthead pathname={pathname} activeModule={activeModule} />

      {/* Mobile top bar (brand + plan pill; nav at bottom) */}
      <header
        className="md:hidden sticky top-0 z-30 bg-bg-alt/95 backdrop-blur-sm border-b border-line"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="h-12 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Estoicismo
            </p>
            <span className="font-display italic text-base text-ink">Digital</span>
          </Link>
          <PlanPill compact />
        </div>
      </header>

      {/* Content */}
      <main className="min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>

      <BottomNav pathname={pathname} />
    </div>
  );
}
