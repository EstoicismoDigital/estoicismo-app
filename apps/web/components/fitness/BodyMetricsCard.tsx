"use client";
import { useEffect, useMemo, useState } from "react";
import { Ruler, Save } from "lucide-react";
import { clsx } from "clsx";
import { useBodyMetrics, useUpsertBodyMetric } from "../../hooks/useBodyMetrics";
import type { FitnessBodyMetric } from "@estoicismo/supabase";

/**
 * Body Measurements card — entrada rápida de medidas corporales
 * (cintura, pecho, brazos, etc) + pequeño histórico inline mostrando
 * el delta vs primera medición.
 *
 * Inputs auto-save con dirty flag (similar a MetricsTodayCard).
 */
export function BodyMetricsCard() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: metrics = [] } = useBodyMetrics({ limit: 90 });
  const upsertM = useUpsertBodyMetric();

  const todayMetric = metrics.find((m) => m.occurred_on === today);

  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arm, setArm] = useState("");
  const [thigh, setThigh] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setChest(todayMetric?.chest_cm !== null && todayMetric?.chest_cm !== undefined ? String(todayMetric.chest_cm) : "");
    setWaist(todayMetric?.waist_cm !== null && todayMetric?.waist_cm !== undefined ? String(todayMetric.waist_cm) : "");
    setHips(todayMetric?.hips_cm !== null && todayMetric?.hips_cm !== undefined ? String(todayMetric.hips_cm) : "");
    setArm(todayMetric?.arm_cm !== null && todayMetric?.arm_cm !== undefined ? String(todayMetric.arm_cm) : "");
    setThigh(todayMetric?.thigh_cm !== null && todayMetric?.thigh_cm !== undefined ? String(todayMetric.thigh_cm) : "");
    setBodyFat(todayMetric?.body_fat_pct !== null && todayMetric?.body_fat_pct !== undefined ? String(todayMetric.body_fat_pct) : "");
    setDirty(false);
  }, [todayMetric]);

  // Para deltas: el primer registro vs el actual.
  const first = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  function save() {
    upsertM.mutate({
      occurred_on: today,
      chest_cm: chest === "" ? null : Number(chest),
      waist_cm: waist === "" ? null : Number(waist),
      hips_cm: hips === "" ? null : Number(hips),
      arm_cm: arm === "" ? null : Number(arm),
      thigh_cm: thigh === "" ? null : Number(thigh),
      body_fat_pct: bodyFat === "" ? null : Number(bodyFat),
    });
    setDirty(false);
  }

  const fields: { label: string; value: string; setter: (v: string) => void; firstKey: keyof FitnessBodyMetric; unit: string }[] = [
    { label: "Pecho", value: chest, setter: setChest, firstKey: "chest_cm", unit: "cm" },
    { label: "Cintura", value: waist, setter: setWaist, firstKey: "waist_cm", unit: "cm" },
    { label: "Cadera", value: hips, setter: setHips, firstKey: "hips_cm", unit: "cm" },
    { label: "Brazo", value: arm, setter: setArm, firstKey: "arm_cm", unit: "cm" },
    { label: "Muslo", value: thigh, setter: setThigh, firstKey: "thigh_cm", unit: "cm" },
    { label: "% Graso", value: bodyFat, setter: setBodyFat, firstKey: "body_fat_pct", unit: "%" },
  ];

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted inline-flex items-center gap-1.5">
          <Ruler size={12} className="text-accent" />
          Medidas corporales
        </p>
        {dirty && (
          <button
            type="button"
            onClick={save}
            disabled={upsertM.isPending}
            className="px-3 py-1 rounded bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1"
          >
            <Save size={11} /> Guardar
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {fields.map((f) => {
          const cur = f.value !== "" ? Number(f.value) : null;
          const firstVal = first ? (first[f.firstKey] as number | null) : null;
          const delta = cur !== null && firstVal !== null ? cur - firstVal : null;
          return (
            <label
              key={f.label}
              className="rounded-lg border border-line bg-bg p-2.5 flex flex-col gap-1 cursor-text focus-within:border-accent transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {f.label}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={f.value}
                onChange={(e) => {
                  f.setter(e.target.value);
                  setDirty(true);
                }}
                placeholder="—"
                className="bg-transparent text-ink text-base font-semibold focus:outline-none placeholder:text-muted/60 w-full"
              />
              {delta !== null && Math.abs(delta) > 0.05 && (
                <span
                  className={clsx(
                    "text-[10px] font-mono",
                    delta > 0 ? "text-orange-400" : "text-success"
                  )}
                >
                  {delta > 0 ? "+" : ""}
                  {Math.round(delta * 10) / 10}
                  {f.unit}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {metrics.length > 0 && first && (
        <p className="text-[10px] text-muted italic">
          Comparado con tu primera medición ({new Date(first.occurred_on + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })})
        </p>
      )}
    </section>
  );
}
