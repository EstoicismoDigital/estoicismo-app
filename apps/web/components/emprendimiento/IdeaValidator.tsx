"use client";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Skull,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { clsx } from "clsx";
import {
  IKIGAI_AXES,
  EMPTY_IKIGAI,
  ikigaiOverallScore,
  ikigaiDiagnosis,
  type IkigaiAxis,
  type IkigaiScores,
} from "../../lib/business/ikigai";
import { IkigaiRadar } from "./IkigaiRadar";
import type { CreateIdeaInput, IdeaMeta } from "@estoicismo/supabase";

/**
 * Idea Validator — flujo "ya tengo una idea".
 *
 * 5 pasos visuales, página completa cada uno:
 *   1. La idea en una frase
 *   2. Tu PORQUÉ (cascada de 5 whys)
 *   3. Ikigai check (4 sliders en cards)
 *   4. Pre-mortem (imagina 1 año fracasada)
 *   5. Resultado: radar + diagnóstico + acción
 *
 * Diseño:
 *   - Cada paso ocupa pantalla. Tipografía display grande.
 *   - Stepper minimalista arriba (5 puntos).
 *   - Backgrounds gradient sutiles.
 *   - El "Por qué" usa cascada visible — cada respuesta hace
 *     aparecer el siguiente prompt encima.
 *   - El radar Ikigai actualiza en tiempo real al mover sliders.
 */
type Step = 0 | 1 | 2 | 3 | 4;

export function IdeaValidator(props: {
  onSave: (input: CreateIdeaInput) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const { onSave, onCancel, saving } = props;
  const [step, setStep] = useState<Step>(0);

  const [idea, setIdea] = useState("");
  const [whys, setWhys] = useState<string[]>(["", "", "", "", ""]);
  const [ikigai, setIkigai] = useState<IkigaiScores>(EMPTY_IKIGAI);
  const [premortem, setPremortem] = useState("");

  const overall = useMemo(() => ikigaiOverallScore(ikigai), [ikigai]);

  function next() {
    setStep((s) => (Math.min(4, s + 1) as Step));
  }
  function prev() {
    setStep((s) => (Math.max(0, s - 1) as Step));
  }

  async function handleSave() {
    const meta: IdeaMeta = {
      kind: "have-idea",
      ikigai,
      whys: whys.filter((w) => w.trim().length > 0),
      premortem: premortem.trim() || undefined,
    };
    await onSave({
      title: idea.trim() || "Mi idea",
      description: whys[0]?.trim() || null,
      excitement: ikigai.love,
      feasibility: ikigai.good_at,
      validation_notes: premortem.trim() || null,
      meta,
    });
  }

  return (
    <section className="rounded-card border border-accent/30 bg-gradient-to-br from-accent/5 via-transparent to-accent/5 p-5 sm:p-7 space-y-6">
      {/* Stepper */}
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
          onClick={onCancel}
          className="text-[10px] font-mono uppercase tracking-widest text-muted hover:text-ink"
        >
          Cancelar
        </button>
      </div>

      {/* Body */}
      <div className="min-h-[280px]">
        {step === 0 && (
          <Step0 idea={idea} setIdea={setIdea} />
        )}
        {step === 1 && (
          <Step1Why whys={whys} setWhys={setWhys} idea={idea} />
        )}
        {step === 2 && (
          <Step2Ikigai ikigai={ikigai} setIkigai={setIkigai} idea={idea} />
        )}
        {step === 3 && (
          <Step3Premortem premortem={premortem} setPremortem={setPremortem} idea={idea} />
        )}
        {step === 4 && (
          <Step4Result
            idea={idea}
            ikigai={ikigai}
            whys={whys}
            premortem={premortem}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-line">
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
            disabled={(step === 0 && !idea.trim()) || (step === 1 && !whys[0].trim())}
            className="px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            Continuar <ChevronRight size={12} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Guardar mi idea
          </button>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────

function Step0(props: { idea: string; setIdea: (v: string) => void }) {
  return (
    <div className="text-center space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        Paso 1 · La idea
      </p>
      <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
        Si tuvieras que decirla en UNA frase…
      </h2>
      <textarea
        value={props.idea}
        onChange={(e) => props.setIdea(e.target.value)}
        rows={3}
        autoFocus
        placeholder="Voy a vender comida casera saludable para gente que trabaja desde casa…"
        className="w-full bg-bg-alt/50 border-2 border-line focus:border-accent rounded-card px-4 py-3 text-ink text-lg leading-relaxed resize-none focus:outline-none transition-colors"
      />
      <p className="text-[11px] text-muted italic">
        Lo importante: sea concreta. "Una app" no sirve. "Una app para X que resuelve Y" sí.
      </p>
    </div>
  );
}

function Step1Why(props: {
  whys: string[];
  setWhys: (whys: string[]) => void;
  idea: string;
}) {
  const { whys, setWhys, idea } = props;
  const labels = [
    "¿Por qué quieres hacer ESTA idea, y no otra?",
    "¿Y por qué eso?",
    "¿Y por qué eso?",
    "¿Y por qué eso?",
    "Y al final del día — ¿por qué TÚ?",
  ];

  function update(i: number, v: string) {
    const next = [...whys];
    next[i] = v;
    setWhys(next);
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Paso 2 · Tu porqué
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          5 porqués — baja al hueso.
        </h2>
        <p className="text-[12px] text-muted italic mt-1">
          La superficie es "ganar dinero". Debajo hay algo más vivo.
        </p>
      </div>
      <p className="text-[12px] text-center text-muted bg-bg-alt/40 rounded-lg px-3 py-2">
        Idea: <span className="text-ink italic">"{idea || "(escríbela primero)"}"</span>
      </p>
      <div className="space-y-3">
        {labels.map((label, i) => {
          // Sólo mostrar el siguiente prompt cuando el anterior tiene contenido.
          const prevFilled = i === 0 || whys[i - 1].trim().length > 5;
          if (!prevFilled) return null;
          return (
            <div key={i} className="space-y-1.5">
              <label
                className={clsx(
                  "block text-[12px] font-display italic transition-colors",
                  i === 0 ? "text-ink" : "text-muted"
                )}
              >
                {i > 0 && <span className="text-accent">↳ </span>}
                {label}
              </label>
              <textarea
                value={whys[i]}
                onChange={(e) => update(i, e.target.value)}
                rows={2}
                placeholder={i === 4 ? "Honesto, sin disfraces." : "Escribe sin filtro…"}
                className="w-full bg-bg/40 border border-line focus:border-accent rounded-lg px-3 py-2 text-[14px] text-ink resize-none focus:outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step2Ikigai(props: {
  ikigai: IkigaiScores;
  setIkigai: (s: IkigaiScores) => void;
  idea: string;
}) {
  const { ikigai, setIkigai, idea } = props;
  const overall = ikigaiOverallScore(ikigai);
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Paso 3 · Ikigai
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          ¿Tu idea anida en los 4 ejes?
        </h2>
        <p className="text-[12px] text-muted italic mt-1">
          Pasión + competencia + necesidad real + alguien dispuesto a pagar.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2 sm:flex sm:items-center sm:gap-4 sm:order-1">
          <div className="text-accent flex-shrink-0">
            <IkigaiRadar scores={ikigai} size={200} />
          </div>
          <div className="flex-1 mt-2 sm:mt-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
              Score global ({overall.filledAxes}/4)
            </p>
            <p className="font-display italic text-3xl text-ink">
              {overall.score}
              <span className="text-base text-muted">/100</span>
            </p>
            <p className="text-[12px] text-muted mt-1 italic">
              "{idea || "Tu idea"}"
            </p>
          </div>
        </div>
        {IKIGAI_AXES.map((axis) => (
          <IkigaiAxisCard
            key={axis.key}
            axis={axis.key}
            score={ikigai[axis.key]}
            onChange={(v) => setIkigai({ ...ikigai, [axis.key]: v })}
          />
        ))}
      </div>
    </div>
  );
}

function IkigaiAxisCard(props: {
  axis: IkigaiAxis;
  score: number | null;
  onChange: (v: number) => void;
}) {
  const meta = IKIGAI_AXES.find((a) => a.key === props.axis)!;
  return (
    <div
      className="rounded-lg border p-3 space-y-2"
      style={{ borderColor: `${meta.color}40`, backgroundColor: `${meta.color}08` }}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink">
          <span className="text-base">{meta.emoji}</span>
          {meta.label}
        </span>
        <span className="text-[10px] font-mono text-muted">
          {props.score ?? "—"}/5
        </span>
      </div>
      <p className="text-[11px] text-muted leading-snug">{meta.question}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => props.onChange(n)}
            className={clsx(
              "flex-1 h-7 rounded text-[11px] font-mono transition-all",
              props.score !== null && n <= props.score
                ? "text-bg"
                : "text-muted hover:text-ink"
            )}
            style={
              props.score !== null && n <= props.score
                ? { backgroundColor: meta.color }
                : { backgroundColor: `${meta.color}15` }
            }
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3Premortem(props: {
  premortem: string;
  setPremortem: (v: string) => void;
  idea: string;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Paso 4 · Pre-mortem
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          Adelantémonos al fracaso.
        </h2>
        <p className="text-[12px] text-muted italic mt-1">
          Premeditatio malorum — Séneca. Ver lo que puede salir mal antes de que pase.
        </p>
      </div>
      <div className="rounded-card border border-orange-400/30 bg-gradient-to-br from-orange-400/5 to-transparent p-5 space-y-3">
        <div className="flex items-start gap-2">
          <Skull className="text-orange-400 mt-0.5 shrink-0" size={20} />
          <p className="text-sm text-ink leading-relaxed italic">
            Es 26 de abril de 2027. Tu idea fracasó. ¿Qué la mató?
          </p>
        </div>
        <textarea
          value={props.premortem}
          onChange={(e) => props.setPremortem(e.target.value)}
          rows={5}
          placeholder="Lo más honesto. ¿Te aburrió? ¿No tenías clientes? ¿La pasión se gastó? ¿Te quedó chico el dinero?"
          className="w-full bg-bg/40 border border-line focus:border-accent rounded-lg px-3 py-2 text-[14px] text-ink resize-none focus:outline-none"
        />
        <p className="text-[10px] text-muted italic">
          Ese diagnóstico te da los riesgos a mitigar HOY, antes de empezar.
        </p>
      </div>
    </div>
  );
}

function Step4Result(props: {
  idea: string;
  ikigai: IkigaiScores;
  whys: string[];
  premortem: string;
}) {
  const overall = ikigaiOverallScore(props.ikigai);
  const diagnosis = ikigaiDiagnosis(props.ikigai);
  const validWhys = props.whys.filter((w) => w.trim().length > 0);
  const deepestWhy = validWhys[validWhys.length - 1] || null;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Paso 5 · Tu mapa
        </p>
        <h2 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight">
          Esto es lo que tienes.
        </h2>
      </div>

      {/* Idea card */}
      <div className="rounded-card border-2 border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="text-accent" size={16} />
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Tu idea
          </span>
        </div>
        <p className="font-display italic text-xl text-ink">
          "{props.idea}"
        </p>
        {deepestWhy && (
          <div className="border-l-2 border-accent/40 pl-3 mt-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
              Tu porqué profundo
            </p>
            <p className="text-[13px] text-ink/90 italic">{deepestWhy}</p>
          </div>
        )}
      </div>

      {/* Ikigai radar + diagnóstico */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4 items-center rounded-card border border-line bg-bg-alt/40 p-5">
        <div className="text-accent">
          <IkigaiRadar scores={props.ikigai} size={180} />
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <p className="font-display italic text-3xl text-ink">{overall.score}</p>
            <p className="text-xs text-muted">/100 ikigai</p>
          </div>
          <p className="text-[12px] text-ink/90 leading-relaxed">{diagnosis}</p>
        </div>
      </div>

      {/* Pre-mortem */}
      {props.premortem.trim() && (
        <div className="rounded-card border border-orange-400/30 bg-orange-400/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skull size={14} className="text-orange-400" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-orange-400">
              Riesgos a mitigar
            </span>
          </div>
          <p className="text-[13px] text-ink/90 italic leading-relaxed">
            {props.premortem}
          </p>
        </div>
      )}

      <div className="text-center text-[11px] text-muted italic">
        Esta idea queda guardada en tu lista. Vuelve a leerla cuando tengas dudas.
      </div>
    </div>
  );
}
