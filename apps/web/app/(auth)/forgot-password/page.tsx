"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: origin ? `${origin}/reset-password` : undefined,
    });
    if (error) {
      setError("No pudimos enviar el email. Verifica la dirección.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
          RECUPERAR ACCESO
        </p>

        {sent ? (
          <>
            <h1 className="font-display text-4xl font-bold text-ink mb-2">
              Revisa tu email.
            </h1>
            <p className="font-body text-muted text-sm mb-8">
              Enviamos instrucciones a <span className="text-ink font-medium">{email}</span>.
              Puede tardar un par de minutos.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center min-h-[44px] h-12 px-6 rounded-lg border border-line text-ink font-body font-medium text-base hover:bg-bg-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Volver a inicio de sesión
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl font-bold text-ink mb-2">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="font-body text-muted text-sm mb-8">
              Te enviaremos un link para restablecerla.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="font-mono text-xs uppercase tracking-widest text-muted"
                >
                  EMAIL
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {error && (
                <p role="alert" className="text-danger text-sm font-body">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-lg bg-accent text-bg font-body font-medium text-base hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {loading ? "Enviando..." : "Enviar instrucciones"}
              </button>

              <p className="text-center font-body text-muted text-sm">
                <Link href="/sign-in" className="text-accent font-medium hover:underline">
                  Volver a inicio de sesión
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
