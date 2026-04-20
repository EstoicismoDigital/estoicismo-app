"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
          ESTOICISMO DIGITAL
        </p>
        <h1 className="font-display text-4xl font-bold text-ink mb-1">
          Bienvenido de vuelta.
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
            className="h-12 rounded-lg bg-accent text-white font-body font-medium text-base hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <p className="text-center font-body text-muted text-sm">
            ¿No tienes cuenta?{" "}
            <Link href="/sign-up" className="text-accent font-medium hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
