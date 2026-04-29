"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";

type Provider = "google" | "apple";

export function OAuthButtons({ next }: { next?: string }) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: Provider) {
    setError(null);
    setLoading(provider);
    const supabase = getSupabaseBrowserClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams:
          provider === "google"
            ? { access_type: "offline", prompt: "consent" }
            : undefined,
      },
    });

    if (error) {
      setError(`No pudimos iniciar con ${provider === "google" ? "Google" : "Apple"}.`);
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => signInWith("google")}
        disabled={loading !== null}
        className="h-12 rounded-lg border border-line bg-bg-alt text-ink font-body font-medium text-base flex items-center justify-center gap-3 hover:bg-bg transition-colors disabled:opacity-40"
      >
        <GoogleIcon />
        {loading === "google" ? "Conectando…" : "Continuar con Google"}
      </button>

      <button
        type="button"
        onClick={() => signInWith("apple")}
        disabled={loading !== null}
        className="h-12 rounded-lg border border-line bg-ink text-bg font-body font-medium text-base flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        <AppleIcon />
        {loading === "apple" ? "Conectando…" : "Continuar con Apple"}
      </button>

      {error && (
        <p role="alert" className="text-danger text-sm font-body text-center">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}
