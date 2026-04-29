"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";
import { OAuthButtons } from "../../../components/auth/OAuthButtons";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      setError("No pudimos crear tu cuenta. Intenta con otro email.");
      setLoading(false);
      return;
    }
    setLoading(false);

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setInfo(
      "Revisa tu email para confirmar la cuenta. Si no ves el correo, mira en spam."
    );
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
          ESTOICISMO DIGITAL
        </p>
        <h1 className="font-display text-4xl font-bold text-ink mb-1">
          Crea tu cuenta.
        </h1>
        <p className="font-body text-muted text-sm mb-6">
          Gratis. Sin tarjeta de crédito.
        </p>

        <OAuthButtons />

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            O regístrate con email
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
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
              className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <p role="alert" className="text-danger text-sm font-body">
              {error}
            </p>
          )}

          {info && (
            <p role="status" className="text-accent text-sm font-body">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-lg bg-accent text-bg font-body font-medium text-base hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
          </button>
        </form>

        <p className="text-center font-body text-muted text-sm mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/sign-in" className="text-accent font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
