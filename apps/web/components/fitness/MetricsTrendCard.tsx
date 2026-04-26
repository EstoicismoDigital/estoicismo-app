"use client";
import { useMemo } from "react";
import type { FitnessMetric } from "@estoicismo/supabase";

/**
 * Sparkline simple en SVG para mostrar tendencia 30d de peso/sueño/cal.
 * Sin chart library — overhead 0.
 */
export function MetricsTrendCard(props: { metrics: FitnessMetric[] }) {
  const { metrics } = props;

  const dataset = useMemo(() => {
    // Ordenamos ascendente por fecha
    const sorted = [...metrics].sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
    return sorted;
  }, [metrics]);

  if (dataset.length < 2) {
    return (
      <section className="rounded-card border border-line bg-bg-alt/40 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
          Tendencias
        </p>
        <h2 className="font-display italic text-lg text-ink mb-2">
          La gráfica aparece con la repetición.
        </h2>
        <p className="text-sm text-muted">
          Registra al menos 2 días de métricas para ver la tendencia.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-5 space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
          Tendencias últimos {dataset.length} días
        </p>
        <h2 className="font-display italic text-lg text-ink">
          Lo que se mide, mejora.
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Sparkline
          label="Peso"
          unit="kg"
          color="#0D9488"
          values={dataset.map((m) => m.weight_kg ?? null)}
        />
        <Sparkline
          label="Sueño"
          unit="h"
          color="#7C3AED"
          values={dataset.map((m) => m.sleep_hours ?? null)}
        />
        <Sparkline
          label="Calorías"
          unit="kcal"
          color="#EA580C"
          values={dataset.map((m) => m.calories_intake ?? null)}
        />
      </div>
    </section>
  );
}

function Sparkline(props: {
  label: string;
  unit: string;
  color: string;
  values: (number | null)[];
}) {
  const { label, unit, color, values } = props;

  // Filtramos nulls para dibujar — pero respetamos posición (gaps).
  const cleanPoints = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v !== null && Number.isFinite(p.v));

  if (cleanPoints.length < 2) {
    return (
      <div className="rounded-lg border border-line/60 bg-bg/40 p-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">
          {label}
        </p>
        <p className="text-sm text-muted">Sin datos suficientes.</p>
      </div>
    );
  }

  const min = Math.min(...cleanPoints.map((p) => p.v));
  const max = Math.max(...cleanPoints.map((p) => p.v));
  const range = max - min || 1;
  const W = 100; // viewBox width
  const H = 32;
  const stepX = W / Math.max(1, values.length - 1);

  const points = cleanPoints.map((p) => {
    const x = p.i * stepX;
    const y = H - ((p.v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  });

  const last = cleanPoints[cleanPoints.length - 1];
  const first = cleanPoints[0];
  const delta = last.v - first.v;
  const deltaPct = first.v !== 0 ? (delta / first.v) * 100 : 0;
  const deltaSign = delta > 0 ? "+" : delta < 0 ? "" : "±";

  return (
    <div className="rounded-lg border border-line/60 bg-bg/40 p-3">
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {label}
        </p>
        <span
          className="text-[10px] font-mono"
          style={{ color: delta === 0 ? "var(--color-muted)" : color }}
        >
          {deltaSign}
          {Math.round(delta * 10) / 10}
          {unit} ({deltaSign}
          {Math.round(deltaPct * 10) / 10}%)
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10" preserveAspectRatio="none">
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={last.i * stepX} cy={H - ((last.v - min) / range) * (H - 4) - 2} r={1.6} fill={color} />
      </svg>
      <p className="text-base font-display italic text-ink mt-1">
        {Math.round(last.v * 10) / 10}
        <span className="text-[11px] text-muted ml-1">{unit}</span>
      </p>
    </div>
  );
}
