"use client";

import { useState } from "react";

type Plan = "monthly" | "annual";

const FEATURES = [
  "Hábitos ilimitados",
  "Streak freezes (3 por mes)",
  "Estadísticas avanzadas",
  "Soporte prioritario",
];

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="flex-shrink-0"
    >
      <path
        d="M4 10.5L8 14.5L16 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PricingCards() {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(plan: Plan) {
    setError(null);
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        setError("No pudimos iniciar el checkout. Intenta de nuevo.");
        setLoadingPlan(null);
        return;
      }

      const data: { url?: string } = await res.json();
      if (!data.url) {
        setError("No pudimos iniciar el checkout. Intenta de nuevo.");
        setLoadingPlan(null);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("No pudimos iniciar el checkout. Intenta de nuevo.");
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly */}
        <div className="rounded-card border border-line bg-bg p-6 sm:p-8 flex flex-col">
          <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">
            MENSUAL
          </p>
          <p className="font-display text-3xl font-bold text-ink mb-1">
            $4.99 USD
            <span className="font-body text-base font-normal text-muted"> / mes</span>
          </p>
          <p className="font-body text-sm text-muted mb-6">
            Facturación mensual
          </p>

          <ul className="flex flex-col gap-3 mb-8">
            {FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 font-body text-sm text-ink"
              >
                <span className="text-accent mt-0.5">
                  <CheckIcon />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => handleCheckout("monthly")}
            disabled={loadingPlan !== null}
            className="mt-auto min-h-[44px] h-12 rounded-lg border border-accent text-accent font-body font-medium text-base hover:bg-accent hover:text-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-40 transition-colors"
          >
            {loadingPlan === "monthly"
              ? "Redirigiendo..."
              : "Suscribirme mensual"}
          </button>
        </div>

        {/* Annual — recommended */}
        <div className="relative rounded-card bg-accent text-bg p-6 sm:p-8 flex flex-col shadow-lg">
          <div className="flex items-start justify-between mb-2">
            <p className="font-mono text-xs uppercase tracking-widest text-white/80">
              ANUAL
            </p>
            <span className="font-mono text-xs uppercase tracking-widest bg-white text-accent px-2 py-1 rounded">
              Ahorra 33%
            </span>
          </div>
          <p className="font-display text-3xl font-bold mb-1">
            $39.99 USD
            <span className="font-body text-base font-normal text-white/80">
              {" "}
              / año
            </span>
          </p>
          <p className="font-body text-sm text-white/80 mb-6">
            Equivale a $3.33 USD / mes
          </p>

          <ul className="flex flex-col gap-3 mb-8">
            {FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 font-body text-sm text-white"
              >
                <span className="mt-0.5">
                  <CheckIcon />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => handleCheckout("annual")}
            disabled={loadingPlan !== null}
            className="mt-auto min-h-[44px] h-12 rounded-lg bg-white text-accent font-body font-medium text-base hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-accent disabled:opacity-40 transition-opacity"
          >
            {loadingPlan === "annual"
              ? "Redirigiendo..."
              : "Suscribirme anual"}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 text-center text-danger text-sm font-body"
        >
          {error}
        </p>
      )}
    </div>
  );
}
