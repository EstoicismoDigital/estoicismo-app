"use client";
import { useMemo, useState } from "react";
import { ChevronRight, Sparkles, Heart, Wrench, Wallet, Clock, Save } from "lucide-react";
import { clsx } from "clsx";
import {
  suggestIdeas,
  PASSION_LABELS,
  SKILL_LABELS,
  BUDGET_LABELS,
  TIME_LABELS,
  getAllPassions,
  getAllSkills,
  getAllBudgets,
  getAllTimes,
  type BrainstormPassion,
  type BrainstormSkill,
  type BrainstormBudget,
  type BrainstormTime,
  type ScoredIdea,
} from "../../lib/business/brainstorm";

/**
 * Wizard de brainstorm: 4 pasos cortos → top 6 ideas matchadas.
 * El user puede guardar las que le gusten en business_ideas.
 */
export function BrainstormWizard(props: {
  onSaveIdea?: (idea: { title: string; description: string; category: string }) => void;
}) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [passions, setPassions] = useState<Set<BrainstormPassion>>(new Set());
  const [skills, setSkills] = useState<Set<BrainstormSkill>>(new Set());
  const [budget, setBudget] = useState<BrainstormBudget>("<500");
  const [time, setTime] = useState<BrainstormTime>("horas-libres");

  const suggestions: ScoredIdea[] = useMemo(() => {
    if (step !== 4) return [];
    return suggestIdeas(
      {
        passions: Array.from(passions),
        skills: Array.from(skills),
        budget,
        time,
      },
      6
    );
  }, [step, passions, skills, budget, time]);

  function togglePassion(p: BrainstormPassion) {
    const next = new Set(passions);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setPassions(next);
  }
  function toggleSkill(s: BrainstormSkill) {
    const next = new Set(skills);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setSkills(next);
  }

  if (step === 4) {
    return (
      <Results
        suggestions={suggestions}
        onRestart={() => setStep(0)}
        onSaveIdea={props.onSaveIdea}
      />
    );
  }

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Brainstorm · Paso {step + 1} de 4
          </p>
          <h2 className="font-display italic text-xl text-ink">
            {step === 0 && "¿Qué te apasiona?"}
            {step === 1 && "¿Qué se te da bien?"}
            {step === 2 && "¿Con cuánto cuentas para empezar?"}
            {step === 3 && "¿Cuánto tiempo le puedes dar?"}
          </h2>
        </div>
        <Sparkles size={18} className="text-accent" />
      </header>

      {step === 0 && (
        <ChipPicker
          icon={<Heart size={11} />}
          options={getAllPassions()}
          selected={passions}
          labels={PASSION_LABELS}
          onToggle={togglePassion}
          hint="Marca las que te dan energía. Mínimo una."
        />
      )}
      {step === 1 && (
        <ChipPicker
          icon={<Wrench size={11} />}
          options={getAllSkills()}
          selected={skills}
          labels={SKILL_LABELS}
          onToggle={toggleSkill}
          hint="Lo que ya haces bien — no necesitas ser experto."
        />
      )}
      {step === 2 && (
        <RadioPicker
          icon={<Wallet size={11} />}
          options={getAllBudgets()}
          value={budget}
          labels={BUDGET_LABELS}
          onChange={setBudget}
        />
      )}
      {step === 3 && (
        <RadioPicker
          icon={<Clock size={11} />}
          options={getAllTimes()}
          value={time}
          labels={TIME_LABELS}
          onChange={setTime}
        />
      )}

      <div className="flex justify-between pt-2 border-t border-line">
        <button
          type="button"
          onClick={() => setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2 | 3) : 0))}
          disabled={step === 0}
          className="text-[11px] font-mono uppercase tracking-widest text-muted hover:text-ink disabled:opacity-30"
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={() => {
            if (step === 0 && passions.size === 0) return;
            if (step === 1 && skills.size === 0) return;
            setStep((s) => ((s + 1) as 0 | 1 | 2 | 3 | 4));
          }}
          disabled={
            (step === 0 && passions.size === 0) || (step === 1 && skills.size === 0)
          }
          className="px-4 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"
        >
          {step < 3 ? "Siguiente" : "Ver ideas"} <ChevronRight size={12} />
        </button>
      </div>
    </section>
  );
}

function ChipPicker<T extends string>(props: {
  icon: React.ReactNode;
  options: T[];
  selected: Set<T>;
  labels: Record<T, string>;
  onToggle: (v: T) => void;
  hint?: string;
}) {
  const { options, selected, labels, onToggle, hint } = props;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const isOn = selected.has(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[12px] border transition-colors",
                isOn
                  ? "bg-accent text-bg border-accent"
                  : "border-line text-muted hover:text-ink"
              )}
            >
              {labels[o]}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-[10px] text-muted">{hint}</p>}
    </div>
  );
}

function RadioPicker<T extends string>(props: {
  icon: React.ReactNode;
  options: T[];
  value: T;
  labels: Record<T, string>;
  onChange: (v: T) => void;
}) {
  const { options, value, labels, onChange } = props;
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={clsx(
            "w-full text-left px-4 py-3 rounded-lg border transition-colors",
            value === o
              ? "bg-accent/10 border-accent text-ink"
              : "border-line text-muted hover:text-ink"
          )}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

function Results(props: {
  suggestions: ScoredIdea[];
  onRestart: () => void;
  onSaveIdea?: (idea: { title: string; description: string; category: string }) => void;
}) {
  const { suggestions, onRestart, onSaveIdea } = props;
  if (suggestions.length === 0) {
    return (
      <section className="rounded-card border border-line bg-bg-alt/40 p-8 text-center space-y-3">
        <p className="text-sm text-ink">No hay coincidencias claras con tus inputs.</p>
        <button
          type="button"
          onClick={onRestart}
          className="px-4 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest"
        >
          Repetir
        </button>
      </section>
    );
  }
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display italic text-xl text-ink">
          {suggestions.length} ideas para ti
        </h2>
        <button
          type="button"
          onClick={onRestart}
          className="text-[11px] font-mono uppercase tracking-widest text-muted hover:text-ink"
        >
          Repetir wizard
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s) => (
          <article
            key={s.template.id}
            className="rounded-card border border-line bg-bg-alt/40 p-4 space-y-2"
          >
            <header className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  {s.template.category}
                </p>
                <h3 className="font-display italic text-base text-ink leading-tight">
                  {s.template.title}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted bg-bg/40 px-1.5 py-0.5 rounded shrink-0">
                {Math.round(s.score)}pt
              </span>
            </header>
            <p className="text-[12px] text-muted leading-relaxed">
              {s.template.description}
            </p>
            <div className="text-[11px] space-y-0.5 pt-1">
              <p>
                <span className="text-muted">Inversión:</span>{" "}
                <span className="text-ink">{s.template.startupCostText}</span>
              </p>
              <p className="text-muted italic">
                <span className="text-success font-semibold">Por qué fácil:</span>{" "}
                {s.template.whyEasy}
              </p>
              <p className="text-muted italic">
                <span className="text-orange-400 font-semibold">Riesgos:</span>{" "}
                {s.template.risks}
              </p>
            </div>
            {s.reasons.length > 0 && (
              <ul className="text-[10px] text-muted border-t border-line/40 pt-2 space-y-0.5">
                {s.reasons.slice(0, 2).map((r, i) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            )}
            {onSaveIdea && (
              <button
                type="button"
                onClick={() =>
                  onSaveIdea({
                    title: s.template.title,
                    description: s.template.description,
                    category: s.template.category,
                  })
                }
                className="w-full mt-1 py-1.5 rounded-lg border border-line text-[10px] font-mono uppercase tracking-widest text-muted hover:text-accent hover:border-accent/40 inline-flex items-center justify-center gap-1.5"
              >
                <Save size={11} /> Guardar como idea
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
