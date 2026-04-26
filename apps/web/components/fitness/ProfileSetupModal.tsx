"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { FitnessUserProfile, FitnessGoal, FitnessSex } from "@estoicismo/supabase";

const GOALS: { key: FitnessGoal; label: string; desc: string }[] = [
  { key: "fuerza", label: "Fuerza", desc: "Subir peso, repeticiones bajas, intensidad alta." },
  { key: "hipertrofia", label: "Hipertrofia", desc: "Volumen, músculo, repeticiones medias." },
  { key: "resistencia", label: "Resistencia", desc: "Cardio, aguante, capacidad aeróbica." },
  { key: "salud", label: "Salud", desc: "Constancia, movilidad, calidad de vida." },
];

export function ProfileSetupModal(props: {
  open: boolean;
  profile: FitnessUserProfile | null;
  onClose: () => void;
  onSave: (input: {
    bodyweight_kg: number | null;
    goal: FitnessGoal;
    unit_system: "metric" | "imperial";
    sex: FitnessSex | null;
    birth_year: number | null;
  }) => Promise<void> | void;
}) {
  const { open, profile, onClose, onSave } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [bodyweight, setBodyweight] = useState<string>(
    profile?.bodyweight_kg !== null && profile?.bodyweight_kg !== undefined
      ? String(profile.bodyweight_kg)
      : ""
  );
  const [goal, setGoal] = useState<FitnessGoal>(profile?.goal ?? "fuerza");
  const [unit, setUnit] = useState<"metric" | "imperial">(profile?.unit_system ?? "metric");
  const [sex, setSex] = useState<FitnessSex | null>(profile?.sex ?? null);
  const [birthYear, setBirthYear] = useState<string>(
    profile?.birth_year ? String(profile.birth_year) : ""
  );

  useEffect(() => {
    if (!open) return;
    setBodyweight(
      profile?.bodyweight_kg !== null && profile?.bodyweight_kg !== undefined
        ? String(profile.bodyweight_kg)
        : ""
    );
    setGoal(profile?.goal ?? "fuerza");
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
      <div className="w-full sm:max-w-md bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">Tu perfil de fitness</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Peso corporal (kg)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
              placeholder="80"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
            <p className="text-[10px] text-muted mt-1">
              Necesario para calcular niveles relativos a tu peso.
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
              Objetivo
            </label>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGoal(g.key)}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                    goal === g.key
                      ? "border-accent bg-accent/10"
                      : "border-line hover:bg-line/20"
                  )}
                >
                  <p className="text-sm font-semibold text-ink">{g.label}</p>
                  <p className="text-[11px] text-muted">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Sexo (opcional)
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
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Año de nacimiento
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1900"
                max="2100"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="1990"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Sistema de unidades
            </label>
            <div className="grid grid-cols-2 gap-2">
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
          </div>
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
                bodyweight_kg: bodyweight === "" ? null : Number(bodyweight),
                goal,
                unit_system: unit,
                sex,
                birth_year: birthYear === "" ? null : Number(birthYear),
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
