"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Home, Calendar, Crown, Settings, Menu, X, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "../../hooks/useProfile";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";

type NavItem = { href: string; label: string; Icon: typeof Home };

const NAV: NavItem[] = [
  { href: "/", label: "Hoy", Icon: Home },
  { href: "/calendario", label: "Calendario", Icon: Calendar },
  { href: "/upgrade", label: "Premium", Icon: Crown },
  { href: "/ajustes", label: "Ajustes", Icon: Settings },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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

function PlanPill() {
  const { data: profile } = useProfile();
  const isPremium = profile?.plan === "premium";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest",
        isPremium ? "bg-accent text-white" : "bg-line text-muted"
      )}
    >
      {isPremium ? (
        <>
          <Crown size={10} /> Premium
        </>
      ) : (
        "Plan gratuito"
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-bg-alt border-b border-line">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Estoicismo
            </p>
            <span className="font-display italic text-base text-ink">Digital</span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="p-2 rounded-lg hover:bg-bg text-ink transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
        >
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-150"
          />
          <div className="absolute top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-bg-alt shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-4 border-b border-line">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Navegación
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar menú"
                className="p-2 rounded-lg hover:bg-bg text-ink min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-3 py-4 flex-1">
              <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="px-3 pb-6 flex flex-col gap-3 border-t border-line pt-4">
              <div className="px-3">
                <PlanPill />
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      )}

      <main className="md:pl-[240px] min-h-screen">{children}</main>
    </div>
  );
}
