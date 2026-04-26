"use client";
import { useMemo } from "react";
import { Sparkles, Flame, Calendar, Target, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import type { FitnessUserProfile, FitnessExercise } from "@estoicismo/supabase";
import {
  computeBMI,
  computeBMR,
  computeTDEE,
  calorieTarget,
  activityFromWeeklyDays,
  ageFromBirthYear,
} from "../../lib/fitness/health-calc";
import { suggestSplit, REP_RANGE_BY_GOAL, recoveryTip } from "../../lib/fitness/templates";

/**
 * Card de "tu plan" — cruza el perfil del user con los datos
 * técnicos para entregar una recomendación personalizada en
 * tiempo real. Sin librerías externas, todo computado en cliente.
 *
 * Muestra:
 *  - BMI + categoría + rango saludable
 *  - TDEE estimado + calorías sugeridas según objetivo
 *  - Split sugerido (full body / upper-lower / PPL)
 *  - Rep range del goal
 *  - Tip de recuperación
 */
export function PersonalizedPlanCard(props: {
  profile: FitnessUserProfile;
  exercises: FitnessExercise[];
}) {
  const { profile, exercises } = props;

  const age = ageFromBirthYear(profile.birth_year);
  const bmi = useMemo(
    () =>
      profile.bodyweight_kg && profile.height_cm
        ? computeBMI(profile.bodyweight_kg, profile.height_cm)
        : null,
    [profile.bodyweight_kg, profile.height_cm]
  );

  const bmr = useMemo(
    () =>
      profile.bodyweight_kg && profile.height_cm && age
        ? computeBMR({
            weightKg: profile.bodyweight_kg,
            heightCm: profile.height_cm,
            age,
            sex: profile.sex,
          })
        : null,
    [profile.bodyweight_kg, profile.height_cm, age, profile.sex]
  );

  const activity = activityFromWeeklyDays(profile.weekly_target_days);
  const tdee = computeTDEE(bmr, activity);

  // Determinar dirección calórica según target_weight vs current.
  const calorieGoal: "bajar" | "mantener" | "subir" = useMemo(() => {
    if (!profile.target_weight_kg || !profile.bodyweight_kg) return "mantener";
    const diff = profile.target_weight_kg - profile.bodyweight_kg;
    if (Math.abs(diff) < 1) return "mantener";
    return diff < 0 ? "bajar" : "subir";
  }, [profile.target_weight_kg, profile.bodyweight_kg]);

  const targetCals = calorieTarget(tdee, calorieGoal);
  const split = suggestSplit(profile.weekly_target_days);
  const repRange = REP_RANGE_BY_GOAL[profile.goal];
  const tip = recoveryTip(profile.weekly_target_days);

  return (
    <section className="rounded-card border border-accent/30 bg-gradient-to-br from-accent/5 via-transparent to-accent/5 p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Tu plan personalizado
        </p>
      </div>

      {profile.goal_text && (
        <blockquote className="border-l-2 border-accent/40 pl-3 py-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-0.5">
            Tu meta
          </p>
          <p className="font-display italic text-lg text-ink leading-snug">
            "{profile.goal_text}"
          </p>
        </blockquote>
      )}

      {/* Métricas calculadas */}
      <div className="grid grid-cols-2 gap-3">
        {bmi && (
          <Stat
            label="BMI"
            value={bmi.bmi.toFixed(1)}
            sub={bmi.label}
            color={bmi.color}
          />
        )}
        {tdee && (
          <Stat
            label="Calorías sugeridas"
            value={`${targetCals}`}
            sub={
              calorieGoal === "bajar"
                ? "para bajar peso"
                : calorieGoal === "subir"
                ? "para ganar peso"
                : "para mantener"
            }
            color="#CA8A04"
          />
        )}
      </div>

      {bmi && (
        <div className="text-[11px] text-muted text-center italic">
          Peso saludable según OMS: {bmi.healthyRangeKg.min}–{bmi.healthyRangeKg.max} kg
        </div>
      )}

      {/* Split sugerido */}
      {split && (
        <div className="rounded-lg border border-line bg-bg/40 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-accent" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Split sugerido · {profile.weekly_target_days}d/semana
              </p>
            </div>
            <p className="text-[10px] font-mono text-accent">{split.daysPerWeek}d</p>
          </div>
          <p className="font-display italic text-lg text-ink">{split.name}</p>
          <p className="text-[12px] text-muted leading-snug">{split.description}</p>
          <details className="group">
            <summary className="cursor-pointer text-[10px] font-mono uppercase tracking-widest text-accent hover:text-ink inline-flex items-center gap-1">
              Ver días <ChevronDown size={10} className="group-open:rotate-180 transition-transform" />
            </summary>
            <ul className="space-y-1.5 mt-2">
              {split.days.map((day) => (
                <li key={day.name} className="text-[12px]">
                  <p className="font-semibold text-ink">{day.name}</p>
                  <p className="text-muted text-[11px] italic">{day.focus}</p>
                  <p className="text-[10px] text-muted/80 mt-0.5 font-mono">
                    {day.exercises
                      .map((slug) => exercises.find((e) => e.slug === slug)?.name ?? slug)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Rep range por goal */}
      <div className="rounded-lg border border-line bg-bg/40 p-4 space-y-2">
        <div className="flex items-center gap-1.5">
          <Target size={13} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Rangos para {profile.goal}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <RepRangeStat label="Reps" value={repRange.reps} />
          <RepRangeStat label="Sets" value={repRange.sets} />
          <RepRangeStat label="Descanso" value={repRange.rest} />
          <RepRangeStat label="RPE" value={repRange.rpe} />
        </div>
        <p className="text-[11px] text-muted leading-snug italic">{repRange.description}</p>
      </div>

      {/* Tip recuperación */}
      {tip && (
        <p className="text-[12px] text-muted italic flex items-start gap-2 leading-relaxed">
          <Flame size={12} className="text-accent shrink-0 mt-0.5" />
          {tip}
        </p>
      )}
    </section>
  );
}

function Stat(props: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg/40 p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{props.label}</p>
      <p className="font-display italic text-2xl mt-0.5" style={{ color: props.color }}>
        {props.value}
      </p>
      <p className="text-[11px] text-muted">{props.sub}</p>
    </div>
  );
}

function RepRangeStat(props: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted">{props.label}</p>
      <p className="font-display italic text-base text-ink">{props.value}</p>
    </div>
  );
}
