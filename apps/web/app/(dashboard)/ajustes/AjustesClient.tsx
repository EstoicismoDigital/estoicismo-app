"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, LogOut, Mail, Globe } from "lucide-react";
import { clsx } from "clsx";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";

export function AjustesClient({
  email,
  plan,
  timezone,
}: {
  email: string;
  plan: "free" | "premium";
  timezone: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isPremium = plan === "premium";

  async function handleSignOut() {
    setLoading(true);
    const sb = getSupabaseBrowserClient();
    await sb.auth.signOut();
    router.push("/sign-in");
  }

  return (
    <div className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Tu cuenta
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl">Ajustes</h1>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-10">
        {/* Profile section */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Perfil
          </p>

          <div className="flex flex-col gap-px rounded-card overflow-hidden border border-line">
            <div className="flex items-center gap-3 px-4 py-4 bg-bg">
              <Mail size={18} className="text-muted flex-shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-0.5">
                  Email
                </p>
                <p className="font-body text-sm text-ink truncate">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-4 bg-bg border-t border-line">
              <Globe size={18} className="text-muted flex-shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-0.5">
                  Zona horaria
                </p>
                <p className="font-body text-sm text-ink">{timezone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plan section */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Plan
          </p>
          <div
            className={clsx(
              "rounded-card p-5 border flex flex-col sm:flex-row sm:items-center gap-4",
              isPremium
                ? "bg-bg-alt border-accent/30"
                : "bg-bg border-line"
            )}
          >
            <div className="flex items-start gap-3 flex-1">
              <span
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  isPremium ? "bg-accent text-white" : "bg-line text-muted"
                )}
              >
                <Crown size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Plan actual
                </p>
                <h3 className="font-display italic text-xl text-ink mt-0.5">
                  {isPremium ? "Premium" : "Gratuito"}
                </h3>
                <p className="font-body text-sm text-muted mt-1 leading-relaxed">
                  {isPremium
                    ? "Tienes acceso a hábitos ilimitados y funciones extra."
                    : "Puedes crear hasta 3 hábitos. Actualiza para más."}
                </p>
              </div>
            </div>

            {!isPremium && (
              <Link
                href="/upgrade"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-accent text-white font-body font-medium text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Crown size={14} />
                Actualizar a Premium
              </Link>
            )}
          </div>
        </div>

        {/* Session */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Sesión
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg border border-line text-ink font-body text-sm hover:bg-bg-alt hover:border-accent/30 disabled:opacity-40 transition-colors w-full sm:w-auto self-start"
          >
            <LogOut size={16} />
            {loading ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      </section>
    </div>
  );
}
