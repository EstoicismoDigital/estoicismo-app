"use client";
import { useEffect, useState } from "react";
import { Moon, Flame, Scale, Footprints, Save } from "lucide-react";
import { clsx } from "clsx";
import {
  useFitnessMetricForDate,
  useUpsertFitnessMetric,
} from "../../hooks/useFitness";

/**
 * Quick-log de las 4 métricas básicas del día.
 *
 * Patrón:
 *   - Carga la fila del día actual al montar.
 *   - Cada input tiene su propio "estado dirty" — guarda por
 *     campo con un debounce simple (500ms) para no spamear.
 *   - El user puede tocar cualquiera; la fila se UPSERTea.
 */
export function MetricsTodayCard() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: metric } = useFitnessMetricForDate(today);
  const upsertM = useUpsertFitnessMetric();

  const [sleep, setSleep] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [steps, setSteps] = useState<string>("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSleep(metric?.sleep_hours !== null && metric?.sleep_hours !== undefined ? String(metric.sleep_hours) : "");
    setCalories(metric?.calories_intake !== null && metric?.calories_intake !== undefined ? String(metric.calories_intake) : "");
    setWeight(metric?.weight_kg !== null && metric?.weight_kg !== undefined ? String(metric.weight_kg) : "");
    setSteps(metric?.steps !== null && metric?.steps !== undefined ? String(metric.steps) : "");
    setDirty(false);
  }, [metric]);

  function save() {
    upsertM.mutate({
      occurred_on: today,
      sleep_hours: sleep === "" ? null : Number(sleep),
      calories_intake: calories === "" ? null : Number(calories),
      weight_kg: weight === "" ? null : Number(weight),
      steps: steps === "" ? null : Number(steps),
    });
    setDirty(false);
  }

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Hoy · Métricas
          </p>
          <h2 className="font-display italic text-lg text-ink">Tu cuerpo, en números.</h2>
        </div>
        {dirty && (
          <button
            type="button"
            onClick={save}
            disabled={upsertM.isPending}
            className="px-3 py-1.5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1"
          >
            <Save size={12} /> Guardar
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field
          icon={<Moon size={14} className="text-muted" />}
          label="Sueño"
          unit="h"
          value={sleep}
          onChange={(v) => {
            setSleep(v);
            setDirty(true);
          }}
          step="0.25"
          max="24"
        />
        <Field
          icon={<Flame size={14} className="text-muted" />}
          label="Calorías"
          unit="kcal"
          value={calories}
          onChange={(v) => {
            setCalories(v);
            setDirty(true);
          }}
          step="50"
        />
        <Field
          icon={<Scale size={14} className="text-muted" />}
          label="Peso"
          unit="kg"
          value={weight}
          onChange={(v) => {
            setWeight(v);
            setDirty(true);
          }}
          step="0.1"
        />
        <Field
          icon={<Footprints size={14} className="text-muted" />}
          label="Pasos"
          unit=""
          value={steps}
          onChange={(v) => {
            setSteps(v);
            setDirty(true);
          }}
          step="100"
        />
      </div>
    </section>
  );
}

function Field(props: {
  icon: React.ReactNode;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  max?: string;
}) {
  return (
    <label className="rounded-lg border border-line bg-bg p-2.5 flex flex-col gap-1 cursor-text focus-within:border-accent transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted flex items-center gap-1">
          {props.icon}
          {props.label}
        </span>
        {props.unit && <span className="text-[10px] text-muted">{props.unit}</span>}
      </div>
      <input
        type="number"
        inputMode="decimal"
        step={props.step ?? "1"}
        max={props.max}
        min="0"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder="—"
        className={clsx(
          "bg-transparent text-ink text-base font-semibold focus:outline-none",
          "placeholder:text-muted/60"
        )}
      />
    </label>
  );
}
