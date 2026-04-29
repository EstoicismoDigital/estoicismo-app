"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";

type Step = "enter-phone" | "enter-code";

export function PhoneAuth({ next = "/" }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("enter-phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function normalizePhone(raw: string): string {
    const trimmed = raw.replace(/\s+/g, "");
    return trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/^0+/, "")}`;
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = normalizePhone(phone);
    if (!/^\+\d{8,15}$/.test(normalized)) {
      setError("Número inválido. Incluye código de país (ej: +57 300 000 0000).");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    setLoading(false);

    if (error) {
      setError("No pudimos enviar el código. Verifica el número.");
      return;
    }
    setPhone(normalized);
    setStep("enter-code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("El código tiene 6 dígitos.");
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });
    setLoading(false);

    if (error) {
      setError("Código incorrecto o expirado.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  if (step === "enter-code") {
    return (
      <form onSubmit={verifyCode} className="flex flex-col gap-4">
        <p className="font-body text-muted text-sm">
          Enviamos un código a <span className="text-ink font-medium">{phone}</span>.
        </p>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="otp"
            className="font-mono text-xs uppercase tracking-widest text-muted"
          >
            CÓDIGO DE 6 DÍGITOS
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            required
            autoComplete="one-time-code"
            className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-mono text-lg tracking-widest text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
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
          {loading ? "Verificando…" : "Verificar y entrar"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("enter-phone");
            setCode("");
            setError(null);
          }}
          className="text-center font-body text-muted text-sm hover:text-ink hover:underline"
        >
          Cambiar número
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="phone"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          NÚMERO DE TELÉFONO
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+57 300 000 0000"
          required
          autoComplete="tel"
          className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="font-body text-muted text-xs mt-1">
          Incluye el código de país. Te enviamos un SMS con un código de 6 dígitos.
        </p>
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
        {loading ? "Enviando código…" : "Enviar código"}
      </button>
    </form>
  );
}
