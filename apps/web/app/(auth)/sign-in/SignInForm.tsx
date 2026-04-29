"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";
import { OAuthButtons } from "../../../components/auth/OAuthButtons";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      const map: Record<string, string> = {
        missing_code: "El proveedor no devolvió un código válido.",
        exchange_failed: "No pudimos completar el inicio de sesión.",
      };
      setError(map[oauthError] ?? "No pudimos iniciar sesión. Intenta de nuevo.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <OAuthButtons />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          O continúa con email
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

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

        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className="font-mono text-xs uppercase tracking-widest text-muted"
          >
            CONTRASEÑA
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            required
            autoComplete="current-password"
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
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>

        <p className="text-center font-body text-muted text-sm">
          <Link
            href="/forgot-password"
            className="text-muted hover:text-ink hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </form>
    </>
  );
}
