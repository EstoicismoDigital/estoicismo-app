"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Loader2,
  Heart,
  DollarSign,
  Compass,
  Target,
} from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "../../hooks/useProfile";
import { useUpdateProfile, COMMON_TIMEZONES } from "../../hooks/useUpdateProfile";
import { COMMON_CURRENCIES } from "../../lib/currencies";

/**
 * OnboardingTour · 60-segundos para nuevos usuarios.
 *
 * Aparece como modal full-screen cuando profile.onboarding_completed
 * es false. Lleva al user por 5 pasos cortos:
 *
 *   1. Bienvenida — qué es la app y cómo se usa.
 *   2. Nombre — para personalizar.
 *   3. Moneda — base de todo el módulo de finanzas.
 *   4. Zona horaria — clave para "hoy" y rachas.
 *   5. Filosofía — última tarjeta orientativa antes de soltarles.
 *
 * Diseño:
 *  - No puede cerrarse con ESC ni clicking outside (queremos terminar
 *    el tour). Sí "Saltar" que marca como done.
 *  - Indicador de pasos arriba.
 *  - Botón "Listo" en el último paso marca onboarding_completed=true.
 */

const STEPS = [
  "welcome",
  "name",
  "currency",
  "timezone",
  "ready",
] as const;
type Step = (typeof STEPS)[number];

export function OnboardingTour() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [tz, setTz] = useState("America/Mexico_City");

  useEffect(() => setMounted(true), []);

  // Init valores cuando profile carga
  useEffect(() => {
    if (!profile) return;
    setName(profile.username ?? "");
    setCurrency(profile.default_currency ?? "MXN");
    setTz(
      profile.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone ??
        "America/Mexico_City"
    );
  }, [profile]);

  // Lock scroll mientras el modal esté abierto
  useEffect(() => {
    if (!mounted) return;
    if (!profile || profile.onboarding_completed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, profile]);

  if (!mounted) return null;
  if (!profile) return null;
  if (profile.onboarding_completed) return null;

  const idx = STEPS.indexOf(step);

  function next() {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  }
  function prev() {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  }

  async function finish() {
    // Guardar todo en una sola llamada (incluye onboarding_completed)
    try {
      await update.mutateAsync({
        username: name.trim() || null,
        default_currency: currency,
        timezone: tz,
        onboarding_completed: true,
      });
    } catch {
      /* hook ya muestra error */
    }
  }

  async function skip() {
    try {
      await update.mutateAsync({ onboarding_completed: true });
    } catch {
      /* ignore */
    }
  }

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Tour de bienvenida"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-bg rounded-card border border-line shadow-2xl">
        {/* Skip button */}
        <button
          type="button"
          onClick={skip}
          disabled={update.isPending}
          className="absolute top-3 right-3 text-muted hover:text-ink p-1.5 rounded-full disabled:opacity-40"
          aria-label="Saltar tour"
          title="Saltar — puedes hacer esto después en /ajustes"
        >
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div className="px-6 pt-6 pb-3 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={clsx(
                "h-1 rounded-full transition-all duration-300",
                i < idx
                  ? "w-4 bg-accent"
                  : i === idx
                    ? "w-8 bg-accent"
                    : "w-4 bg-line"
              )}
            />
          ))}
        </div>

        <div className="px-6 sm:px-8 py-4 sm:py-6 min-h-[380px] flex flex-col">
          {step === "welcome" && <WelcomeStep />}
          {step === "name" && <NameStep value={name} onChange={setName} />}
          {step === "currency" && (
            <CurrencyStep value={currency} onChange={setCurrency} />
          )}
          {step === "timezone" && <TimezoneStep value={tz} onChange={setTz} />}
          {step === "ready" && <ReadyStep name={name.trim()} />}
        </div>

        {/* Footer */}
        <div className="border-t border-line px-6 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={idx === 0 || update.isPending}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink disabled:opacity-30 transition-colors"
          >
            <ArrowLeft size={12} />
            Atrás
          </button>

          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Paso {idx + 1} / {STEPS.length}
          </p>

          {step === "ready" ? (
            <button
              type="button"
              onClick={finish}
              disabled={update.isPending}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {update.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              Empezar
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Siguiente
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

// ─── Steps ──────────────────────────────────────────────────

function WelcomeStep() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Bienvenido
        </p>
      </div>
      <h2 className="font-display italic text-3xl text-ink leading-tight">
        Vivir mejor, todos los días.
      </h2>
      <div className="font-body text-sm text-ink/85 leading-relaxed space-y-3">
        <p>
          Esta app es tu sistema operativo personal. Combina cuatro
          módulos que normalmente viven en apps separadas:
        </p>
        <ul className="space-y-2 ml-1">
          <li className="flex items-start gap-2">
            <Target size={14} className="text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-ink">Hábitos</strong> — rachas,
              metas y disciplina diaria.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <DollarSign size={14} className="text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-ink">Finanzas</strong> — gastos,
              ahorro, deudas, inversiones y patrimonio.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Heart size={14} className="text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-ink">Reflexiones</strong> — MPD,
              meditación, gratitud, vision board.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Compass size={14} className="text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-ink">Negocio</strong> — clientes,
              productos, OKRs, time tracking.
            </span>
          </li>
        </ul>
        <p className="text-muted text-xs italic pt-1">
          Todo se conecta en{" "}
          <strong className="text-ink/80 not-italic">/hoy</strong> — tu
          punto de partida cada mañana.
        </p>
      </div>
    </div>
  );
}

function NameStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        ¿Cómo te llamas?
      </p>
      <h2 className="font-display italic text-2xl text-ink leading-tight">
        Para personalizar lo que verás cada día.
      </h2>
      <div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tu nombre"
          autoFocus
          maxLength={40}
          className="w-full h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-lg text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
        />
        <p className="text-[11px] text-muted mt-2">
          Opcional. Lo puedes cambiar en /ajustes.
        </p>
      </div>
    </div>
  );
}

function CurrencyStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Top 6 monedas más usadas en LATAM/USA
  const featured = ["MXN", "USD", "COP", "ARS", "EUR", "BRL"];
  const top = COMMON_CURRENCIES.filter((c) => featured.includes(c.code));
  const rest = COMMON_CURRENCIES.filter((c) => !featured.includes(c.code));

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        Tu moneda
      </p>
      <h2 className="font-display italic text-2xl text-ink leading-tight">
        ¿En qué moneda piensas tu dinero?
      </h2>
      <p className="font-body text-xs text-muted leading-relaxed">
        Se usará por default en transacciones, ventas, ahorros y
        cuentas. Puedes cambiarla en /ajustes después.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {top.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => onChange(c.code)}
            className={clsx(
              "h-12 rounded-lg border font-body text-sm transition-all flex items-center justify-center gap-1.5",
              value === c.code
                ? "border-accent bg-accent/10 text-ink"
                : "border-line text-muted hover:text-ink hover:border-accent/40"
            )}
          >
            <span className="font-mono text-xs">{c.code}</span>
            <span className="text-muted/60 text-xs">{c.symbol}</span>
          </button>
        ))}
      </div>

      <details className="text-[11px]">
        <summary className="text-muted cursor-pointer hover:text-ink">
          Otras monedas…
        </summary>
        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {rest.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => onChange(c.code)}
              className={clsx(
                "h-9 rounded-md border font-mono text-[11px] transition-colors",
                value === c.code
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-line text-muted hover:text-ink"
              )}
            >
              {c.code}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

function TimezoneStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className="space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        Zona horaria
      </p>
      <h2 className="font-display italic text-2xl text-ink leading-tight">
        ¿Desde dónde te conectas?
      </h2>
      <p className="font-body text-xs text-muted leading-relaxed">
        Determina cuándo es "hoy" para los hábitos, las rachas, y los
        recordatorios. Detectamos{" "}
        <span className="text-ink font-mono">{detected}</span> en tu
        navegador.
      </p>
      <div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 px-3 rounded-lg border border-line bg-bg-alt font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
        >
          {COMMON_TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ReadyStep({ name }: { name: string }) {
  return (
    <div className="space-y-5 flex-1 flex flex-col justify-center text-center">
      <div className="text-5xl mb-2">✦</div>
      <h2 className="font-display italic text-3xl text-ink leading-tight">
        {name ? `Listo, ${name}.` : "Listo."}
      </h2>
      <p className="font-body text-sm text-ink/85 leading-relaxed max-w-prose mx-auto">
        Tu primera misión: leer tu MPD cada mañana y cada noche. Si
        aún no lo escribiste, lo armamos juntos en{" "}
        <span className="font-mono text-accent">/reflexiones</span>.
      </p>
      <div className="font-body text-xs text-muted leading-relaxed italic pt-2">
        «Cada nuevo día es una vida en miniatura. Llénalo de propósito
        antes de que el ruido lo llene de cosas.»
      </div>
    </div>
  );
}
