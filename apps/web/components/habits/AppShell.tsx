"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Settings, LogOut, Crown, Sparkles, NotebookPen } from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "../../hooks/useProfile";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";
import { clearPersistedCache } from "../providers/QueryProvider";
import { usePrefetchRoute } from "../../hooks/usePrefetchRoute";
import { BottomNav } from "./BottomNav";
import { OfflineIndicator } from "./OfflineIndicator";
import { Logo } from "../brand/Logo";
import { QuickCaptureFab } from "../journal/QuickCaptureFab";
import {
  CommandPalette,
  useCommandPaletteShortcut,
} from "../ui/CommandPalette";

/**
 * Top-level modules. Each owns a colored accent (see globals.css
 * [data-module="..."] blocks) and a contextual sub-nav. Order matters:
 * the masthead renders them left-to-right in this array.
 */
type ModuleKey = "habits" | "finanzas" | "reflexiones" | "emprendimiento" | "pegasso";
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
    // Etiqueta visible: "Mentalidad". La ruta interna permanece como
    // /reflexiones (y el data-module sigue siendo "reflexiones" para
    // mantener el accent violeta ya cableado en globals.css).
    label: "Mentalidad",
    href: "/reflexiones",
    matches: ["/reflexiones"],
  },
  {
    key: "emprendimiento",
    label: "Negocio",
    href: "/emprendimiento",
    matches: ["/emprendimiento"],
  },
];

/** Sub-nav surfaced when the user is inside the Hábitos module. Built
 * out of plain links (no icons) and a single typographic treatment. */
const HABITS_SUBNAV: { href: string; label: string }[] = [
  { href: "/", label: "Hoy" },
  { href: "/habitos/fitness", label: "Fitness" },
  { href: "/habitos/lectura", label: "Lectura" },
  { href: "/calendario", label: "Calendario" },
  { href: "/progreso", label: "Progreso" },
  { href: "/revision", label: "Revisión" },
  { href: "/notas", label: "Notas" },
  { href: "/historial", label: "Historial" },
];

/** Sub-nav surfaced when the user is inside Finanzas. Same chip style
 *  as habits — typography forward, one accent color. */
const FINANZAS_SUBNAV: { href: string; label: string }[] = [
  { href: "/finanzas", label: "Resumen" },
  { href: "/finanzas/cuentas", label: "Cuentas" },
  { href: "/finanzas/calendario", label: "Calendario" },
  { href: "/finanzas/tarjetas", label: "Tarjetas" },
  { href: "/finanzas/recurrentes", label: "Recurrentes" },
  { href: "/finanzas/ahorro", label: "Ahorro" },
  { href: "/finanzas/presupuestos", label: "Presupuestos" },
  { href: "/finanzas/deudas", label: "Deudas" },
];

/** Sub-nav del módulo Mentalidad. Propósito = home (MPD + check-in
 *  diario); Meditación = sesiones Dispenza; Aura = frecuencias. */
const MENTALIDAD_SUBNAV: { href: string; label: string }[] = [
  { href: "/reflexiones", label: "Propósito" },
  { href: "/reflexiones/meditacion", label: "Meditación" },
  { href: "/reflexiones/aura", label: "Aura" },
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
    await clearPersistedCache();
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
 * Acceso al Diario global desde cualquier pantalla. Vive junto a
 * Pegasso/Settings — el diario cruza áreas, no pertenece a una.
 */
function JournalLink({ active, compact = false }: { active: boolean; compact?: boolean }) {
  return (
    <Link
      href="/notas"
      aria-label="Abrir diario"
      aria-current={active ? "page" : undefined}
      className={clsx(
        "inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        compact ? "w-8 h-8" : "w-9 h-9",
        active
          ? "bg-ink text-bg"
          : "text-muted bg-bg-alt hover:text-ink"
      )}
    >
      <NotebookPen size={compact ? 13 : 15} aria-hidden />
    </Link>
  );
}

/**
 * Acceso a Pegasso desde cualquier pantalla. Vive junto a Settings
 * en la barra superior — el chat es global, no pertenece a un módulo.
 */
function PegassoLink({ active, compact = false }: { active: boolean; compact?: boolean }) {
  return (
    <Link
      href="/pegasso"
      aria-label="Hablar con Pegasso"
      aria-current={active ? "page" : undefined}
      className={clsx(
        "inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        compact ? "w-8 h-8" : "w-9 h-9",
        active
          ? "bg-accent text-bg"
          : "text-accent bg-accent/10 hover:bg-accent/20"
      )}
    >
      <Sparkles size={compact ? 14 : 16} aria-hidden />
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
  const showFinanzasSub = activeModule === "finanzas" && !onAjustes;
  const showMentalidadSub = activeModule === "reflexiones" && !onAjustes;
  // Prefetch de datos al hover sobre las pestañas de módulo. Combinado
  // con el prefetch de bundles que Next.js ya hace automáticamente en
  // <Link>, el click se siente instantáneo: el HTML/JS y los datos
  // llegan en paralelo antes del click.
  const prefetch = usePrefetchRoute();

  return (
    <header
      className="hidden md:block sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-line"
      aria-label="Navegación principal"
    >
      <div className="max-w-6xl mx-auto px-6 pt-4 pb-3">
        {/* Row 1 — brand + utilities */}
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="block group" aria-label="Estoicismo Digital · Ir a Hoy">
            <Logo variant="full" size="md" className="block group-hover:opacity-80 transition-opacity" />
          </Link>
          <div className="flex items-center gap-2">
            <PlanPill />
            <JournalLink active={pathname.startsWith("/notas")} />
            <PegassoLink active={pathname.startsWith("/pegasso")} />
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
                onMouseEnter={() => prefetch(m.key)}
                onFocus={() => prefetch(m.key)}
                onTouchStart={() => prefetch(m.key)}
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

      {/* Row 3 — contextual sub-nav (Hábitos / Finanzas / Mentalidad) */}
      {(showHabitsSub || showFinanzasSub || showMentalidadSub) && (
        <div className="border-t border-line/60">
          <div className="max-w-6xl mx-auto px-6">
            <nav
              aria-label={
                showHabitsSub
                  ? "Secciones de Hábitos"
                  : showFinanzasSub
                  ? "Secciones de Finanzas"
                  : "Secciones de Mentalidad"
              }
              className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1"
            >
              {(showHabitsSub
                ? HABITS_SUBNAV
                : showFinanzasSub
                ? FINANZAS_SUBNAV
                : MENTALIDAD_SUBNAV
              ).map((item) => {
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
  const showFinanzasSub = activeModule === "finanzas" && !onAjustes;
  const showMentalidadSub = activeModule === "reflexiones" && !onAjustes;
  const palette = useCommandPaletteShortcut();

  return (
    <div data-module={dataModule} className="min-h-screen bg-bg">
      {/* Offline banner — hidden by default; only mounts DOM when offline */}
      <OfflineIndicator />

      {/* Desktop masthead */}
      <DesktopMasthead pathname={pathname} activeModule={activeModule} />

      {/* Mobile top bar (brand + plan pill; nav at bottom) */}
      <header
        className="md:hidden sticky top-0 z-30 bg-bg-alt/95 backdrop-blur-sm border-b border-line"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="h-12 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Estoicismo Digital">
            <Logo variant="full" size="sm" />
          </Link>
          <div className="flex items-center gap-1.5">
            <JournalLink active={pathname.startsWith("/notas")} compact />
            <PegassoLink active={pathname.startsWith("/pegasso")} compact />
            <PlanPill compact />
          </div>
        </div>
        {(showFinanzasSub || showMentalidadSub) && (
          <nav
            aria-label={
              showFinanzasSub
                ? "Secciones de Finanzas"
                : "Secciones de Mentalidad"
            }
            className="flex items-center gap-1 overflow-x-auto py-1.5 px-3 border-t border-line/60 bg-bg-alt/90 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {(showFinanzasSub ? FINANZAS_SUBNAV : MENTALIDAD_SUBNAV).map((item) => {
              const active = isActiveHref(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.18em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-ink"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Content */}
      <main className="min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>

      <BottomNav pathname={pathname} />
      <QuickCaptureFab />
      <CommandPalette
        open={palette.open}
        onClose={() => palette.setOpen(false)}
      />
    </div>
  );
}
