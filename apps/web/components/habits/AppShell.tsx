"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Settings, LogOut, Crown, Sparkles, NotebookPen, Home } from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "../../hooks/useProfile";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";
import { clearPersistedCache } from "../providers/QueryProvider";
import {
  usePrefetchRoute,
  usePrefetchSubRoute,
  subPrefetchForHref,
} from "../../hooks/usePrefetchRoute";
import { BottomNav } from "./BottomNav";
import { OfflineIndicator } from "./OfflineIndicator";
import { Logo } from "../brand/Logo";
import { QuickCaptureFab } from "../journal/QuickCaptureFab";
import {
  CommandPalette,
  useCommandPaletteShortcut,
} from "../ui/CommandPalette";
import { PilaresFooter } from "../PilaresFooter";

/**
 * Top-level modules. Each owns a colored accent (see globals.css
 * [data-module="..."] blocks) and a contextual sub-nav. Order matters:
 * the masthead renders them left-to-right in this array.
 */
type ModuleKey =
  | "hoy"
  | "habits"
  | "finanzas"
  | "reflexiones"
  | "emprendimiento"
  | "pegasso";
type Module = {
  key: ModuleKey;
  label: string;
  href: string;
  /** Pathnames (prefix match) that belong to this module. */
  matches: string[];
};

/**
 * Módulos principales del top nav. "Hoy" abre primero porque es el
 * centro de la app (ritual diario). Su href es `/` (root) — el home
 * real monta TodayClient. Los otros 4 son los pilares estoicos.
 */
const MODULES: Module[] = [
  {
    key: "hoy",
    label: "Hoy",
    href: "/",
    matches: ["/", "/hoy", "/anuario"],
  },
  {
    key: "habits",
    label: "Hábitos",
    href: "/habitos",
    matches: [
      "/habitos",
      "/calendario",
      "/progreso",
      "/revision",
      "/historial",
    ],
  },
  {
    key: "finanzas",
    label: "Finanzas",
    href: "/finanzas",
    matches: ["/finanzas"],
  },
  {
    key: "emprendimiento",
    label: "Emprendimiento",
    href: "/emprendimiento",
    matches: ["/emprendimiento"],
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
];

type SubnavItem = { href: string; label: string; emoji?: string };

/** Sub-nav del módulo Hoy — solo enlaces relevantes al ritual y vista
 *  cumulativa (anuario). El resto vive bajo Hábitos. */
const HOY_SUBNAV: SubnavItem[] = [
  { href: "/", label: "Hoy", emoji: "☀️" },
  { href: "/anuario", label: "Anuario", emoji: "📅" },
];

/** Sub-nav del módulo Hábitos — todo lo de tracking diario y review. */
const HABITS_SUBNAV: SubnavItem[] = [
  { href: "/habitos", label: "Hábitos", emoji: "✓" },
  { href: "/habitos/fitness", label: "Fitness", emoji: "💪" },
  { href: "/habitos/lectura", label: "Lectura", emoji: "📖" },
  { href: "/calendario", label: "Calendario", emoji: "📅" },
  { href: "/progreso", label: "Progreso", emoji: "📊" },
  { href: "/revision", label: "Revisión", emoji: "🔍" },
  { href: "/historial", label: "Historial", emoji: "🗄" },
];

/** Sub-nav surfaced when the user is inside Finanzas. */
const FINANZAS_SUBNAV: SubnavItem[] = [
  { href: "/finanzas", label: "Resumen", emoji: "📈" },
  { href: "/finanzas/cuentas", label: "Cuentas", emoji: "🏦" },
  { href: "/finanzas/calendario", label: "Calendario", emoji: "📅" },
  { href: "/finanzas/tarjetas", label: "Tarjetas", emoji: "💳" },
  { href: "/finanzas/recurrentes", label: "Recurrentes", emoji: "🔁" },
  { href: "/finanzas/ahorro", label: "Ahorro", emoji: "🐖" },
  { href: "/finanzas/presupuestos", label: "Presupuestos", emoji: "🎯" },
  { href: "/finanzas/deudas", label: "Deudas", emoji: "⚖️" },
];

/** Sub-nav del módulo Mentalidad. Propósito = home (MPD + check-in
 *  diario); Meditación = sesiones Dispenza; Aura = frecuencias. */
const MENTALIDAD_SUBNAV: SubnavItem[] = [
  { href: "/reflexiones", label: "Propósito", emoji: "✨" },
  { href: "/reflexiones/meditacion", label: "Meditación", emoji: "🧘" },
  { href: "/reflexiones/respira", label: "Respira", emoji: "🌬" },
  { href: "/reflexiones/aura", label: "Aura", emoji: "📻" },
];

function moduleFromPathname(pathname: string): ModuleKey {
  // /ajustes and /upgrade are neutral — no module accent.
  if (pathname.startsWith("/ajustes")) return "hoy"; // default; but ajustes itself sets no data-module
  // /notas (diario) tampoco pertenece a un módulo — es transversal,
  // pero al renderizarse sin data-module hereda el de la ruta padre.
  // Al venir aquí lo asignamos a "hoy" como fallback visual.
  if (pathname.startsWith("/notas")) return "hoy";
  for (const m of MODULES) {
    const hit = m.matches.some((p) =>
      p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
    );
    if (hit) return m.key;
  }
  return "hoy";
}

function isActiveHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Match estricto para sub-nav: solo activa si el pathname coincide
 * EXACTO con el href del item. Si no, el item index del módulo
 * (ej. "/reflexiones") siempre se marcaba activo en sub-rutas
 * (ej. "/reflexiones/aura"), porque startsWith aplicaba.
 */
function isActiveSubnavHref(
  pathname: string,
  href: string,
  allHrefs: string[]
): boolean {
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  // Si hay otro href más específico que matchea el pathname,
  // este item no debe estar activo. Ej: pathname="/finanzas/cuentas"
  // y href="/finanzas" → existe "/finanzas/cuentas" más específico,
  // así que "Resumen" (href="/finanzas") NO se marca.
  if (pathname.startsWith(href + "/")) {
    const moreSpecific = allHrefs.some(
      (h) => h !== href && h.startsWith(href + "/") && pathname.startsWith(h)
    );
    return !moreSpecific;
  }
  return false;
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
  const { data: profile } = useProfile();
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <Link
      href="/ajustes"
      aria-label="Ajustes"
      aria-current={active ? "page" : undefined}
      className={clsx(
        "inline-flex items-center justify-center w-9 h-9 rounded-full overflow-hidden transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "text-ink bg-bg-alt ring-2 ring-accent/40"
          : "text-muted hover:text-ink hover:bg-bg-alt"
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Si la URL falla, ocultar la imagen para mostrar el ícono fallback
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Settings size={16} aria-hidden />
      )}
    </Link>
  );
}

/**
 * Acceso al Diario global desde cualquier pantalla. Vive junto a
 * Pegasso/Settings — el diario cruza áreas, no pertenece a una.
 */
/**
 * Botón explícito de "Inicio" (Hoy). Replica el comportamiento del
 * brand logo pero como icon button discoverable. Visible en todas
 * las pantallas — la forma más rápida de volver al menú visual.
 */
function HomeLink({ active, compact = false }: { active: boolean; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Ir a Hoy · Inicio"
      title="Ir a Inicio"
      aria-current={active ? "page" : undefined}
      className={clsx(
        "inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        compact ? "w-8 h-8" : "w-9 h-9",
        active
          ? "bg-accent text-bg"
          : "text-muted bg-bg-alt hover:text-ink hover:bg-bg-alt/80"
      )}
    >
      <Home size={compact ? 13 : 15} aria-hidden />
    </Link>
  );
}

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
  onOpenPalette,
}: {
  pathname: string;
  activeModule: ModuleKey;
  onOpenPalette?: () => void;
}) {
  const onAjustes = pathname.startsWith("/ajustes");
  const showHoySub = activeModule === "hoy" && !onAjustes;
  const showHabitsSub = activeModule === "habits" && !onAjustes;
  const showFinanzasSub = activeModule === "finanzas" && !onAjustes;
  const showMentalidadSub = activeModule === "reflexiones" && !onAjustes;
  // Prefetch de datos al hover sobre las pestañas de módulo. Combinado
  // con el prefetch de bundles que Next.js ya hace automáticamente en
  // <Link>, el click se siente instantáneo: el HTML/JS y los datos
  // llegan en paralelo antes del click.
  const prefetch = usePrefetchRoute();
  const prefetchSub = usePrefetchSubRoute();

  return (
    <header
      className="hidden md:block sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-line"
      aria-label="Navegación principal"
    >
      <div className="max-w-screen-2xl mx-auto px-6 pt-4 pb-3">
        {/* Row 1 — brand + utilities */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/"
            className="block group cursor-pointer"
            aria-label="Estoicismo Digital · Ir a Inicio"
            title="Ir a Inicio"
          >
            <Logo
              variant="full"
              size="md"
              className="block group-hover:opacity-80 group-hover:scale-[1.02] transition-all duration-150"
            />
          </Link>
          <div className="flex items-center gap-2">
            {onOpenPalette && (
              <button
                type="button"
                onClick={onOpenPalette}
                aria-label="Abrir paleta de comandos"
                title="Cmd+K · busca cualquier cosa"
                className="hidden lg:inline-flex items-center gap-2 h-9 pl-3 pr-1.5 rounded-full border border-line text-muted hover:text-ink hover:border-line-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="font-body text-xs">Buscar…</span>
                <kbd className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-bg-alt border border-line text-muted">
                  ⌘K
                </kbd>
              </button>
            )}
            <HomeLink active={pathname === "/"} />
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

      {/* Row 3 — contextual sub-nav (tab style, minimalist) */}
      {(showHoySub ||
        showHabitsSub ||
        showFinanzasSub ||
        showMentalidadSub) && (
        <div className="border-t border-line/60">
          <div className="max-w-screen-2xl mx-auto px-6">
            <nav
              aria-label={
                showHoySub
                  ? "Secciones de Hoy"
                  : showHabitsSub
                    ? "Secciones de Hábitos"
                    : showFinanzasSub
                      ? "Secciones de Finanzas"
                      : "Secciones de Mentalidad"
              }
              className="flex items-center gap-5 overflow-x-auto -mx-1 px-1"
            >
              {(showHoySub
                ? HOY_SUBNAV
                : showHabitsSub
                  ? HABITS_SUBNAV
                  : showFinanzasSub
                    ? FINANZAS_SUBNAV
                    : MENTALIDAD_SUBNAV
              ).map((item, _, arr) => {
                const active = isActiveSubnavHref(
                  pathname,
                  item.href,
                  arr.map((i) => i.href)
                );
                const subKey = subPrefetchForHref(item.href);
                const onPrefetch = subKey
                  ? () => prefetchSub(subKey)
                  : undefined;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    aria-current={active ? "page" : undefined}
                    onMouseEnter={onPrefetch}
                    onFocus={onPrefetch}
                    onTouchStart={onPrefetch}
                    className={clsx(
                      "relative inline-flex items-center gap-1.5 whitespace-nowrap py-2.5 font-body text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm",
                      active
                        ? "text-ink font-medium"
                        : "text-muted hover:text-ink"
                    )}
                  >
                    {item.label}
                    {active && (
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
        </div>
      )}
    </header>
  );
}

/**
 * Renderiza el PilaresFooter cuando estás en la raíz de un pilar
 * (Hoy, Hábitos, Finanzas, Emprendimiento, Mentalidad). Filtra el
 * pilar actual para no mostrar un link a sí mismo. Inyectado desde
 * el layout para no tocar los *Client.tsx individuales.
 */
function PilarFooterFromPathname({ pathname }: { pathname: string }) {
  // Solo en raíz de pilar — sub-rutas (/habitos/fitness, /finanzas/cuentas)
  // mantienen su propio flujo sin footer cross-pilar.
  if (pathname === "/" || pathname === "/hoy") return <PilaresFooter current="hoy" />;
  if (pathname === "/habitos") return <PilaresFooter current="habitos" />;
  if (pathname === "/finanzas") return <PilaresFooter current="finanzas" />;
  if (pathname === "/emprendimiento") return <PilaresFooter current="emprendimiento" />;
  if (pathname === "/reflexiones") return <PilaresFooter current="reflexiones" />;
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeModule = moduleFromPathname(pathname);
  const onAjustes = pathname.startsWith("/ajustes");
  // /ajustes is a neutral shell — no module accent. Everything else
  // gets scoped by the active module so --color-accent matches.
  const dataModule = onAjustes ? undefined : activeModule;
  const showHoySub = activeModule === "hoy" && !onAjustes;
  const showHabitsSub = activeModule === "habits" && !onAjustes;
  const showFinanzasSub = activeModule === "finanzas" && !onAjustes;
  const showMentalidadSub = activeModule === "reflexiones" && !onAjustes;
  const palette = useCommandPaletteShortcut();
  const prefetchSub = usePrefetchSubRoute();

  return (
    <div data-module={dataModule} className="min-h-screen bg-bg">
      {/* Skip to content — first focusable for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:bg-accent focus:text-bg focus:px-4 focus:py-2 focus:rounded-lg focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-widest focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      {/* Offline banner — hidden by default; only mounts DOM when offline */}
      <OfflineIndicator />

      {/* Desktop masthead */}
      <DesktopMasthead
        pathname={pathname}
        activeModule={activeModule}
        onOpenPalette={() => palette.setOpen(true)}
      />

      {/* Mobile top bar (brand + plan pill; nav at bottom) */}
      <header
        className="md:hidden sticky top-0 z-30 bg-bg-alt/95 backdrop-blur-sm border-b border-line"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="h-12 px-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center"
            aria-label="Estoicismo Digital · Ir a Hoy"
          >
            <Logo variant="full" size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <HomeLink active={pathname === "/"} compact />
            <JournalLink active={pathname.startsWith("/notas")} compact />
            <PegassoLink active={pathname.startsWith("/pegasso")} compact />
            <SettingsLink active={onAjustes} />
            <PlanPill compact />
          </div>
        </div>
        {(showHoySub ||
          showHabitsSub ||
          showFinanzasSub ||
          showMentalidadSub) && (
          <nav
            aria-label={
              showHoySub
                ? "Secciones de Hoy"
                : showHabitsSub
                  ? "Secciones de Hábitos"
                  : showFinanzasSub
                    ? "Secciones de Finanzas"
                    : "Secciones de Mentalidad"
            }
            className="flex items-center gap-4 overflow-x-auto px-4 border-t border-line/60 bg-bg-alt/90 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {(showHoySub
              ? HOY_SUBNAV
              : showHabitsSub
                ? HABITS_SUBNAV
                : showFinanzasSub
                  ? FINANZAS_SUBNAV
                  : MENTALIDAD_SUBNAV
            ).map((item, _, arr) => {
              const active = isActiveSubnavHref(
                pathname,
                item.href,
                arr.map((i) => i.href)
              );
              const subKey = subPrefetchForHref(item.href);
              const onPrefetch = subKey
                ? () => prefetchSub(subKey)
                : undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onTouchStart={onPrefetch}
                  onMouseEnter={onPrefetch}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "relative inline-flex items-center gap-1 whitespace-nowrap py-2.5 font-body text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm",
                    active
                      ? "text-ink font-medium"
                      : "text-muted hover:text-ink"
                  )}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Content */}
      <main
        id="main-content"
        className="min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0"
      >
        {children}
        <PilarFooterFromPathname pathname={pathname} />
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
