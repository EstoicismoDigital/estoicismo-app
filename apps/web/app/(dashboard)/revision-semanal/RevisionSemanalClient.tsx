"use client";
import { useEffect, useState } from "react";
import {
  useWeeklyReview,
  type Pilar,
  getWeekStart,
} from "../../../hooks/useWeeklyReview";
import { useSavedState } from "../../../hooks/useSavedState";
import { SaveIndicator } from "../../../components/ui/SaveIndicator";

const PILARES: { key: Pilar; title: string; philosopher: string; accent: string }[] = [
  { key: "habits", title: "Hábitos", philosopher: "Epicteto", accent: "#B48A28" },
  { key: "finance", title: "Finanzas", philosopher: "Marco Aurelio", accent: "#22774E" },
  { key: "mindset", title: "Mentalidad", philosopher: "Porcia Catón", accent: "#B2443A" },
  { key: "business", title: "Emprendimiento", philosopher: "Séneca", accent: "#1E58A3" },
];

const PROMPTS: Record<
  Pilar,
  { progress: string; blockers: string; commitment: string }
> = {
  habits: {
    progress: "¿Qué hábitos cumplí esta semana que me acercan a mi MPD y cuáles no?",
    blockers: "¿Qué excusas usé esta semana y qué bloqueos permití que sabotearan mis hábitos?",
    commitment: "¿Qué hábitos concretos voy a cumplir en los próximos 7 días para acercarme a mi MPD?",
  },
  finance: {
    progress: "¿Qué hice esta semana que mejoró mi salud financiera y me acercó a mi MPD?",
    blockers: "¿Qué decisiones impulsivas tomé esta semana que afectaron mi progreso financiero?",
    commitment: "¿Qué acción me comprometo a hacer esta semana para mejorar las finanzas de mi MPD?",
  },
  mindset: {
    progress: "¿Qué pensamientos me sostuvieron esta semana y me acercaron a mi MPD?",
    blockers: "¿Qué patrones mentales se repitieron y me alejaron de mi MPD?",
    commitment: "¿Qué afirmación o práctica voy a sostener los próximos 7 días?",
  },
  business: {
    progress: "¿Qué movimiento concreto hice en mi emprendimiento esta semana?",
    blockers: "¿Qué procrastiné, qué cliente perdí, qué oportunidad dejé pasar?",
    commitment: "¿Qué acción voy a ejecutar los próximos 7 días para acelerar mi MPD?",
  },
};

function formatWeekRange(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const f = (x: Date) =>
    `${x.getDate()} ${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][x.getMonth()]}`;
  return `${f(d)} – ${f(end)}`;
}

export function RevisionSemanalClient() {
  const weekStart = getWeekStart();
  const { data, save } = useWeeklyReview(weekStart);

  return (
    <div className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            CIERRE DE SEMANA
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl">
            Revisión semanal
          </h1>
          <p className="font-body text-white/70 text-sm mt-3 max-w-prose">
            Una vez por semana, mira el espejo. Por cada pilar:{" "}
            <strong className="text-white">progreso</strong>,{" "}
            <strong className="text-white">bloqueos</strong>,{" "}
            <strong className="text-white">compromiso</strong>. Sin
            engaños — solo la verdad construye carácter.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mt-4">
            SEMANA: {formatWeekRange(weekStart)}
          </p>
        </div>
      </section>

      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid gap-6 sm:gap-8 md:grid-cols-2">
        {PILARES.map((p) => (
          <PilarCard
            key={p.key}
            pilar={p}
            initial={data?.[p.key] ?? null}
            onSave={save}
          />
        ))}
      </section>

      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 text-center">
        <p className="font-body italic text-muted">
          Mucha suerte. Disciplina y constancia.
        </p>
      </section>
    </div>
  );
}

function PilarCard({
  pilar,
  initial,
  onSave,
}: {
  pilar: { key: Pilar; title: string; philosopher: string; accent: string };
  initial: { progress: string | null; blockers: string | null; commitment: string | null } | null;
  onSave: (input: {
    pilar: Pilar;
    progress?: string | null;
    blockers?: string | null;
    commitment?: string | null;
  }) => Promise<void>;
}) {
  const ind = useSavedState();
  const [progress, setProgress] = useState("");
  const [blockers, setBlockers] = useState("");
  const [commitment, setCommitment] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    setProgress(initial?.progress ?? "");
    setBlockers(initial?.blockers ?? "");
    setCommitment(initial?.commitment ?? "");
    setHydrated(true);
  }, [initial, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      void ind.run(() =>
        onSave({
          pilar: pilar.key,
          progress: progress || null,
          blockers: blockers || null,
          commitment: commitment || null,
        })
      );
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, blockers, commitment, hydrated]);

  const prompts = PROMPTS[pilar.key];

  return (
    <div
      className="rounded-card border-2 bg-bg-alt/50 p-5 sm:p-6"
      style={{ borderColor: `${pilar.accent}30` }}
    >
      <header className="flex items-center justify-between mb-5">
        <div>
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: pilar.accent }}
          >
            {pilar.philosopher}
          </p>
          <h3 className="font-display italic text-2xl text-ink">
            {pilar.title}
          </h3>
        </div>
        <SaveIndicator
          state={ind.state}
          savedAt={ind.savedAt}
          error={ind.error}
        />
      </header>

      <div className="space-y-5">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${pilar.key}-progress`}
            className="font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            PROGRESO
          </label>
          <p className="font-body text-xs text-muted italic">{prompts.progress}</p>
          <textarea
            id={`${pilar.key}-progress`}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            rows={4}
            maxLength={1500}
            className="px-4 py-3 rounded-lg border border-line bg-bg font-body text-sm text-ink resize-none mt-1"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${pilar.key}-blockers`}
            className="font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            BLOQUEOS
          </label>
          <p className="font-body text-xs text-muted italic">{prompts.blockers}</p>
          <textarea
            id={`${pilar.key}-blockers`}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={4}
            maxLength={1500}
            className="px-4 py-3 rounded-lg border border-line bg-bg font-body text-sm text-ink resize-none mt-1"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${pilar.key}-commitment`}
            className="font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            COMPROMISO
          </label>
          <p className="font-body text-xs text-muted italic">{prompts.commitment}</p>
          <textarea
            id={`${pilar.key}-commitment`}
            value={commitment}
            onChange={(e) => setCommitment(e.target.value)}
            rows={4}
            maxLength={1500}
            className="px-4 py-3 rounded-lg border border-line bg-bg font-body text-sm text-ink resize-none mt-1"
          />
        </div>
      </div>
    </div>
  );
}
