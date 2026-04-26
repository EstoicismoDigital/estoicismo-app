"use client";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Battery,
  BatteryLow,
  Heart,
  HelpingHand,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import {
  suggestIdeas,
  PASSION_LABELS,
  SKILL_LABELS,
  getAllPassions,
  getAllSkills,
  type BrainstormPassion,
  type BrainstormSkill,
  type ScoredIdea,
} from "../../lib/business/brainstorm";
import type { CreateIdeaInput, IdeaMeta } from "@estoicismo/supabase";

/**
 * Explore Flow — para quien NO tiene idea aún.
 *
 * 5 preguntas más profundas (no chips fríos), inspiradas en
 * Ikigai + Bolles ("¿Qué color es tu paracaídas?") + Hedgehog
 * Concept de Jim Collins.
 *
 * 1. Energy mapping — ¿qué te llena? ¿qué te vacía?
 * 2. ¿Qué harías 8h sin pago?
 * 3. ¿En qué te buscan los demás cuando piden ayuda?
 * 4. ¿Qué problema te frustra que crees que tú resolverías mejor?
 * 5. (Backup) Pasiones + skills cuantificadas para el matching
 *
 * Output: ideas curadas + las respuestas crudas guardadas como
 * "tu pliego" — el user puede volver a leerlas.
 */
type Step = 0 | 1 | 2 | 3 | 4 | 5;

export function ExploreFlow(props: {
  onSaveIdea: (input: CreateIdeaInput) => Promise<void> | void;
  onCancel: () => void;
}) {
  const { onSaveIdea, onCancel } = props;
  const [step, setStep] = useState<Step>(0);

  // Estado de las preguntas profundas.
  const [energyGives, setEnergyGives] = useState("");
  const [energyDrains, setEnergyDrains] = useState("");
  const [free8h, setFree8h] = useState("");
  const [calledToHelp, setCalledToHelp] = useState("");
  const [frustratingProblem, setFrustratingProblem] = useState("");

  // Pasiones y skills (paso 5, para el matching del motor).
  const [passions, setPassions] = useState<Set<BrainstormPassion>>(new Set());
  const [skills, setSkills] = useState<Set<BrainstormSkill>>(new Set());

  const meta: IdeaMeta = useMemo(
    () => ({
      kind: "exploring",
      energy_gives: energyGives.trim() || undefined,
      energy_drains: energyDrains.trim() || undefined,
      free_8h: free8h.trim() || undefined,
      called_to_help: calledToHelp.trim() || undefined,
      frustrating_problem: frustratingProblem.trim() || undefined,
    }),
    [energyGives, energyDrains, free8h, calledToHelp, frustratingProblem]
  );

  const suggestions = useMemo<ScoredIdea[]>(() => {
    if (step !== 5) return [];
    return suggestIdeas(
      {
        passions: Array.from(passions),
        skills: Array.from(skills),
        budget: "<500",
        time: "horas-libres",
      },
      6
    );
  }, [step, passions, skills]);

  function next() {
    setStep((s) => (Math.min(5, s + 1) as Step));
  }
  function prev() {
    setStep((s) => (Math.max(0, s - 1) as Step));
  }

  return (
    <section className="rounded-card border border-accent/30 bg-gradient-to-br from-accent/5 via-transparent to-accent/5 p-5 sm:p-7 space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
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
          onClick={onCancel}
          className="text-[10px] font-mono uppercase tracking-widest text-muted hover:text-ink"
        >
          Cancelar
        </button>
      </div>

      <div className="min-h-[280px]">
        {step === 0 && (
          <DeepQuestion
            stepLabel="Paso 1 · Energía"
            icon={<Battery size={18} className="text-success" />}
            title="¿Qué te llena de energía y qué te la quita?"
            subtitle="No racional — instintivo. Lo que después de hacerlo te deja vivo, y lo que te apaga."
            primary={{
              label: "Lo que te da vida",
              value: energyGives,
              setValue: setEnergyGives,
              placeholder: "Cocinar para amigos. Resolver problemas técnicos. Dibujar a la vez que escucho podcast…",
              icon: <Battery size={14} />,
            }}
            secondary={{
              label: "Lo que te apaga",
              value: energyDrains,
              setValue: setEnergyDrains,
              placeholder: "Reuniones largas. Trabajo administrativo. Llamadas a clientes hostiles…",
              icon: <BatteryLow size={14} />,
            }}
          />
        )}
        {step === 1 && (
          <SingleQuestion
            stepLabel="Paso 2 · Sin paga"
            icon={<Heart size={18} className="text-rose-500" />}
            title="Si tuvieras 8 horas mañana sin obligaciones — y nadie te pagara — ¿qué harías?"
            subtitle="Lo que harías GRATIS suele ser donde está tu fuego. Si lo que harías es 'dormir', está bien — pero piensa después de descansar."
            value={free8h}
            setValue={setFree8h}
            placeholder="Caminar 4 horas y tomar fotos. Escribir capítulos de mi novela. Aprender Premiere y editar videos viejos…"
          />
        )}
        {step === 2 && (
          <SingleQuestion
            stepLabel="Paso 3 · La gente te busca"
            icon={<HelpingHand size={18} className="text-blue-500" />}
            title="¿En qué te buscan tus amigos / familia cuando piden ayuda?"
            subtitle="Las habilidades obvias para ti son talentos para los demás. Lo que ya haces sin esfuerzo, otros pagan por aprenderlo."
            value={calledToHelp}
            setValue={setCalledToHelp}
            placeholder="Me piden que les arme la presentación. Que les corte el cabello. Que les recomiende libros. Que les explique de finanzas…"
          />
        )}
        {step === 3 && (
          <SingleQuestion
            stepLabel="Paso 4 · El problema"
            icon={<AlertCircle size={18} className="text-orange-500" />}
            title="¿Qué problema te frustra y crees que tú lo resolverías mejor que quienes lo intentan hoy?"
            subtitle='La mejor brújula de un negocio: "yo lo haría diferente". Si no encuentras nada, no pasa nada — déjalo en blanco.'
            value={frustratingProblem}
            setValue={setFrustratingProblem}
            placeholder="Las apps de fitness son aburridas y motivan poco. Los cursos online son gigantes. Los restos de comida se desperdician en la zona…"
          />
        )}
        {step === 4 && (
          <ChipsStep
            stepLabel="Paso 5 · Tags"
            title="Marca lo que conecta contigo."
            subtitle="Esto sirve sólo para afinar las sugerencias del próximo paso. Ninguna combinación es 'incorrecta'."
            passions={passions}
            setPassions={setPassions}
            skills={skills}
            setSkills={setSkills}
          />
        )}
        {step === 5 && (
          <SuggestionsStep
            suggestions={suggestions}
            answers={{
              energyGives,
              free8h,
              calledToHelp,
              frustratingProblem,
            }}
            onSave={(template, scoredReasons) =>
              onSaveIdea({
                title: template.title,
                description: template.description,
                category: template.category,
                meta: { ...meta, kind: "exploring" },
                validation_notes: scoredReasons.join(" · "),
              })
            }
          />
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-line">
        <button
          type="button"
          onClick={prev}
          disabled={step === 0}
          className="text-[11px] font-mono uppercase tracking-widest text-muted hover:text-ink disabled:opacity-30 inline-flex items-center gap-1"
        >
          <ChevronLeft size={12} /> Anterior
        </button>
        {step < 5 && (
          <button
            type="button"
            onClick={next}
            className="px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5"
          >
            {step === 4 ? "Ver sugerencias" : "Siguiente"} <ChevronRight size={12} />
          </button>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function DeepQuestion(props: {
  stepLabel: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  primary: {
    label: string;
    value: string;
    setValue: (v: string) => void;
    placeholder: string;
    icon: React.ReactNode;
  };
  secondary: {
    label: string;
    value: string;
    setValue: (v: string) => void;
    placeholder: string;
    icon: React.ReactNode;
  };
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent inline-flex items-center gap-1.5">
          {props.icon}
          {props.stepLabel}
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight mt-2">
          {props.title}
        </h2>
        <p className="text-[12px] text-muted italic mt-2 max-w-md mx-auto leading-relaxed">
          {props.subtitle}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-widest text-success inline-flex items-center gap-1">
            {props.primary.icon}
            {props.primary.label}
          </label>
          <textarea
            value={props.primary.value}
            onChange={(e) => props.primary.setValue(e.target.value)}
            rows={5}
            placeholder={props.primary.placeholder}
            autoFocus
            className="w-full bg-success/5 border-2 border-success/30 focus:border-success rounded-lg px-3 py-2 text-[14px] text-ink resize-none focus:outline-none transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-widest text-danger inline-flex items-center gap-1">
            {props.secondary.icon}
            {props.secondary.label}
          </label>
          <textarea
            value={props.secondary.value}
            onChange={(e) => props.secondary.setValue(e.target.value)}
            rows={5}
            placeholder={props.secondary.placeholder}
            className="w-full bg-danger/5 border-2 border-danger/30 focus:border-danger rounded-lg px-3 py-2 text-[14px] text-ink resize-none focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

function SingleQuestion(props: {
  stepLabel: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent inline-flex items-center gap-1.5">
          {props.icon}
          {props.stepLabel}
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight mt-2">
          {props.title}
        </h2>
        <p className="text-[12px] text-muted italic mt-2 max-w-lg mx-auto leading-relaxed">
          {props.subtitle}
        </p>
      </div>
      <textarea
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
        rows={6}
        autoFocus
        placeholder={props.placeholder}
        className="w-full bg-bg-alt/50 border-2 border-line focus:border-accent rounded-card px-4 py-3 text-ink text-[14px] leading-relaxed resize-none focus:outline-none transition-colors"
      />
    </div>
  );
}

function ChipsStep(props: {
  stepLabel: string;
  title: string;
  subtitle: string;
  passions: Set<BrainstormPassion>;
  setPassions: (s: Set<BrainstormPassion>) => void;
  skills: Set<BrainstormSkill>;
  setSkills: (s: Set<BrainstormSkill>) => void;
}) {
  function togglePassion(p: BrainstormPassion) {
    const next = new Set(props.passions);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    props.setPassions(next);
  }
  function toggleSkill(s: BrainstormSkill) {
    const next = new Set(props.skills);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    props.setSkills(next);
  }
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          {props.stepLabel}
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight mt-2">
          {props.title}
        </h2>
        <p className="text-[12px] text-muted italic mt-2 max-w-md mx-auto leading-relaxed">
          {props.subtitle}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
          Te apasiona
        </p>
        <div className="flex flex-wrap gap-1.5">
          {getAllPassions().map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePassion(p)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[12px] border transition-colors",
                props.passions.has(p)
                  ? "bg-accent text-bg border-accent"
                  : "border-line text-muted hover:text-ink"
              )}
            >
              {PASSION_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
          Lo que sabes hacer
        </p>
        <div className="flex flex-wrap gap-1.5">
          {getAllSkills().map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSkill(s)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[12px] border transition-colors",
                props.skills.has(s)
                  ? "bg-accent text-bg border-accent"
                  : "border-line text-muted hover:text-ink"
              )}
            >
              {SKILL_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuggestionsStep(props: {
  suggestions: ScoredIdea[];
  answers: {
    energyGives: string;
    free8h: string;
    calledToHelp: string;
    frustratingProblem: string;
  };
  onSave: (
    template: ScoredIdea["template"],
    reasons: string[]
  ) => Promise<void> | void;
}) {
  const { suggestions, answers, onSave } = props;
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Tu mapa
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          Esto es lo que veo en ti.
        </h2>
        <p className="text-[12px] text-muted italic mt-1">
          {suggestions.length} ideas que conectan con tus respuestas. Empieza por la que más te incomode emocionarte con.
        </p>
      </div>

      {/* Resumen de respuestas */}
      {(answers.energyGives || answers.free8h || answers.calledToHelp || answers.frustratingProblem) && (
        <div className="rounded-card border border-line bg-bg/40 p-4 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
            Lo que dijiste de ti
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
            {answers.energyGives && (
              <Quote label="Te llena" text={answers.energyGives} accent="text-success" />
            )}
            {answers.free8h && (
              <Quote label="Sin pago harías" text={answers.free8h} accent="text-rose-500" />
            )}
            {answers.calledToHelp && (
              <Quote label="Te buscan para" text={answers.calledToHelp} accent="text-blue-500" />
            )}
            {answers.frustratingProblem && (
              <Quote label="Te frustra" text={answers.frustratingProblem} accent="text-orange-500" />
            )}
          </div>
        </div>
      )}

      {suggestions.length === 0 ? (
        <p className="text-center text-sm text-muted italic">
          Marca al menos una pasión y un skill en el paso anterior para ver ideas matchadas.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((s) => (
            <SuggestionCard
              key={s.template.id}
              suggestion={s}
              onSave={() => onSave(s.template, s.reasons)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Quote({
  label,
  text,
  accent,
}: {
  label: string;
  text: string;
  accent: string;
}) {
  return (
    <div>
      <p className={`text-[10px] font-mono uppercase tracking-widest ${accent}`}>
        {label}
      </p>
      <p className="text-ink/90 italic line-clamp-2">{text}</p>
    </div>
  );
}

function SuggestionCard(props: {
  suggestion: ScoredIdea;
  onSave: () => Promise<void> | void;
}) {
  const { suggestion: s, onSave } = props;
  const [saving, setSaving] = useState(false);
  const colorByCategory: Record<string, string> = {
    digital: "#0EA5E9",
    fisico: "#CA8A04",
    servicios: "#22774E",
    contenido: "#9333EA",
    hibrido: "#EA580C",
  };
  const accent = colorByCategory[s.template.category] ?? "#6B7280";

  return (
    <article
      className="relative rounded-card border-2 p-4 space-y-3 overflow-hidden group"
      style={{ borderColor: `${accent}30`, backgroundColor: `${accent}05` }}
    >
      {/* Score badge */}
      <div
        className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${accent}20`, color: accent }}
      >
        {Math.round(s.score)}pt
      </div>
      <div>
        <p
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: accent }}
        >
          {s.template.category}
        </p>
        <h3 className="font-display italic text-lg text-ink leading-snug mt-0.5">
          {s.template.title}
        </h3>
      </div>
      <p className="text-[12px] text-ink/80 leading-relaxed">
        {s.template.description}
      </p>
      <div className="space-y-1.5 text-[11px]">
        <p>
          <span className="text-muted">Inversión:</span>{" "}
          <span className="text-ink font-semibold">{s.template.startupCostText}</span>
        </p>
        <p className="text-success italic leading-snug">
          ✓ {s.template.whyEasy}
        </p>
        <p className="text-orange-400 italic leading-snug">
          ⚠ {s.template.risks}
        </p>
      </div>
      {s.reasons.length > 0 && (
        <ul className="text-[10px] text-muted border-t border-line/40 pt-2 space-y-0.5">
          {s.reasons.slice(0, 2).map((r, i) => (
            <li key={i}>· {r}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={async () => {
          setSaving(true);
          try {
            await onSave();
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving}
        className="w-full py-2 rounded-lg border border-line text-[11px] font-mono uppercase tracking-widest text-muted hover:text-accent hover:border-accent/40 inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
        Guardar como mi idea
      </button>
    </article>
  );
}
