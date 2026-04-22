"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import {
  MEDITATION_TYPES,
  DISPENZA_INTENTIONS,
  type MeditationTypeInfo,
} from "../../../../lib/mindset";
import {
  useCreateMeditation,
  useMeditations,
} from "../../../../hooks/useMindset";
import type { MeditationType } from "@estoicismo/supabase";

/**
 * Mentalidad · Meditación.
 *
 * Sesiones cortas estilo Joe Dispenza. Flujo:
 *   1. Elegir tipo de meditación (coherencia / romper-hábito / etc.)
 *   2. Fijar duración + intención + estado emocional actual
 *   3. Temporizador con pausa / reanudar / reiniciar
 *   4. Al terminar: feeling-after + registrar en DB
 *
 * El temporizador usa Date.now() como fuente de verdad para no
 * desviarse si la pestaña queda en background (setInterval 250ms).
 * No reproduce audio — las frecuencias viven en /reflexiones/aura,
 * que es deliberadamente un módulo separado.
 */

type Phase =
  | "setup" // escoge tipo + intención + feeling_before
  | "running" // corriendo o pausado
  | "finished"; // pide feeling_after + confirmación

export function MeditationClient() {
  const [phase, setPhase] = useState<Phase>("setup");

  // --- Setup state ---
  const [type, setType] = useState<MeditationType>("coherencia");
  const typeInfo = useMemo(
    () => MEDITATION_TYPES.find((t) => t.key === type) ?? MEDITATION_TYPES[0],
    [type]
  );
  const [minutes, setMinutes] = useState<number>(typeInfo.defaultMinutes);
  const [intention, setIntention] = useState("");
  const [feelingBefore, setFeelingBefore] = useState<number | null>(null);
  const [feelingAfter, setFeelingAfter] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // --- Timer state ---
  // Epoch en ms para el momento en el que debería terminar. Recalculamos
  // restante en base a Date.now() — resistente a background throttling.
  const [endAt, setEndAt] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number>(
    typeInfo.defaultMinutes * 60_000
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createMed = useCreateMeditation();
  const { data: history = [] } = useMeditations(10);

  // Cuando cambia el tipo, ajusta la duración sugerida si el usuario no la tocó.
  useEffect(() => {
    if (phase === "setup") {
      setMinutes(typeInfo.defaultMinutes);
      setRemainingMs(typeInfo.defaultMinutes * 60_000);
    }
  }, [type, phase, typeInfo.defaultMinutes]);

  // Reloj del temporizador
  useEffect(() => {
    if (phase !== "running" || paused || endAt == null) return;
    intervalRef.current = setInterval(() => {
      const left = endAt - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase("finished");
      } else {
        setRemainingMs(left);
      }
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, paused, endAt]);

  function handleStart() {
    const ms = minutes * 60_000;
    setEndAt(Date.now() + ms);
    setRemainingMs(ms);
    setPaused(false);
    setPhase("running");
  }

  function handlePauseResume() {
    if (paused) {
      // Reanudar: recalcular endAt con el restante
      setEndAt(Date.now() + remainingMs);
      setPaused(false);
    } else {
      // Pausar: congelar remainingMs
      setPaused(true);
    }
  }

  function handleCancel() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("setup");
    setEndAt(null);
    setPaused(false);
    setRemainingMs(minutes * 60_000);
  }

  async function handleFinish() {
    // Registra con la duración REAL planeada (si abandonó antes del
    // timeout natural, se contabiliza lo recorrido).
    const plannedMs = minutes * 60_000;
    const actualMs = plannedMs - remainingMs;
    const seconds = Math.max(30, Math.floor(actualMs / 1000));

    await createMed.mutateAsync({
      duration_seconds: seconds,
      meditation_type: type,
      intention: intention.trim() || null,
      feeling_before: feelingBefore,
      feeling_after: feelingAfter,
      notes: notes.trim() || null,
    });

    // Reset
    setPhase("setup");
    setEndAt(null);
    setPaused(false);
    setIntention("");
    setFeelingBefore(null);
    setFeelingAfter(null);
    setNotes("");
    setRemainingMs(typeInfo.defaultMinutes * 60_000);
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Meditación · Joe Dispenza
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl leading-tight">
            Entrenar la mente para crear algo nuevo.
          </h1>
          <p className="font-body text-white/60 text-sm mt-3 max-w-prose leading-relaxed">
            Una sesión corta, una intención clara, un estado elevado.
            El único camino para dejar de ensayar el antiguo yo es
            practicar — aquí, ahora, un instante a la vez.
          </p>
        </div>
      </section>

      {/* Core */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {phase === "setup" && (
          <SetupPanel
            type={type}
            setType={setType}
            typeInfo={typeInfo}
            minutes={minutes}
            setMinutes={setMinutes}
            intention={intention}
            setIntention={setIntention}
            feelingBefore={feelingBefore}
            setFeelingBefore={setFeelingBefore}
            onStart={handleStart}
          />
        )}

        {phase === "running" && (
          <TimerPanel
            typeInfo={typeInfo}
            remainingMs={remainingMs}
            totalMs={minutes * 60_000}
            paused={paused}
            onPauseResume={handlePauseResume}
            onCancel={handleCancel}
            onFinishEarly={() => setPhase("finished")}
          />
        )}

        {phase === "finished" && (
          <FinishPanel
            feelingAfter={feelingAfter}
            setFeelingAfter={setFeelingAfter}
            notes={notes}
            setNotes={setNotes}
            saving={createMed.isPending}
            onSave={handleFinish}
          />
        )}
      </section>

      {/* Historial */}
      {phase === "setup" && history.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
            Últimas sesiones
          </p>
          <ul className="divide-y divide-line rounded-card border border-line bg-bg-alt/30">
            {history.map((m) => {
              const info = MEDITATION_TYPES.find(
                (t) => t.key === m.meditation_type
              );
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-body text-sm text-ink truncate">
                      {info?.label ?? m.meditation_type}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      {formatDateShort(m.started_at)} ·{" "}
                      {Math.round(m.duration_seconds / 60)} min
                    </p>
                  </div>
                  {m.feeling_before != null && m.feeling_after != null && (
                    <p className="font-mono text-[10px] text-muted tabular-nums whitespace-nowrap">
                      {m.feeling_before} → {m.feeling_after}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SetupPanel
// ─────────────────────────────────────────────────────────────

function SetupPanel({
  type,
  setType,
  typeInfo,
  minutes,
  setMinutes,
  intention,
  setIntention,
  feelingBefore,
  setFeelingBefore,
  onStart,
}: {
  type: MeditationType;
  setType: (t: MeditationType) => void;
  typeInfo: MeditationTypeInfo;
  minutes: number;
  setMinutes: (m: number) => void;
  intention: string;
  setIntention: (v: string) => void;
  feelingBefore: number | null;
  setFeelingBefore: (n: number | null) => void;
  onStart: () => void;
}) {
  const canStart = minutes >= 1 && feelingBefore != null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
          Tipo de sesión
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MEDITATION_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={clsx(
                "text-left p-4 rounded-card border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                type === t.key
                  ? "border-accent bg-accent/5"
                  : "border-line bg-bg-alt/40 hover:border-accent/40"
              )}
            >
              <p className="font-display italic text-lg text-ink">{t.label}</p>
              <p className="font-body text-xs text-muted leading-relaxed mt-1">
                {t.summary}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-accent mt-2">
                {t.defaultMinutes} min sugeridos
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-line bg-bg-alt/30 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
          Guía · {typeInfo.label}
        </p>
        <ol className="space-y-1.5">
          {typeInfo.steps.map((s, i) => (
            <li key={i} className="flex gap-2 font-body text-sm text-ink">
              <span className="text-muted font-mono text-xs tabular-nums mt-0.5">
                {i + 1}.
              </span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
          Duración
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {[3, 5, 8, 10, 15, 20, 30].map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={clsx(
                "h-10 px-4 rounded-full font-mono text-xs uppercase tracking-widest transition-all",
                minutes === m
                  ? "bg-accent text-bg"
                  : "bg-bg-alt text-muted border border-line hover:text-ink"
              )}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
          Intención
        </p>
        <input
          type="text"
          value={intention}
          onChange={(e) => setIntention(e.target.value.slice(0, 200))}
          placeholder="Una frase corta."
          className="w-full rounded-lg border border-line bg-bg px-4 py-3 font-body text-base text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          {DISPENZA_INTENTIONS.slice(0, 5).map((p) => (
            <button
              key={p}
              onClick={() => setIntention(p)}
              className="font-body text-[11px] text-muted hover:text-accent hover:underline underline-offset-2 transition-colors px-2 py-1"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
          ¿Cómo te sientes ahora? <span className="text-accent">*</span>
        </p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setFeelingBefore(n)}
              className={clsx(
                "flex-1 h-11 rounded-lg font-mono text-sm transition-all",
                feelingBefore === n
                  ? "bg-accent text-bg font-medium"
                  : "bg-bg-alt text-muted hover:text-ink border border-line"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted mt-1.5">
          <span>Denso</span>
          <span>Elevado</span>
        </div>
      </div>

      <button
        disabled={!canStart}
        onClick={onStart}
        className="w-full h-12 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
      >
        <Play size={16} />
        Comenzar sesión
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TimerPanel
// ─────────────────────────────────────────────────────────────

function TimerPanel({
  typeInfo,
  remainingMs,
  totalMs,
  paused,
  onPauseResume,
  onCancel,
  onFinishEarly,
}: {
  typeInfo: MeditationTypeInfo;
  remainingMs: number;
  totalMs: number;
  paused: boolean;
  onPauseResume: () => void;
  onCancel: () => void;
  onFinishEarly: () => void;
}) {
  const progress = 1 - remainingMs / totalMs;
  const mins = Math.floor(remainingMs / 60_000);
  const secs = Math.floor((remainingMs % 60_000) / 1000);

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        {typeInfo.label}
      </p>

      {/* Ring */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-line"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className="text-accent transition-[stroke-dashoffset] duration-200"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display italic text-5xl sm:text-6xl text-ink leading-none tabular-nums">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-3">
            {paused ? "Pausado" : "Respira"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="w-11 h-11 rounded-full border border-line text-muted hover:text-ink hover:border-accent/40 transition-colors flex items-center justify-center"
          aria-label="Cancelar"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={onPauseResume}
          className="w-14 h-14 rounded-full bg-accent text-bg hover:opacity-90 transition-opacity flex items-center justify-center"
          aria-label={paused ? "Reanudar" : "Pausar"}
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        <button
          onClick={onFinishEarly}
          className="w-11 h-11 rounded-full border border-line text-muted hover:text-ink hover:border-accent/40 transition-colors flex items-center justify-center"
          aria-label="Terminar antes"
        >
          <Check size={16} />
        </button>
      </div>

      <p className="font-body text-xs text-muted text-center max-w-prose">
        Observa. No fuerces. Si tu mente se va, vuelve con suavidad al
        pecho, a la respiración, a la intención.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FinishPanel
// ─────────────────────────────────────────────────────────────

function FinishPanel({
  feelingAfter,
  setFeelingAfter,
  notes,
  setNotes,
  saving,
  onSave,
}: {
  feelingAfter: number | null;
  setFeelingAfter: (n: number) => void;
  notes: string;
  setNotes: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const canSave = feelingAfter != null && !saving;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-accent/30 bg-accent/5 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Sesión completada
          </p>
        </div>
        <h2 className="font-display italic text-2xl text-ink mt-2">
          ¿Cómo te sientes ahora?
        </h2>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
          Estado después
        </p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setFeelingAfter(n)}
              className={clsx(
                "flex-1 h-12 rounded-lg font-mono text-sm transition-all",
                feelingAfter === n
                  ? "bg-accent text-bg font-medium"
                  : "bg-bg-alt text-muted hover:text-ink border border-line"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted mt-1.5">
          <span>Denso</span>
          <span>Elevado</span>
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
          Notas (opcional)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Lo que surgió, lo que soltaste, lo que volvieron a encontrar."
          className="w-full rounded-lg border border-line bg-bg px-4 py-3 font-body text-base text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
      </div>

      <button
        disabled={!canSave}
        onClick={onSave}
        className="w-full h-12 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Check size={16} />
        )}
        Guardar sesión
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

