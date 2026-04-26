"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type {
  FitnessUserProfile,
  FitnessGoal,
  FitnessSex,
  FitnessExperience,
  UpsertFitnessProfileInput,
} from "@estoicismo/supabase";

const GOALS: { key: FitnessGoal; label: string; desc: string }[] = [
  { key: "fuerza", label: "Fuerza", desc: "Subir peso, reps bajas." },
  { key: "hipertrofia", label: "Hipertrofia", desc: "Volumen muscular." },
  { key: "resistencia", label: "Resistencia", desc: "Cardio y aguante." },
  { key: "salud", label: "Salud", desc: "Movilidad y calidad de vida." },
];

const LEVELS: { key: FitnessExperience; label: string }[] = [
  { key: "principiante", label: "Principiante" },
  { key: "intermedio", label: "Intermedio" },
  { key: "avanzado", label: "Avanzado" },
];

export function ProfileSetupModal(props: {
  open: boolean;
  profile: FitnessUserProfile | null;
  onClose: () => void;
  onSave: (input: UpsertFitnessProfileInput) => Promise<void> | void;
}) {
  const { open, profile, onClose, onSave } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [bodyweight, setBodyweight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [targetWeight, setTargetWeight] = useState<string>("");
  const [goal, setGoal] = useState<FitnessGoal>("fuerza");
  const [goalText, setGoalText] = useState<string>("");
  const [weeklyDays, setWeeklyDays] = useState<number>(3);
  const [experience, setExperience] = useState<FitnessExperience>("principiante");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [sex, setSex] = useState<FitnessSex | null>(null);
  const [birthYear, setBirthYear] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setBodyweight(profile?.bodyweight_kg ? String(profile.bodyweight_kg) : "");
    setHeight(profile?.height_cm ? String(profile.height_cm) : "");
    setTargetWeight(profile?.target_weight_kg ? String(profile.target_weight_kg) : "");
    setGoal(profile?.goal ?? "fuerza");
    setGoalText(profile?.goal_text ?? "");
    setWeeklyDays(profile?.weekly_target_days ?? 3);
    setExperience(profile?.experience_level ?? "principiante");
    setUnit(profile?.unit_system ?? "metric");
    setSex(profile?.sex ?? null);
    setBirthYear(profile?.birth_year ? String(profile.birth_year) : "");
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between z-10">
          <h2 className="font-display italic text-lg text-ink">Mi perfil de fitness</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Cuerpo */}
          <Section title="Datos del cuerpo">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Peso" unit="kg" value={bodyweight} setValue={setBodyweight} step="0.1" />
              <Input label="Altura" unit="cm" value={height} setValue={setHeight} />
              <Input label="Año nacimiento" value={birthYear} setValue={setBirthYear} />
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                  Sexo
                </label>
                <select
                  value={sex ?? ""}
                  onChange={(e) => setSex((e.target.value as FitnessSex) || null)}
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
                >
                  <option value="">—</option>
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Objetivo */}
          <Section title="Objetivo">
            <div className="grid grid-cols-2 gap-1.5">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGoal(g.key)}
                  className={clsx(
                    "px-3 py-2 rounded-lg border text-left",
                    goal === g.key
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  <p className="text-sm font-semibold">{g.label}</p>
                  <p className="text-[10px] text-muted">{g.desc}</p>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Tu meta en una frase
              </label>
              <input
                type="text"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="Squat 2× mi peso · Bajar 5 kg · Correr 10K…"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div className="mt-3">
              <Input
                label="Peso meta (opcional)"
                unit="kg"
                value={targetWeight}
                setValue={setTargetWeight}
                step="0.5"
              />
            </div>
          </Section>

          {/* Frecuencia */}
          <Section title={`Frecuencia · ${weeklyDays}d/semana`}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setWeeklyDays(n)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-semibold",
                    weeklyDays === n
                      ? "bg-accent text-bg"
                      : "bg-bg border border-line text-muted hover:text-ink"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </Section>

          {/* Experiencia */}
          <Section title="Nivel">
            <div className="grid grid-cols-3 gap-1.5">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.key}
                  type="button"
                  onClick={() => setExperience(lvl.key)}
                  className={clsx(
                    "py-2 rounded-lg border text-sm",
                    experience === lvl.key
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line text-muted hover:text-ink"
                  )}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Unidades */}
          <Section title="Unidades">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setUnit("metric")}
                className={clsx(
                  "py-2 rounded-lg border text-sm",
                  unit === "metric"
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-line text-muted hover:text-ink"
                )}
              >
                Métrico (kg)
              </button>
              <button
                type="button"
                onClick={() => setUnit("imperial")}
                className={clsx(
                  "py-2 rounded-lg border text-sm",
                  unit === "imperial"
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-line text-muted hover:text-ink"
                )}
              >
                Imperial (lbs)
              </button>
            </div>
          </Section>
        </div>
        <div className="border-t border-line px-5 py-3 flex justify-end gap-2 sticky bottom-0 bg-bg-alt/95">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={async () => {
              await onSave({
                bodyweight_kg: bodyweight ? Number(bodyweight) : null,
                height_cm: height ? Number(height) : null,
                target_weight_kg: targetWeight ? Number(targetWeight) : null,
                goal,
                goal_text: goalText.trim() || null,
                weekly_target_days: weeklyDays,
                experience_level: experience,
                unit_system: unit,
                sex,
                birth_year: birthYear ? Number(birthYear) : null,
              });
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">{title}</p>
      {children}
    </div>
  );
}

function Input(props: {
  label: string;
  unit?: string;
  value: string;
  setValue: (v: string) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
        {props.label}
      </label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step={props.step ?? "1"}
          value={props.value}
          onChange={(e) => props.setValue(e.target.value)}
          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
        />
        {props.unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted">
            {props.unit}
          </span>
        )}
      </div>
    </div>
  );
}
