"use client";
import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { clsx } from "clsx";
import { calculatePlates, plateCounts } from "../../lib/fitness/plate-calculator";

/**
 * Plate calculator visual — el user mete el peso target, le decimos
 * qué discos cargar EN CADA LADO de la barra. Dibuja los discos
 * apilados como rectángulos coloreados.
 */
const PLATE_COLORS_KG: Record<number, string> = {
  25: "#DC2626", // rojo
  20: "#2563EB", // azul
  15: "#CA8A04", // amarillo
  10: "#16A34A", // verde
  5: "#FFFFFF",  // blanco (border distinto)
  2.5: "#6B7280",
  1.25: "#9CA3AF",
  1: "#D1D5DB",
  0.5: "#E5E7EB",
};

export function PlateCalculatorCard(props: { defaultUnit?: "kg" | "lbs" }) {
  const [target, setTarget] = useState(60);
  const [barWeight, setBarWeight] = useState(20);
  const unit = props.defaultUnit ?? "kg";

  const result = useMemo(
    () => calculatePlates(target, barWeight, unit),
    [target, barWeight, unit]
  );
  const counts = useMemo(() => plateCounts(result.perSide), [result.perSide]);

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Calculadora de placas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
            Peso total ({unit})
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="2.5"
            min={barWeight}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value) || 0)}
            className="w-full bg-bg border-2 border-line focus:border-accent rounded-lg px-3 py-2 text-2xl font-display italic text-ink focus:outline-none text-center"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
            Barra ({unit})
          </label>
          <select
            value={barWeight}
            onChange={(e) => setBarWeight(Number(e.target.value))}
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
          >
            {unit === "kg" ? (
              <>
                <option value="20">20 (olímpica)</option>
                <option value="15">15 (mujer)</option>
                <option value="10">10 (técnica)</option>
                <option value="7">7 (EZ-bar)</option>
                <option value="0">0 (sin barra)</option>
              </>
            ) : (
              <>
                <option value="45">45 (olímpica)</option>
                <option value="35">35 (mujer)</option>
                <option value="22">22 (técnica)</option>
                <option value="0">0 (sin barra)</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Visualización de la barra con discos */}
      {result.perSide.length > 0 ? (
        <div className="rounded-lg bg-bg/60 border border-line/60 p-4 overflow-x-auto">
          <div className="flex items-center justify-center gap-1 min-w-min">
            {/* Lado izquierdo */}
            <div className="flex items-center gap-0.5 flex-row-reverse">
              {result.perSide.map((p, i) => (
                <PlateBar key={`l-${i}`} weight={p} unit={unit} />
              ))}
            </div>
            {/* Barra */}
            <div className="h-4 w-16 bg-gray-400 rounded-sm shrink-0" />
            {/* Lado derecho */}
            <div className="flex items-center gap-0.5">
              {result.perSide.map((p, i) => (
                <PlateBar key={`r-${i}`} weight={p} unit={unit} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-bg/60 border border-line/60 p-4 text-center text-[12px] text-muted italic">
          Sólo la barra ({barWeight} {unit}).
        </div>
      )}

      {/* Listado de cuántos discos */}
      {counts.size > 0 && (
        <div className="space-y-1 text-[12px]">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
            Por lado
          </p>
          <ul className="space-y-0.5">
            {[...counts.entries()]
              .sort((a, b) => b[0] - a[0])
              .map(([weight, count]) => (
                <li key={weight} className="flex justify-between">
                  <span className="text-ink">
                    <span className="font-mono">{count}×</span>{" "}
                    <span className="font-display italic">{weight}</span>{" "}
                    <span className="text-muted">{unit}</span>
                  </span>
                  <span className="text-muted text-[11px]">
                    = {weight * count} {unit}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between text-[12px] pt-1 border-t border-line/40">
        <span className="text-muted">Total cargado</span>
        <span
          className={clsx(
            "font-display italic text-lg",
            result.exact ? "text-success" : "text-orange-400"
          )}
        >
          {result.achievableWeight} {unit}
          {!result.exact && (
            <span className="text-[10px] text-muted ml-1">
              ({result.delta > 0 ? "+" : ""}
              {result.delta})
            </span>
          )}
        </span>
      </div>
    </section>
  );
}

function PlateBar({ weight, unit }: { weight: number; unit: string }) {
  const color = unit === "kg" ? PLATE_COLORS_KG[weight] ?? "#6B7280" : "#374151";
  // Tamaños proporcionales — más grande = disco más grueso
  const height = Math.min(72, 24 + weight * 1.8);
  const width = weight >= 10 ? 14 : weight >= 5 ? 11 : 8;
  return (
    <div
      className="rounded-sm border border-black/30 flex items-center justify-center text-[8px] font-mono shrink-0"
      style={{
        backgroundColor: color,
        height: `${height}px`,
        width: `${width}px`,
        color: weight === 5 ? "#000" : "#fff",
      }}
      title={`${weight} ${unit}`}
    >
      {weight >= 5 ? weight : ""}
    </div>
  );
}
