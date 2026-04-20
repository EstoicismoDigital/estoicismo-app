"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Calendar,
  Crown,
  Settings,
  LogOut,
  Archive,
  TrendingUp,
  NotebookPen,
  CalendarClock,
} from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "../../hooks/useProfile";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";
import { BottomNav } from "./BottomNav";

type NavItem = { href: string; label: string; Icon: typeof Home };

const NAV: NavItem[] = [
  { href: "/", label: "Hoy", Icon: Home },
  { href: "/calendario", label: "Calendario", Icon: Calendar },
  { href: "/progreso", label: "Progreso", Icon: TrendingUp },
  { href: "/revision", label: "Revisión semanal", Icon: CalendarClock },
  { href: "/notas", label: "Notas", Icon: NotebookPen },
  { href: "/historial", label: "Historial", Icon: Archive },
  { href: "/upgrade", label: "Premium", Icon: Crown },
  { href: "/ajustes", label: "Ajustes", Icon: Settings },
];

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "group flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-[15px] transition-colors duration-150 ease-out min-h-[44px]",
              active
                ? "bg-bg border-l-2 border-accent text-ink font-medium"
                : "text-muted hover:text-ink hover:bg-bg/60"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              size={18}
              className={clsx(
                "transition-colors",
                active ? "text-accent" : "text-muted group-hover:text-ink"
              )}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function PlanPill({ compact = false }: { compact?: boolean }) {
  const { data: profile } = useProfile();
  const isPremium = profile?.plan === "premium";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-widest",
        compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]",
        isPremium ? "bg-accent text-bg" : "bg-line text-muted"
      )}
    >
      {isPremium ? (
        <>
          <Crown size={compact ? 9 : 10} /> Premium
        </>
      ) : (
        "Gratuito"
      )}
    </span>
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
      className="group flex items-center gap-2 px-3 py-2 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg/60 transition-colors duration-150 ease-out min-h-[44px] disabled:opacity-40"
      aria-label="Cerrar sesión"
    >
      <LogOut size={16} />
      <span>{loading ? "Saliendo..." : "Cerrar sesión"}</span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed top-0 left-0 bottom-0 w-[240px] bg-bg-alt border-r border-line flex-col"
        aria-label="Navegación principal"
      >
        <div className="px-6 pt-8 pb-6">
          <Link href="/" className="block">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">
              Estoicismo
            </p>
            <h1 className="font-display italic text-2xl text-ink leading-tight">
              Digital
            </h1>
          </Link>
        </div>

        <div className="px-3 flex-1">
          <NavLinks pathname={pathname} />
        </div>

        <div className="px-3 pb-6 flex flex-col gap-3 border-t border-line pt-4">
          <div className="px-3">
            <PlanPill />
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile top bar (brand + plan pill only; nav lives at bottom) */}
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

      {/* Content — leave room for desktop sidebar, mobile bottom nav + safe-area */}
      <main
        className="md:pl-[240px] min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0"
      >
        {children}
      </main>

      <BottomNav pathname={pathname} />
    </div>
  );
}
