"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Flame,
  Loader2,
  Pencil,
  Radio,
  Sparkles,
  Target,
} from "lucide-react";
import { clsx } from "clsx";
import type { MindsetMPD } from "@estoicismo/supabase";
import {
  useMPD,
  useUpsertMPD,
  useMPDLogForDate,
  useMPDLogs,
  useUpsertMPDLog,
} from "../../../hooks/useMindset";
import { getTodayStr, computeStreak } from "../../../lib/dateUtils";
import { HILL_SIX_STEPS } from "../../../lib/mindset";
import { MINDSET_QUOTES } from "../../../lib/quotes";
import { DailyQuote } from "../../../components/ui/DailyQuote";
import { StoicExerciseCard } from "../../../components/mindset/StoicExerciseCard";
import { MoodTrackerCard } from "../../../components/mindset/MoodTrackerCard";
import { VisionBoardSection } from "../../../components/mindset/VisionBoardSection";
import { FutureLetterSection } from "../../../components/mindset/FutureLetterSection";

/**
 * Mentalidad · Propósito.
 *
 * Home del módulo. Dos estados grandes:
 *  1. Sin MPD — onboarding con los 6 pasos de Napoleón Hill y un editor
 *     guiado (cantidad / valor / fecha / plan / afirmación).
 *  2. Con MPD — tablero diario: afirmación del día, check-in (mood +
 *     belief + nota), racha de check-ins, cita rotativa de Hill, y
 *     atajos al resto del módulo (Meditación, Aura).
 *
 * Tone: editorial — títulos en serif itálica, labels en mono, el
 * acento violeta viene de data-module="reflexiones" ya cableado en
 * AppShell.
 */
export function ReflexionesClient() {
  const today = useMemo(() => getTodayStr(), []);
  const { data: mpd, isLoading: loadingMPD } = useMPD();
  const { data: todayLog } = useMPDLogForDate(today);
  const { data: recentLogs = [] } = useMPDLogs(30);

  const upsertMPD = useUpsertMPD();
  const upsertLog = useUpsertMPDLog();

  const [editing, setEditing] = useState(false);

  // Racha: días consecutivos con check-in (para reforzar el hábito de
  // leer la afirmación dos veces al día, al estilo Hill).
  const streak = useMemo(
    () => computeStreak(recentLogs.map((l) => l.date)),
    [recentLogs]
  );

  // —————————————————————— Loading ——————————————————————
  if (loadingMPD) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  // —————————————————————— Sin MPD — onboarding ——————————————————————
  if (!mpd || editing) {
    return (
      <MPDEditor
        initial={mpd ?? null}
        saving={upsertMPD.isPending}
        onCancel={mpd ? () => setEditing(false) : undefined}
        onSave={async (draft) => {
          await upsertMPD.mutateAsync(draft);
          setEditing(false);
        }}
      />
    );
  }

  // —————————————————————— Con MPD — dashboard diario ——————————————————————
  return (
    <div className="min-h-screen">
      {/* Hero — afirmación del día */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Tu Propósito Mayor Definido
            </p>
            <span className="h-px flex-1 bg-white/10" />
            <button
              onClick={() => setEditing(true)}
              className="font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-white inline-flex items-center gap-1"
            >
              <Pencil size={11} /> Editar
            </button>
          </div>

          <h1 className="font-display italic text-3xl sm:text-4xl leading-tight">
            {mpd.aim}
          </h1>

          {mpd.deadline && (
            <p className="font-body text-white/60 text-sm mt-3">
              Fecha objetivo:{" "}
              <span className="text-white">{formatDeadline(mpd.deadline)}</span>
            </p>
          )}

          {mpd.affirmation && (
            <div className="mt-6 rounded-card border border-white/15 bg-white/5 p-5 sm:p-6">
              <p className="font-mono text-[9px] uppercase tracking-widest text-accent mb-2">
                Afirmación · Léela en voz alta
              </p>
              <p className="font-display italic text-lg sm:text-xl text-white leading-relaxed">
                &ldquo;{mpd.affirmation}&rdquo;
              </p>
              <AffirmationCheckbox
                checked={todayLog?.read_affirmation ?? false}
                onToggle={async (next) => {
                  await upsertLog.mutateAsync({
                    date: today,
                    read_affirmation: next,
                    progress_note: todayLog?.progress_note ?? null,
                    mood: todayLog?.mood ?? null,
                    belief: todayLog?.belief ?? null,
                  });
                }}
                saving={upsertLog.isPending}
              />
            </div>
          )}
        </div>
      </section>

      {/* Stats + cita */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            icon={<Flame size={14} />}
            label="Racha"
            value={`${streak}d`}
            sub="check-ins"
          />
          <StatCard
            icon={<Check size={14} />}
            label="Registros"
            value={`${recentLogs.length}`}
            sub="últ. 30 días"
          />
          <StatCard
            icon={<Target size={14} />}
            label="Hoy"
            value={todayLog ? "Registrado" : "Pendiente"}
            sub={todayLog ? "guardado" : "falta escribir"}
            highlight={!todayLog}
          />
        </div>

        {/* Reflexión del día — una sola frase, rota en medianoche.
            365 citas reales del catálogo de consciencia. */}
        <div className="mt-8 border-l-2 border-accent/50 pl-4 sm:pl-5">
          <DailyQuote
            quotes={MINDSET_QUOTES}
            label="Reflexión del día"
          />
        </div>
      </section>

      {/* Stoic exercise of the day */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
        <StoicExerciseCard />
      </section>

      {/* Mood tracker — registro emocional del día */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
        <MoodTrackerCard />
      </section>

      {/* Check-in de hoy */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
        <DailyCheckIn
          date={today}
          initial={todayLog ?? null}
          saving={upsertLog.isPending}
          onSave={(draft) => upsertLog.mutateAsync(draft)}
        />
      </section>

      {/* Vision board */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
        <VisionBoardSection />
      </section>

      {/* Future-self letters */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-10">
        <FutureLetterSection />
      </section>

      {/* Atajos al resto del módulo */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
          Más en Mentalidad
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ShortcutLink
            href="/reflexiones/meditacion"
            Icon={Brain}
            label="Meditación"
            body="Sesiones guiadas estilo Joe Dispenza — coherencia, romper hábitos, visión."
          />
          <ShortcutLink
            href="/reflexiones/aura"
            Icon={Radio}
            label="Aura"
            body="Frecuencias en Hz para concentración, meditación, enfoque y relajación."
          />
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MPD Editor — onboarding + edición
// ─────────────────────────────────────────────────────────────

function MPDEditor({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: MindsetMPD | null;
  saving: boolean;
  onSave: (draft: {
    aim: string;
    offered_value: string | null;
    deadline: string | null;
    plan: string | null;
    affirmation: string | null;
  }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [aim, setAim] = useState(initial?.aim ?? "");
  const [offered, setOffered] = useState(initial?.offered_value ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [plan, setPlan] = useState(initial?.plan ?? "");
  const [affirmation, setAffirmation] = useState(initial?.affirmation ?? "");

  const canSave = aim.trim().length >= 3 && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    await onSave({
      aim: aim.trim(),
      offered_value: offered.trim() || null,
      deadline: deadline || null,
      plan: plan.trim() || null,
      affirmation: affirmation.trim() || null,
    });
  }

  return (
    <div className="min-h-screen">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            {initial ? "Editar tu MPD" : "Escribe tu MPD"}
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl leading-tight">
            Tu Propósito Mayor Definido.
          </h1>
          <p className="font-body text-white/60 text-sm mt-3 max-w-prose leading-relaxed">
            Napoleón Hill lo llamó el punto de partida de todo logro.
            Seis pasos, una declaración, y leerlo dos veces al día —
            mañana al despertar, noche antes de dormir.
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-6"
      >
        <div className="rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">
            Los 6 pasos de Hill
          </p>
          <ol className="space-y-3">
            {HILL_SIX_STEPS.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full border border-accent/30 text-accent font-mono text-[10px] flex items-center justify-center">
                  {s.n}
                </span>
                <div className="flex-1">
                  <p className="font-body text-sm text-ink">{s.title}</p>
                  <p className="font-body text-xs text-muted leading-relaxed">
                    {s.hint}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Field
          label="1 · ¿Qué quieres lograr?"
          helper="Sé específico y medible. Una cifra, un lugar, un logro claro."
          required
        >
          <textarea
            value={aim}
            onChange={(e) => setAim(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: Generar $10,000 USD al mes con mi negocio digital para el 31 de diciembre de 2026."
            className="w-full rounded-lg border border-line bg-bg px-4 py-3 font-body text-base text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            required
          />
        </Field>

        <Field
          label="2 · ¿Qué darás a cambio?"
          helper="Nada sin esfuerzo. Define el servicio, tiempo o valor que entregarás."
        >
          <textarea
            value={offered}
            onChange={(e) => setOffered(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ej: 20h semanales construyendo, enseñando, acompañando a mis clientes."
            className="w-full rounded-lg border border-line bg-bg px-4 py-3 font-body text-base text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </Field>

        <Field
          label="3 · Fecha límite"
          helper="El cerebro necesita un horizonte claro."
        >
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-4 py-3 font-body text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </Field>

        <Field
          label="4 · Tu plan"
          helper="Aunque sea imperfecto. Ponte en marcha, lo ajustarás en el camino."
        >
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Ej: Cada semana: 1 producto nuevo, 3 clientes contactados, 5 publicaciones."
            className="w-full rounded-lg border border-line bg-bg px-4 py-3 font-body text-base text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </Field>

        <Field
          label="5 · Declaración escrita"
          helper="Una sola frase. Cifra + fecha + qué darás + cómo. La leerás dos veces al día."
        >
          <textarea
            value={affirmation}
            onChange={(e) => setAffirmation(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ej: El 31/12/2026 recibiré $10,000 USD al mes construyendo valor real en mi negocio digital, con 20h de trabajo semanal y disciplina diaria."
            className="w-full rounded-lg border border-line bg-bg px-4 py-3 font-body text-base italic text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2 sticky bottom-0 bg-bg/90 backdrop-blur-sm py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-t sm:border-0 border-line">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-11 px-5 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg-alt transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            <Sparkles size={16} />
            Guardar MPD
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Daily Check-In
// ─────────────────────────────────────────────────────────────

function DailyCheckIn({
  date,
  initial,
  saving,
  onSave,
}: {
  date: string;
  initial: {
    progress_note: string | null;
    mood: number | null;
    belief: number | null;
    read_affirmation: boolean;
  } | null;
  saving: boolean;
  onSave: (draft: {
    date: string;
    progress_note: string | null;
    mood: number | null;
    belief: number | null;
    read_affirmation: boolean;
  }) => Promise<unknown>;
}) {
  const [note, setNote] = useState(initial?.progress_note ?? "");
  const [mood, setMood] = useState<number | null>(initial?.mood ?? null);
  const [belief, setBelief] = useState<number | null>(initial?.belief ?? null);

  // Re-seed si cambia el día (montamos el componente una vez).
  const trimmed = note.trim();
  const hasChanges =
    trimmed !== (initial?.progress_note?.trim() ?? "") ||
    mood !== (initial?.mood ?? null) ||
    belief !== (initial?.belief ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasChanges || saving) return;
    await onSave({
      date,
      progress_note: trimmed.length > 0 ? trimmed : null,
      mood,
      belief,
      read_affirmation: initial?.read_affirmation ?? false,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
        Check-in de hoy
      </p>
      <h2 className="font-display italic text-xl sm:text-2xl text-ink mb-4">
        ¿Cómo avanzaste hoy?
      </h2>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 1000))}
        rows={4}
        placeholder="Una acción concreta, por pequeña que parezca. O lo que se interpuso."
        className="w-full rounded-lg border border-line bg-bg px-4 py-3 font-body text-base text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ScaleField
          label="Ánimo"
          value={mood}
          onChange={setMood}
          lowLabel="Bajo"
          highLabel="Alto"
        />
        <ScaleField
          label="Creencia en el plan"
          value={belief}
          onChange={setBelief}
          lowLabel="Dudoso"
          highLabel="Certero"
        />
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        {initial && !hasChanges && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mr-auto">
            Guardado
          </p>
        )}
        <button
          type="submit"
          disabled={!hasChanges || saving}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Guardar
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────

function Field({
  label,
  helper,
  required,
  children,
}: {
  label: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </span>
      {children}
      {helper && (
        <span className="font-body text-xs text-muted leading-relaxed">
          {helper}
        </span>
      )}
    </label>
  );
}

function ScaleField({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label} nivel ${n}`}
            className={clsx(
              "flex-1 h-10 rounded-lg font-mono text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              value === n
                ? "bg-accent text-bg font-medium"
                : "bg-bg-alt text-muted hover:text-ink border border-line"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function AffirmationCheckbox({
  checked,
  onToggle,
  saving,
}: {
  checked: boolean;
  onToggle: (next: boolean) => void | Promise<unknown>;
  saving: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      disabled={saving}
      className={clsx(
        "mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-full font-mono text-[10px] uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        checked
          ? "bg-accent text-bg"
          : "border border-white/30 text-white/70 hover:text-white hover:border-white/60"
      )}
    >
      {saving ? (
        <Loader2 size={12} className="animate-spin" />
      ) : checked ? (
        <Check size={12} />
      ) : (
        <BookOpen size={12} />
      )}
      {checked ? "Leída hoy" : "Marcar como leída"}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-card border p-4 flex flex-col gap-1",
        highlight ? "border-accent/40 bg-accent/5" : "border-line bg-bg-alt/40"
      )}
    >
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <p className="font-display italic text-2xl text-ink leading-none mt-1">
        {value}
      </p>
      <p className="font-body text-[11px] text-muted">{sub}</p>
    </div>
  );
}

function ShortcutLink({
  href,
  Icon,
  label,
  body,
}: {
  href: string;
  Icon: typeof Brain;
  label: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-line bg-bg-alt/40 p-5 flex flex-col gap-2 hover:border-accent/40 hover:bg-accent/5 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent">
          <Icon size={16} />
        </span>
        <ArrowRight
          size={16}
          className="text-muted group-hover:text-accent transition-colors"
        />
      </div>
      <h3 className="font-display italic text-lg text-ink mt-2">{label}</h3>
      <p className="font-body text-xs text-muted leading-relaxed">{body}</p>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────

function formatDeadline(iso: string): string {
  // ISO en formato YYYY-MM-DD — parseamos como fecha local.
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${d} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
