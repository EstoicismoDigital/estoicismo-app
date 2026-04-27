"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Settings as SettingsIcon, Pencil, Trash2, Dumbbell, Calendar } from "lucide-react";
import { clsx } from "clsx";
import {
  useFitnessProfile,
  useUpsertFitnessProfile,
  useFitnessMetrics,
  useExercises,
  useWorkouts,
  useCreateWorkout,
  useUpdateWorkout,
  useDeleteWorkout,
  useWorkoutSets,
  useAllUserSets,
  useCreateWorkoutSet,
  useDeleteWorkoutSet,
} from "../../../../hooks/useFitness";
import { MetricsTodayCard } from "../../../../components/fitness/MetricsTodayCard";
import { LevelOverviewCard } from "../../../../components/fitness/LevelOverviewCard";
import { LiftLevelsGrid } from "../../../../components/fitness/LiftLevelsGrid";
import { MetricsTrendCard } from "../../../../components/fitness/MetricsTrendCard";
import { QuickLogCard } from "../../../../components/fitness/QuickLogCard";
import { PersonalizedPlanCard } from "../../../../components/fitness/PersonalizedPlanCard";
import { PersonalRecordsCard } from "../../../../components/fitness/PersonalRecordsCard";
import { PlateCalculatorCard } from "../../../../components/fitness/PlateCalculatorCard";
import { BodyMetricsCard } from "../../../../components/fitness/BodyMetricsCard";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import type { FitnessWorkout } from "@estoicismo/supabase";
import type { WorkoutModalSubmit } from "../../../../components/fitness/WorkoutModal";

// Modales pesados → lazy-load.
const WorkoutModal = dynamic(
  () => import("../../../../components/fitness/WorkoutModal").then((m) => m.WorkoutModal),
  { ssr: false }
);
const ProfileSetupModal = dynamic(
  () => import("../../../../components/fitness/ProfileSetupModal").then((m) => m.ProfileSetupModal),
  { ssr: false }
);
// Onboarding wizard — sólo se monta cuando el user no tiene perfil.
const FitnessOnboarding = dynamic(
  () => import("../../../../components/fitness/FitnessOnboarding").then((m) => m.FitnessOnboarding),
  { ssr: false }
);

export function FitnessClient() {
  const { data: profile, isLoading: loadingProfile } = useFitnessProfile();
  const upsertProfile = useUpsertFitnessProfile();
  const { data: metrics = [] } = useFitnessMetrics({ limit: 30 });
  const { data: exercises = [] } = useExercises();
  const { data: workouts = [], isLoading: loadingWorkouts } = useWorkouts({ limit: 30 });
  const createWorkoutM = useCreateWorkout();
  const updateWorkoutM = useUpdateWorkout();
  const deleteWorkoutM = useDeleteWorkout();
  const createSetM = useCreateWorkoutSet();
  const deleteSetM = useDeleteWorkoutSet();
  const { data: allSets = [] } = useAllUserSets({ limit: 500 });

  const [profileOpen, setProfileOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [editing, setEditing] = useState<FitnessWorkout | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FitnessWorkout | null>(null);
  /** Si el user salta el onboarding, lo escondemos en esta sesión. */
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);

  // Si user edita, traemos sus sets
  const { data: editingSets = [] } = useWorkoutSets(editing?.id ?? null);

  const goal = profile?.goal ?? "fuerza";

  // Mostrar onboarding si: no terminó de cargar (ok), no tiene
  // onboarded_at, y no ha decidido saltar.
  const needsOnboarding =
    !loadingProfile && !profile?.onboarded_at && !onboardingSkipped;

  // Stats simples (workouts por semana)
  const weekCount = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().slice(0, 10);
    return workouts.filter((w) => w.occurred_on >= sinceStr).length;
  }, [workouts]);

  async function handleSaveWorkout(data: WorkoutModalSubmit) {
    try {
      let workoutId = editing?.id;
      if (editing) {
        await updateWorkoutM.mutateAsync({
          id: editing.id,
          input: data.workout,
        });
      } else {
        const created = await createWorkoutM.mutateAsync(data.workout);
        workoutId = created.id;
      }
      if (!workoutId) throw new Error("No workout id");

      // Sets nuevos (sin id)
      for (const s of data.sets.filter((x) => !x.id)) {
        await createSetM.mutateAsync({
          workout_id: workoutId,
          exercise_id: s.exercise_id,
          set_index: s.set_index,
          weight_kg: s.weight_kg,
          reps: s.reps,
          duration_seconds: s.duration_seconds,
          rpe: s.rpe,
        });
      }
      // Sets eliminados
      for (const id of data.removedSetIds) {
        await deleteSetM.mutateAsync(id);
      }
      // Nota: no actualizamos sets existentes en este flow (MVP).
      setWorkoutOpen(false);
      setEditing(null);
    } catch {
      /* toast in hooks */
    }
  }

  async function handleDeleteWorkout() {
    if (!confirmDelete) return;
    await deleteWorkoutM.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
  }

  // ─── ONBOARDING ─── pantalla completa si nunca completaste perfil
  if (needsOnboarding) {
    return (
      <FitnessOnboarding
        exercises={exercises}
        saving={upsertProfile.isPending}
        onComplete={async (input) => {
          await upsertProfile.mutateAsync(input);
        }}
        onSkip={() => setOnboardingSkipped(true)}
      />
    );
  }

  return (
    <div data-module="habits" className="min-h-screen bg-bg">
      {/* HERO */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Hábitos · Fitness
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            El cuerpo es el primer instrumento de la mente.
          </h1>
          <div className="flex items-center gap-3 mt-4 text-sm text-white/70 flex-wrap">
            <Stat label="Esta semana" value={`${weekCount} sesión${weekCount === 1 ? "" : "es"}`} />
            <Stat label="Total" value={`${workouts.length}`} />
            {profile?.weekly_target_days && (
              <Stat
                label="Meta semanal"
                value={`${weekCount}/${profile.weekly_target_days}`}
              />
            )}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-white/80 hover:text-accent"
            >
              <SettingsIcon size={12} />
              Mi perfil
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick log — cómo registrar peso de UNA serie sin abrir modal */}
        <QuickLogCard
          exercises={exercises}
          preferredExerciseSlugs={profile?.preferred_exercises ?? []}
        />

        {/* Plan personalizado — sólo si tiene perfil mínimo (peso + altura) */}
        {profile && profile.bodyweight_kg && profile.height_cm && (
          <PersonalizedPlanCard profile={profile} exercises={exercises} />
        )}

        {/* Métricas hoy */}
        <MetricsTodayCard />

        {/* Nivel global */}
        <LevelOverviewCard
          exercises={exercises}
          sets={allSets}
          bodyweightKg={profile?.bodyweight_kg ?? null}
          goal={goal}
        />

        {/* Récords personales — sólo si hay sets suficientes */}
        <PersonalRecordsCard exercises={exercises} sets={allSets} />

        {/* Calculadora de discos — siempre disponible */}
        <PlateCalculatorCard
          defaultUnit={profile?.unit_system === "imperial" ? "lbs" : "kg"}
        />

        {/* Medidas corporales — entrada rápida */}
        <BodyMetricsCard />

        {/* Tendencias */}
        <MetricsTrendCard metrics={metrics} />

        {/* Niveles por lift */}
        <LiftLevelsGrid
          exercises={exercises}
          sets={allSets}
          bodyweightKg={profile?.bodyweight_kg ?? null}
        />

        {/* Workouts */}
        <div className="flex items-center justify-between">
          <h2 className="font-display italic text-xl text-ink">Workouts recientes</h2>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setWorkoutOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus size={12} /> Nueva sesión
          </button>
        </div>

        {loadingWorkouts ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-card bg-bg-alt/40 animate-pulse" />
            ))}
          </div>
        ) : workouts.length === 0 ? (
          <div className="rounded-card border border-dashed border-line p-8 text-center space-y-2">
            <Dumbbell className="mx-auto text-muted" size={32} />
            <p className="text-sm text-ink font-semibold">Sin sesiones aún</p>
            <p className="text-[12px] text-muted">
              Empieza con cualquier registro: una caminata, una serie de lagartijas, lo que sea.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {workouts.map((w) => (
              <WorkoutRow
                key={w.id}
                workout={w}
                onEdit={() => {
                  setEditing(w);
                  setWorkoutOpen(true);
                }}
                onDelete={() => setConfirmDelete(w)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Modals */}
      <WorkoutModal
        open={workoutOpen}
        exercises={exercises}
        workout={editing}
        existingSets={editing ? editingSets : []}
        onClose={() => {
          setWorkoutOpen(false);
          setEditing(null);
        }}
        onSave={handleSaveWorkout}
        saving={createWorkoutM.isPending || updateWorkoutM.isPending}
      />
      <ProfileSetupModal
        open={profileOpen}
        profile={profile ?? null}
        onClose={() => setProfileOpen(false)}
        onSave={async (input) => {
          await upsertProfile.mutateAsync(input);
        }}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Eliminar workout?"
        description={`Esto borra ${confirmDelete?.name ?? "la sesión"} y todas sus series. No se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDeleteWorkout}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">
        {label}
      </p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function WorkoutRow(props: {
  workout: FitnessWorkout;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { workout, onEdit, onDelete } = props;
  const date = new Date(workout.occurred_on + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return (
    <li className="rounded-card border border-line bg-bg-alt/30 p-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{workout.name}</p>
        <p className="text-[11px] text-muted flex items-center gap-2">
          <Calendar size={10} className="inline" />
          {date}
          {workout.duration_minutes ? <span>· {workout.duration_minutes}min</span> : null}
          {workout.mood ? <span>· {"★".repeat(workout.mood)}</span> : null}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-line/40"
          aria-label="Editar"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-line/40"
          aria-label="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
