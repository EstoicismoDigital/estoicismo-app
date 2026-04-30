"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useLastActiveDay } from "../../hooks/useLastActiveDay";
import { getRecoveryPrompt } from "../../lib/journal/prompts";

/**
 * RecoveryBanner — se muestra cuando el user vuelve después de ≥3
 * días sin abrir la app. Tono SIN GUILT (siguiendo patrones de
 * Habitual, Holy Habits, Atoms): no menciona días perdidos, no
 * pide explicación, redirige al presente.
 *
 * Microcopy basado en research de apps anti-guilt:
 *   - "Volviste. Eso ya es práctica estoica."
 *   - "Lo que hiciste o no hiciste no te define."
 *   - "Hoy no hace falta ponerse al día."
 *
 * El user puede dismiss (sessionStorage para no rebote en navegación)
 * o saltar directo al journaling. NUNCA bloquea la app.
 */
const DISMISS_KEY = "recovery-banner-dismissed";

function isDismissedThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function markDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* storage bloqueado, no pasa nada */
  }
}

export function RecoveryBanner() {
  const { data } = useLastActiveDay();
  const [dismissed, setDismissed] = useState(() => isDismissedThisSession());

  const daysSince = data?.daysSince ?? 0;
  // Solo mostrar si vuelve después de 3+ días Y no lo cerró ya en la sesión
  const shouldShow = !dismissed && daysSince >= 3 && data?.lastDate != null;

  if (!shouldShow) return null;

  // Mensajes graduados por tiempo de ausencia
  const headline =
    daysSince <= 7
      ? "Volviste."
      : daysSince <= 30
        ? "Te estábamos esperando."
        : "Bienvenido de vuelta.";

  const subtitle =
    daysSince <= 7
      ? "Eso ya es práctica estoica. No hace falta ponerte al día."
      : daysSince <= 30
        ? "Lo que hiciste o no hiciste no te define. Hoy es lo único que tienes."
        : "Empezamos suave. Cero presión.";

  const prompt = getRecoveryPrompt();

  function handleDismiss() {
    markDismissed();
    setDismissed(true);
  }

  return (
    <section
      role="region"
      aria-label="Mensaje de bienvenida"
      className="rounded-card border border-accent/20 bg-accent/5 p-5 sm:p-6 relative"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar mensaje"
        className="absolute top-3 right-3 text-muted hover:text-ink transition-colors"
      >
        <X size={16} aria-hidden />
      </button>

      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
        REGRESO
      </p>
      <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight mb-2">
        {headline}
      </h2>
      <p className="font-body text-sm text-ink/80 leading-relaxed mb-4 max-w-prose">
        {subtitle}
      </p>

      <div className="rounded-lg border border-line bg-bg p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1.5">
          UNA PREGUNTA, NADA MÁS
        </p>
        <p className="font-body text-base text-ink leading-relaxed">
          {prompt.text}
        </p>
      </div>
    </section>
  );
}
