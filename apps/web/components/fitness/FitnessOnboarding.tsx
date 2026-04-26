"use client";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Scale,
  Ruler,
  Calendar,
  Plus,
  AlertCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { useCreateExercise } from "../../hooks/useFitness";
import type {
  FitnessGoal,
  FitnessSex,
  FitnessExperience,
  FitnessExercise,
  ExerciseMeasurement,
  ExerciseMuscleGroup,
  UpsertFitnessProfileInput,
} from "@estoicismo/supabase";

/**
 * Onboarding del módulo Fitness — 5 pasos visuales que arman tu
 * perfil para luego personalizar todo el resto.
 *
 * Pasos:
 *   1. Datos del cuerpo (peso, altura, año, sexo)
 *   2. Objetivo (4 cards visuales + meta en una frase)
 *   3. Frecuencia semanal (slider visual 1-7)
 *   4. Nivel de experiencia (3 cards)
 *   5. Ejercicios favoritos (multiselect del catálogo)
 *
 * Al guardar, se setea `onboarded_at` — ya no se vuelve a mostrar.
 */
type Step = 0 | 1 | 2 | 3 | 4;

const GOALS: { key: FitnessGoal; label: string; emoji: string; desc: string; color: string }[] = [
  {
    key: "fuerza",
    label: "Fuerza",
    emoji: "🏋️",
    desc: "Cargar más peso. Pocas reps, alta intensidad.",
    color: "#1E40AF",
  },
  {
    key: "hipertrofia",
    label: "Hipertrofia",
    emoji: "💪",
    desc: "Construir músculo. Volumen y conexión.",
    color: "#7C3AED",
  },
  {
    key: "resistencia",
    label: "Resistencia",
    emoji: "🏃",
    desc: "Aguante cardiovascular y muscular.",
    color: "#22774E",
  },
  {
    key: "salud",
    label: "Salud general",
    emoji: "🌿",
    desc: "Moverte bien. Calidad de vida.",
    color: "#0EA5E9",
  },
];

const EXPERIENCE_LEVELS: {
  key: FitnessExperience;
  label: string;
  desc: string;
  color: string;
  emoji: string;
}[] = [
  {
    key: "principiante",
    label: "Principiante",
    desc: "<1 año entrenando. Todavía aprendiendo técnica.",
    color: "#22774E",
    emoji: "🌱",
  },
  {
    key: "intermedio",
    label: "Intermedio",
    desc: "1-3 años. Conoces los lifts principales.",
    color: "#CA8A04",
    emoji: "⚙️",
  },
  {
    key: "avanzado",
    label: "Avanzado",
    desc: "3+ años. Sabes lo que tu cuerpo necesita.",
    color: "#DC2626",
    emoji: "🔥",
  },
];

export function FitnessOnboarding(props: {
  exercises: FitnessExercise[];
  onComplete: (input: UpsertFitnessProfileInput) => Promise<void> | void;
  onSkip: () => void;
  saving?: boolean;
}) {
  const { exercises, onComplete, onSkip, saving } = props;
  const [step, setStep] = useState<Step>(0);

  const [bodyweight, setBodyweight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [sex, setSex] = useState<FitnessSex | null>(null);

  const [goal, setGoal] = useState<FitnessGoal>("fuerza");
  const [goalText, setGoalText] = useState<string>("");
  const [targetWeight, setTargetWeight] = useState<string>("");

  const [weeklyDays, setWeeklyDays] = useState<number>(3);
  const [experience, setExperience] = useState<FitnessExperience>("principiante");
  const [preferred, setPreferred] = useState<Set<string>>(new Set());
  /** Mensaje de error si falla el upsert del perfil. */
  const [saveError, setSaveError] = useState<string | null>(null);

  function next() {
    setStep((s) => Math.min(4, s + 1) as Step);
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1) as Step);
  }
  function togglePreferred(slug: string) {
    const next = new Set(preferred);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setPreferred(next);
  }

  async function handleComplete() {
    setSaveError(null);
    try {
      await onComplete({
        bodyweight_kg: bodyweight ? Number(bodyweight) : null,
        height_cm: height ? Number(height) : null,
        birth_year: birthYear ? Number(birthYear) : null,
        sex,
        goal,
        goal_text: goalText.trim() || null,
        target_weight_kg: targetWeight ? Number(targetWeight) : null,
        weekly_target_days: weeklyDays,
        experience_level: experience,
        preferred_exercises: Array.from(preferred),
        onboarded_at: new Date().toISOString(),
      });
    } catch (err) {
      // Mostramos el error en pantalla — más claro que un toast que
      // desaparece. Si el error menciona "column" o "does not exist",
      // damos pista de la migración.
      const raw = err instanceof Error ? err.message : String(err);
      const looksLikeMissingColumn =
        /column.*does not exist|schema cache|onboarded_at|height_cm|weekly_target_days/i.test(raw);
      setSaveError(
        looksLikeMissingColumn
          ? `Tu base de datos no tiene las columnas nuevas. Aplica la migración 20260427200000_fitness_profile_extended.sql en Supabase. Detalle: ${raw}`
          : raw
      );
    }
  }

  // Validaciones por paso
  const canAdvance = (() => {
    if (step === 0) return !!(bodyweight && height); // peso y altura mínimos
    return true;
  })();

  return (
    <div data-module="habits" className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Hábitos · Fitness
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            Empecemos por conocerte.
          </h1>
          <p className="font-body text-white/60 text-sm mt-2 max-w-prose">
            5 preguntas rápidas. Después puedes editarlo en cualquier momento.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Stepper + skip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={clsx(
                  "h-1 rounded-full transition-all",
                  i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/40" : "w-4 bg-line"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="text-[10px] font-mono uppercase tracking-widest text-muted hover:text-ink"
          >
            Saltar
          </button>
        </div>

        <section className="rounded-card border border-accent/30 bg-gradient-to-br from-accent/5 via-transparent to-accent/5 p-5 sm:p-7 space-y-5 min-h-[420px]">
          {step === 0 && (
            <Step0Body
              bodyweight={bodyweight}
              setBodyweight={setBodyweight}
              height={height}
              setHeight={setHeight}
              birthYear={birthYear}
              setBirthYear={setBirthYear}
              sex={sex}
              setSex={setSex}
            />
          )}
          {step === 1 && (
            <Step1Goal
              goal={goal}
              setGoal={setGoal}
              goalText={goalText}
              setGoalText={setGoalText}
              targetWeight={targetWeight}
              setTargetWeight={setTargetWeight}
              currentWeight={bodyweight}
            />
          )}
          {step === 2 && <Step2Frequency days={weeklyDays} setDays={setWeeklyDays} />}
          {step === 3 && <Step3Experience experience={experience} setExperience={setExperience} />}
          {step === 4 && (
            <Step4Exercises
              exercises={exercises}
              preferred={preferred}
              togglePreferred={togglePreferred}
            />
          )}
        </section>

        {/* Error visible si el guardado falla */}
        {saveError && (
          <div className="rounded-card border border-danger/40 bg-danger/5 p-3 flex gap-2 items-start">
            <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
            <div className="text-[12px] text-ink flex-1 break-words">
              <p className="font-semibold mb-1">No se pudo guardar tu perfil.</p>
              <p className="text-muted leading-snug">{saveError}</p>
            </div>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="text-muted hover:text-ink text-xs"
              aria-label="Cerrar error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="text-[11px] font-mono uppercase tracking-widest text-muted hover:text-ink disabled:opacity-30 inline-flex items-center gap-1"
          >
            <ChevronLeft size={12} /> Anterior
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance}
              className="px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              Continuar <ChevronRight size={12} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Empezar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────

function Step0Body(props: {
  bodyweight: string;
  setBodyweight: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  birthYear: string;
  setBirthYear: (v: string) => void;
  sex: FitnessSex | null;
  setSex: (v: FitnessSex | null) => void;
}) {
  return (
    <>
      <div className="text-center space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Paso 1 · Datos del cuerpo
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          ¿Con qué cuerpo entrenamos?
        </h2>
        <p className="text-[12px] text-muted italic">
          Necesarios para calcular niveles, BMI y calorías personalizadas.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <BigInput
          icon={<Scale size={14} />}
          label="Peso corporal"
          unit="kg"
          value={props.bodyweight}
          onChange={props.setBodyweight}
          placeholder="80"
          step="0.1"
        />
        <BigInput
          icon={<Ruler size={14} />}
          label="Estatura"
          unit="cm"
          value={props.height}
          onChange={props.setHeight}
          placeholder="175"
          step="1"
        />
        <BigInput
          icon={<Calendar size={14} />}
          label="Año de nacimiento"
          value={props.birthYear}
          onChange={props.setBirthYear}
          placeholder="1992"
          step="1"
        />
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-widest text-muted">
            Sexo biológico
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(["male", "female", "other"] as FitnessSex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => props.setSex(props.sex === s ? null : s)}
                className={clsx(
                  "py-2.5 rounded-lg border text-[11px] transition-colors",
                  props.sex === s
                    ? "bg-accent text-bg border-accent"
                    : "border-line text-muted hover:text-ink"
                )}
              >
                {s === "male" ? "♂" : s === "female" ? "♀" : "—"}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted italic">
            Solo afecta cálculo de calorías estimadas.
          </p>
        </div>
      </div>
    </>
  );
}

function Step1Goal(props: {
  goal: FitnessGoal;
  setGoal: (g: FitnessGoal) => void;
  goalText: string;
  setGoalText: (v: string) => void;
  targetWeight: string;
  setTargetWeight: (v: string) => void;
  currentWeight: string;
}) {
  return (
    <>
      <div className="text-center space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Paso 2 · Objetivo
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          ¿Por qué entrenas?
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => props.setGoal(g.key)}
            className={clsx(
              "rounded-card border-2 p-3 text-left transition-all",
              props.goal === g.key
                ? "border-current"
                : "border-line text-muted hover:text-ink"
            )}
            style={
              props.goal === g.key
                ? { borderColor: g.color, backgroundColor: `${g.color}10`, color: g.color }
                : undefined
            }
          >
            <span className="text-2xl">{g.emoji}</span>
            <p className="font-display italic text-base text-ink mt-1">{g.label}</p>
            <p className="text-[11px] text-muted leading-snug mt-0.5">{g.desc}</p>
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-widest text-muted">
          Tu meta en una frase
        </label>
        <input
          type="text"
          value={props.goalText}
          onChange={(e) => props.setGoalText(e.target.value)}
          placeholder="Squat 2× mi peso · Bajar 5 kg en 6 meses · Correr 10K sin parar…"
          className="w-full bg-bg border-2 border-line focus:border-accent rounded-lg px-3 py-2.5 text-[14px] text-ink focus:outline-none transition-colors"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-widest text-muted">
          Peso meta (opcional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.5"
            value={props.targetWeight}
            onChange={(e) => props.setTargetWeight(e.target.value)}
            placeholder={props.currentWeight || "75"}
            className="flex-1 bg-bg border border-line focus:border-accent rounded-lg px-3 py-2 text-ink focus:outline-none"
          />
          <span className="text-[11px] text-muted">kg</span>
        </div>
        <p className="text-[10px] text-muted italic">
          Si quieres bajar / subir / mantener un peso específico.
        </p>
      </div>
    </>
  );
}

function Step2Frequency(props: { days: number; setDays: (n: number) => void }) {
  const tips = {
    1: "Lo mínimo. Mejor que nada — pero apunta a más en 4-6 semanas.",
    2: "Suficiente para mantener. Una rutina full-body funciona aquí.",
    3: "El sweet spot del novato. Lunes-miércoles-viernes es clásico por algo.",
    4: "Empieza a notar diferencias. Upper/Lower split funciona perfecto.",
    5: "Disciplina sólida. Recuerda dejar al menos 1 día de descanso real.",
    6: "Frecuencia avanzada. Push/Pull/Legs ×2 — necesitas dormir como atleta.",
    7: "No recomendado. Sin descanso no hay adaptación. Considera bajar a 5-6.",
  };

  return (
    <>
      <div className="text-center space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Paso 3 · Frecuencia
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          ¿Cuántos días puedes entrenar?
        </h2>
        <p className="text-[12px] text-muted italic">
          Sé honesto con tu vida real, no con tu yo ideal.
        </p>
      </div>
      <div className="rounded-card bg-bg-alt/40 border border-line p-5 space-y-4 text-center">
        <p className="font-display italic text-6xl text-accent">{props.days}</p>
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted">
          días por semana
        </p>
        <div className="flex gap-1 justify-center">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => props.setDays(n)}
              className={clsx(
                "w-10 h-10 rounded-lg text-sm font-semibold transition-colors",
                props.days === n
                  ? "bg-accent text-bg"
                  : "bg-bg border border-line text-muted hover:text-ink"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-ink/90 italic max-w-md mx-auto leading-relaxed pt-2">
          {tips[props.days as keyof typeof tips]}
        </p>
      </div>
    </>
  );
}

function Step3Experience(props: {
  experience: FitnessExperience;
  setExperience: (e: FitnessExperience) => void;
}) {
  return (
    <>
      <div className="text-center space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Paso 4 · Experiencia
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          ¿Cuánto llevas en esto?
        </h2>
      </div>
      <div className="space-y-2">
        {EXPERIENCE_LEVELS.map((lvl) => (
          <button
            key={lvl.key}
            type="button"
            onClick={() => props.setExperience(lvl.key)}
            className={clsx(
              "w-full rounded-card border-2 p-4 text-left transition-all flex items-center gap-3",
              props.experience === lvl.key ? "border-current" : "border-line hover:border-line/60"
            )}
            style={
              props.experience === lvl.key
                ? { borderColor: lvl.color, backgroundColor: `${lvl.color}10` }
                : undefined
            }
          >
            <span className="text-3xl">{lvl.emoji}</span>
            <div className="flex-1">
              <p className="font-display italic text-lg text-ink">{lvl.label}</p>
              <p className="text-[11px] text-muted">{lvl.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * Lista canónica de grupos musculares — debe coincidir con el
 * CHECK constraint de la columna fitness_exercises.muscle_group.
 * Mostramos TODOS los grupos siempre, aunque estén vacíos, para
 * que el user vea la estructura completa y pueda agregar custom.
 */
const ALL_MUSCLE_GROUPS: { key: ExerciseMuscleGroup; label: string }[] = [
  { key: "pierna", label: "Pierna" },
  { key: "pecho", label: "Pecho" },
  { key: "espalda", label: "Espalda" },
  { key: "hombro", label: "Hombro" },
  { key: "brazo", label: "Brazo" },
  { key: "core", label: "Core / Abdomen" },
  { key: "cuerpo-completo", label: "Cuerpo completo" },
  { key: "cardio", label: "Cardio" },
  { key: "general", label: "Otros / general" },
];

function Step4Exercises(props: {
  exercises: FitnessExercise[];
  preferred: Set<string>;
  togglePreferred: (slug: string) => void;
}) {
  // Agrupamos por muscle_group — incluimos custom (user_id != null) tambien.
  const groups = useMemo(() => {
    const m: Record<string, FitnessExercise[]> = {};
    for (const ex of props.exercises) {
      const k = ex.muscle_group;
      if (!m[k]) m[k] = [];
      m[k].push(ex);
    }
    return m;
  }, [props.exercises]);

  // Estado del formulario inline para agregar custom: qué grupo está abierto + datos.
  const [openGroup, setOpenGroup] = useState<ExerciseMuscleGroup | null>(null);
  const [newName, setNewName] = useState("");
  const [newMeasurement, setNewMeasurement] = useState<ExerciseMeasurement>("weight_reps");
  const createExerciseM = useCreateExercise();
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate(group: ExerciseMuscleGroup) {
    setCreateError(null);
    if (!newName.trim()) return;
    try {
      // Generamos slug a partir del nombre. user-XXX-slug para evitar
      // colisión con los slugs globales del seed.
      const baseSlug = newName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
      const slug = `custom-${baseSlug || Date.now().toString()}`;
      const created = await createExerciseM.mutateAsync({
        slug,
        name: newName.trim(),
        muscle_group: group,
        measurement: newMeasurement,
      });
      // Auto-marcamos el ejercicio recién creado como preferido.
      props.togglePreferred(created.slug);
      setNewName("");
      setNewMeasurement("weight_reps");
      setOpenGroup(null);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <div className="text-center space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Paso 5 · Ejercicios favoritos
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          Marca los que ya haces o quieres dominar.
        </h2>
        <p className="text-[12px] text-muted italic">
          Opcional. ¿No ves uno? Agrégalo desde el botón{" "}
          <span className="inline-flex items-center gap-0.5 font-mono">
            <Plus size={10} className="inline" />
          </span>
          .
        </p>
      </div>
      <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
        {ALL_MUSCLE_GROUPS.map((group) => {
          const items = groups[group.key] ?? [];
          const isAdding = openGroup === group.key;
          return (
            <div key={group.key}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                  {group.label}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (isAdding) {
                      setOpenGroup(null);
                    } else {
                      setOpenGroup(group.key);
                      setCreateError(null);
                      setNewName("");
                    }
                  }}
                  className={clsx(
                    "text-[10px] font-mono uppercase tracking-widest inline-flex items-center gap-0.5 transition-colors",
                    isAdding ? "text-danger hover:text-ink" : "text-accent hover:text-ink"
                  )}
                >
                  {isAdding ? "Cancelar" : (
                    <>
                      <Plus size={11} /> Agregar
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.length === 0 && !isAdding && (
                  <p className="text-[11px] text-muted italic">
                    Sin ejercicios — agrega los tuyos.
                  </p>
                )}
                {items.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => props.togglePreferred(ex.slug)}
                    className={clsx(
                      "px-2.5 py-1 rounded-full text-[11px] border transition-colors",
                      props.preferred.has(ex.slug)
                        ? "bg-accent text-bg border-accent"
                        : "border-line text-muted hover:text-ink",
                      // Tag sutil para los custom (user_id != null)
                      ex.user_id !== null && !props.preferred.has(ex.slug) && "border-accent/30"
                    )}
                  >
                    {ex.is_main_lift && "★ "}
                    {ex.name}
                    {ex.user_id !== null && (
                      <span className="ml-1 text-[8px] opacity-60">tuyo</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Form inline para crear custom en este grupo */}
              {isAdding && (
                <div className="mt-2 rounded-lg border border-accent/40 bg-accent/5 p-3 space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={`Nombre del ejercicio (${group.label.toLowerCase()})`}
                    className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    {(
                      [
                        { key: "weight_reps", label: "Peso × reps" },
                        { key: "reps_only", label: "Sólo reps" },
                        { key: "duration", label: "Duración" },
                      ] as { key: ExerciseMeasurement; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setNewMeasurement(m.key)}
                        className={clsx(
                          "flex-1 py-1.5 rounded text-[10px] font-mono uppercase tracking-widest border",
                          newMeasurement === m.key
                            ? "bg-accent text-bg border-accent"
                            : "border-line text-muted hover:text-ink"
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {createError && (
                    <p className="text-[10px] text-danger">{createError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCreate(group.key)}
                    disabled={!newName.trim() || createExerciseM.isPending}
                    className="w-full py-2 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                  >
                    {createExerciseM.isPending ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Plus size={11} />
                    )}
                    Crear y marcar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function BigInput(props: {
  icon: React.ReactNode;
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-mono uppercase tracking-widest text-muted inline-flex items-center gap-1">
        {props.icon}
        {props.label}
      </label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step={props.step ?? "1"}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          className="w-full bg-bg border-2 border-line focus:border-accent rounded-lg px-3 py-2.5 text-lg font-display italic text-ink focus:outline-none transition-colors"
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
