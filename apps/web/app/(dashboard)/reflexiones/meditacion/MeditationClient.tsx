"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  Check,
  Loader2,
  Sparkles,
  Volume2,
  VolumeX,
  Waves,
  Send,
  Headphones,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import {
  MEDITATION_TYPES,
  DISPENZA_INTENTIONS,
  MEDITATION_FREQUENCIES,
  type MeditationTypeInfo,
  type FrequencyPreset,
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
 *   3. (Opcional) escoger frecuencia de fondo para acompañar
 *   4. Temporizador con pausa / reanudar / reiniciar
 *   5. Al terminar: feeling-after + registrar en DB
 *
 * El temporizador usa Date.now() como fuente de verdad para no
 * desviarse si la pestaña queda en background (setInterval 250ms).
 *
 * Audio de fondo (cuando el usuario escoge una frecuencia curada):
 *   - Un AudioContext lazy por sesión (Chrome autoplay policy:
 *     solo se crea dentro del click de "Comenzar sesión").
 *   - Un OscillatorNode sine → GainNode → destination.
 *   - Fade-in largo (1.5s) y fade-out (0.8s) para no cortar bruscos.
 *   - Volumen fijo bajo (0.12) — es fondo, no protagonista.
 *   - Pausa/reanudar respeta el audio: al pausar el timer también
 *     silenciamos el tono; al reanudar vuelve.
 */

type Phase =
  | "setup" // escoge tipo + intención + feeling_before
  | "running" // corriendo o pausado
  | "finished"; // pide feeling_after + confirmación

/**
 * Volumen bajo fijo para el tono de fondo durante la meditación.
 * No debe competir con la respiración/mente — es ambiental.
 */
const MEDITATION_BG_VOLUME = 0.12;

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

  // --- Frequency state (opcional) ---
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyPreset | null>(
    null
  );
  const [audioMuted, setAudioMuted] = useState(false);

  // --- Gate de audífonos antes de arrancar ---
  // La meditación se beneficia de audífonos (aislamiento + binaural).
  // Mostramos un micro-popup para evitar arranques accidentales con
  // audio inesperado por los altavoces del dispositivo.
  const [showHeadphones, setShowHeadphones] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

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
        stopBackgroundFrequency();
        setPhase("finished");
      } else {
        setRemainingMs(left);
      }
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, endAt]);

  // Silenciar / activar el tono de fondo en caliente.
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;
    const target = audioMuted || paused ? 0 : MEDITATION_BG_VOLUME;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.4);
  }, [audioMuted, paused]);

  // Cleanup del AudioContext al desmontar.
  useEffect(() => {
    return () => {
      stopBackgroundFrequency();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startBackgroundFrequency(preset: FrequencyPreset) {
    // Lazy init — este handler vive dentro del onClick de "Comenzar",
    // así que satisface el requisito de gesto de usuario de Chrome.
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      audioCtxRef.current = new Ctx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(preset.hz, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    // Fade-in largo (1.5s) para no interrumpir la entrada a la sesión.
    gain.gain.linearRampToValueAtTime(
      audioMuted ? 0 : MEDITATION_BG_VOLUME,
      ctx.currentTime + 1.5
    );

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    oscRef.current = osc;
    gainRef.current = gain;
  }

  function stopBackgroundFrequency() {
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    const osc = oscRef.current;
    if (ctx && gain && osc) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      try {
        osc.stop(now + 0.9);
      } catch {
        // ya detenido
      }
    }
    oscRef.current = null;
    gainRef.current = null;
  }

  function handleStart() {
    const ms = minutes * 60_000;
    setEndAt(Date.now() + ms);
    setRemainingMs(ms);
    setPaused(false);
    setPhase("running");
    if (selectedFrequency) {
      void startBackgroundFrequency(selectedFrequency);
    }
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
    stopBackgroundFrequency();
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
    stopBackgroundFrequency();
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
            selectedFrequency={selectedFrequency}
            setSelectedFrequency={setSelectedFrequency}
            onRequestStart={() => setShowHeadphones(true)}
          />
        )}

        {phase === "running" && (
          <TimerPanel
            typeInfo={typeInfo}
            remainingMs={remainingMs}
            totalMs={minutes * 60_000}
            paused={paused}
            selectedFrequency={selectedFrequency}
            audioMuted={audioMuted}
            onToggleMute={() => setAudioMuted((m) => !m)}
            onPauseResume={handlePauseResume}
            onCancel={handleCancel}
            onFinishEarly={() => {
              stopBackgroundFrequency();
              setPhase("finished");
            }}
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

      {/* Gate de audífonos — aparece al pulsar "Comenzar sesión" */}
      {showHeadphones && (
        <HeadphonesGate
          hasFrequency={selectedFrequency != null}
          onCancel={() => setShowHeadphones(false)}
          onConfirm={() => {
            setShowHeadphones(false);
            handleStart();
          }}
        />
      )}

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
  selectedFrequency,
  setSelectedFrequency,
  onRequestStart,
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
  selectedFrequency: FrequencyPreset | null;
  setSelectedFrequency: (f: FrequencyPreset | null) => void;
  onRequestStart: () => void;
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
          {[3, 5, 8, 10, 15, 20, 30, 40].map((m) => (
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

      {/* Frecuencia de fondo — opcional, curada para estados alterados */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Frecuencia de fondo
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted/60">
            Opcional
          </p>
        </div>
        <p className="font-body text-xs text-muted leading-relaxed mb-3">
          Tonos puros comprobados para inducir estados meditativos profundos
          (theta, alpha, Schumann). Úsalos con auriculares a volumen bajo.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => setSelectedFrequency(null)}
            className={clsx(
              "text-left p-3 rounded-card border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              selectedFrequency == null
                ? "border-accent bg-accent/5"
                : "border-line bg-bg-alt/40 hover:border-accent/40"
            )}
          >
            <p className="font-display italic text-base text-ink leading-snug">
              Silencio
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-1.5">
              Sin tono · respiración y mente
            </p>
          </button>
          {MEDITATION_FREQUENCIES.map((f) => {
            const active = selectedFrequency?.key === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setSelectedFrequency(f)}
                className={clsx(
                  "text-left p-3 rounded-card border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  active
                    ? "border-accent bg-accent/5"
                    : "border-line bg-bg-alt/40 hover:border-accent/40"
                )}
              >
                <p className="font-display italic text-base text-ink leading-snug">
                  {f.summary}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-1.5">
                  <span className="text-ink/80">{f.label}</span>
                  {f.brainwave && (
                    <>
                      <span className="mx-1.5 text-muted/50">·</span>
                      {f.brainwave}
                    </>
                  )}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Carta al universo — la intención como gesto de escritura
          sagrada. Card neutral con el acento solo en íconos, foco y
          chips activos: la sección tiene identidad propia, el color
          vive solo en los detalles. */}
      <div className="rounded-card border border-line bg-bg-alt/30 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send size={14} className="text-accent" strokeWidth={1.5} />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Tu carta al universo
          </p>
        </div>

        <textarea
          value={intention}
          onChange={(e) => setIntention(e.target.value.slice(0, 200))}
          rows={2}
          placeholder="Una frase corta — lo que quieres llamar a la vida."
          className="w-full bg-transparent border-0 border-b border-line focus:border-accent focus:outline-none focus:ring-0 font-display italic text-lg sm:text-xl text-ink placeholder:text-muted/40 resize-none leading-relaxed pb-2 transition-colors"
        />

        <div className="flex items-center justify-between mt-3">
          <p className="font-body text-[11px] text-muted leading-relaxed">
            Escríbela desde el corazón. La leerás antes de cerrar los ojos.
          </p>
          <p className="font-mono text-[9px] text-muted/60 tabular-nums whitespace-nowrap ml-3">
            {intention.length}/200
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-line/60">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted/70 mb-2.5">
            Semillas
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DISPENZA_INTENTIONS.map((p) => {
              const active = intention === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setIntention(p)}
                  className={clsx(
                    "font-body text-[11px] rounded-full px-3 py-1 border transition-colors",
                    active
                      ? "bg-accent/10 border-accent/50 text-accent"
                      : "border-line text-muted hover:border-accent/40 hover:text-ink"
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
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
        onClick={onRequestStart}
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
  selectedFrequency,
  audioMuted,
  onToggleMute,
  onPauseResume,
  onCancel,
  onFinishEarly,
}: {
  typeInfo: MeditationTypeInfo;
  remainingMs: number;
  totalMs: number;
  paused: boolean;
  selectedFrequency: FrequencyPreset | null;
  audioMuted: boolean;
  onToggleMute: () => void;
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

      {/* Chip de frecuencia activa con toggle de audio */}
      {selectedFrequency && (
        <div className="flex items-center gap-2 rounded-full border border-line bg-bg-alt/60 pl-3 pr-1 py-1">
          <Waves size={12} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="text-ink/80">{selectedFrequency.label}</span>
            {selectedFrequency.brainwave && (
              <>
                <span className="mx-1.5 text-muted/50">·</span>
                {selectedFrequency.brainwave}
              </>
            )}
          </p>
          <button
            onClick={onToggleMute}
            aria-label={audioMuted ? "Activar sonido" : "Silenciar"}
            className="w-7 h-7 rounded-full text-muted hover:text-ink transition-colors flex items-center justify-center"
          >
            {audioMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>
      )}

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
// HeadphonesGate — modal que confirma audífonos antes de empezar
// ─────────────────────────────────────────────────────────────

function HeadphonesGate({
  hasFrequency,
  onCancel,
  onConfirm,
}: {
  hasFrequency: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Cerrar con Escape y bloquear scroll del body mientras está abierto.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="headphones-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-card border border-line bg-bg p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          aria-label="Cerrar"
          className="absolute top-3 right-3 w-8 h-8 rounded-full text-muted hover:text-ink transition-colors flex items-center justify-center"
        >
          <X size={16} />
        </button>

        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Headphones size={24} className="text-accent" strokeWidth={1.5} />
          </div>
        </div>

        <h3
          id="headphones-title"
          className="font-display italic text-2xl sm:text-3xl text-ink text-center leading-tight"
        >
          ¿Ya tienes los audífonos?
        </h3>

        <p className="font-body text-sm text-muted text-center leading-relaxed mt-3 max-w-sm mx-auto">
          {hasFrequency
            ? "La frecuencia que elegiste solo hace efecto binaural con audífonos. Ponlos antes de comenzar."
            : "Los audífonos aíslan el ruido del mundo y te ayudan a entrar más rápido al silencio."}
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onCancel}
            className="w-full sm:flex-1 h-11 rounded-lg border border-line text-muted hover:text-ink hover:border-accent/40 transition-colors font-body text-sm"
          >
            Aún no
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className="w-full sm:flex-1 h-11 rounded-lg bg-accent text-bg hover:opacity-90 transition-opacity font-body font-medium text-sm inline-flex items-center justify-center gap-2"
          >
            <Play size={14} />
            Estoy listo
          </button>
        </div>
      </div>
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

