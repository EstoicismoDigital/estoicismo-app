"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Crown,
  LogOut,
  Mail,
  Globe,
  User,
  Check,
  X,
  Archive,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";
import {
  useUpdateProfile,
  COMMON_TIMEZONES,
} from "../../../hooks/useUpdateProfile";
import { ExportDataButton } from "../../../components/habits/ExportDataButton";

export function AjustesClient({
  email,
  plan,
  timezone,
  username,
}: {
  email: string;
  plan: "free" | "premium";
  timezone: string;
  username: string | null;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const isPremium = plan === "premium";
  const updateProfile = useUpdateProfile();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(username ?? "");
  const [tz, setTz] = useState(timezone);

  async function handleSignOut() {
    setSigningOut(true);
    const sb = getSupabaseBrowserClient();
    await sb.auth.signOut();
    router.push("/sign-in");
  }

  function handleSaveName() {
    const trimmed = nameDraft.trim();
    if (trimmed.length === 0) {
      updateProfile.mutate(
        { username: null },
        { onSuccess: () => setEditingName(false) }
      );
      return;
    }
    updateProfile.mutate(
      { username: trimmed },
      { onSuccess: () => setEditingName(false) }
    );
  }

  function handleCancelName() {
    setNameDraft(username ?? "");
    setEditingName(false);
  }

  function handleChangeTz(value: string) {
    setTz(value);
    updateProfile.mutate({ timezone: value });
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

          <div className="flex flex-col rounded-card overflow-hidden border border-line bg-bg">
            {/* Display name */}
            <div className="flex items-center gap-3 px-4 py-4">
              <User size={18} className="text-muted flex-shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-0.5">
                  Nombre
                </p>
                {editingName ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveName();
                    }}
                    className="flex items-center gap-2 mt-1"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      placeholder="Tu nombre"
                      maxLength={40}
                      className="flex-1 h-10 px-3 rounded-lg border border-line bg-bg-alt font-body text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                      type="submit"
                      disabled={updateProfile.isPending}
                      aria-label="Guardar nombre"
                      className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-40 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelName}
                      aria-label="Cancelar"
                      className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-line text-muted hover:bg-bg-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <X size={16} />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    className="font-body text-sm text-ink text-left hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    {username ?? (
                      <span className="text-muted italic">Añadir nombre</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="flex items-center gap-3 px-4 py-4 border-t border-line">
              <Mail size={18} className="text-muted flex-shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-0.5">
                  Email
                </p>
                <p className="font-body text-sm text-ink truncate">{email}</p>
              </div>
            </div>

            {/* Timezone */}
            <div className="flex items-center gap-3 px-4 py-4 border-t border-line">
              <Globe size={18} className="text-muted flex-shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="timezone"
                  className="font-mono text-[10px] uppercase tracking-widest text-muted mb-0.5 block"
                >
                  Zona horaria
                </label>
                <select
                  id="timezone"
                  value={tz}
                  onChange={(e) => handleChangeTz(e.target.value)}
                  disabled={updateProfile.isPending}
                  className="w-full font-body text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-accent rounded cursor-pointer disabled:opacity-60"
                >
                  {!COMMON_TIMEZONES.some((t) => t.value === tz) && (
                    <option value={tz}>{tz}</option>
                  )}
                  {COMMON_TIMEZONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
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
              isPremium ? "bg-bg-alt border-accent/30" : "bg-bg border-line"
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

        {/* App */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            App
          </p>
          <div className="rounded-card overflow-hidden border border-line bg-bg">
            <Link
              href="/historial"
              className="flex items-center gap-3 px-4 py-4 hover:bg-bg-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
            >
              <Archive size={18} className="text-muted flex-shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-ink">Hábitos archivados</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-0.5">
                  Restaurar o eliminar
                </p>
              </div>
              <ChevronRight size={16} className="text-muted flex-shrink-0" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Data ownership */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Datos
          </p>
          <div className="rounded-card border border-line bg-bg p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-body text-sm font-medium text-ink">
                Descarga todo lo que has registrado
              </h3>
              <p className="font-body text-xs text-muted mt-1 leading-relaxed max-w-md">
                Un archivo JSON con tus hábitos, archivados incluidos, sus
                completados y tus reflexiones. Es tuyo — guárdalo donde
                quieras.
              </p>
            </div>
            <ExportDataButton />
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
            disabled={signingOut}
            className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg border border-line text-ink font-body text-sm hover:bg-bg-alt hover:border-accent/30 disabled:opacity-40 transition-colors w-full sm:w-auto self-start"
          >
            <LogOut size={16} />
            {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      </section>
    </div>
  );
}
