"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Wind,
} from "lucide-react";
import { clsx } from "clsx";
import {
  BREATH_PATTERNS,
  phaseLabel,
  totalSessionDuration,
  type BreathPattern,
} from "../../../../lib/mindset/breathwork-patterns";
import { useCreateMeditation } from "../../../../hooks/useMindset";

/**
 * Respira · breathwork timer.
 *
 * Estado:
 *  - Pre-sesión: lista de patrones, slider de ciclos, tap "Empezar".
 *  - En sesión: círculo grande respirando, fase actual + countdown,
 *    contador de ciclos, botón pausa / reset.
 *  - Post-sesión: resumen + opción de loggear como meditación.
 *
 * Animación: el círculo se escala según la fase. Inhale → grande,
 * exhale → pequeño, holds → tamaño actual mantenido. Smooth via
 * CSS transition para evitar requestAnimationFrame innecesario.
 */
export function RespiraClient() {
  const [patternId, setPatternId] = useState<string>(BREATH_PATTERNS[0].id);
  const [cycles, setCycles] = useState<number>(BREATH_PATTERNS[0].defaultCycles);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const pattern = useMemo(
    () => BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0],
    [patternId]
  );

  // Cuando cambias el patrón, ajusta cycles al default.
  useEffect(() => {
    setCycles(pattern.defaultCycles);
  }, [pattern.id, pattern.defaultCycles]);

  function start() {
    setCompleted(false);
    setRunning(true);
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href="/reflexiones"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft size={11} /> Volver a Mentalidad
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Respira · breathwork
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl leading-tight">
            La respiración es un mando.
          </h1>
          <p className="font-body text-white/60 text-sm mt-3 max-w-prose leading-relaxed">
            Cinco patrones probados. Calma, foco, o energía — eliges
            cuál necesitas hoy.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {!running && !completed && (
          <SetupPanel
            pattern={pattern}
            cycles={cycles}
            onPatternChange={setPatternId}
            onCyclesChange={setCycles}
            onStart={start}
          />
        )}
        {running && (
          <RunSession
            pattern={pattern}
            cycles={cycles}
            onAbort={() => setRunning(false)}
            onComplete={() => {
              setRunning(false);
              setCompleted(true);
            }}
          />
        )}
        {completed && (
          <CompletePanel
            pattern={pattern}
            cycles={cycles}
            onAgain={() => {
              setCompleted(false);
              setRunning(false);
            }}
          />
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Setup panel — pick pattern + cycles
// ─────────────────────────────────────────────────────────────

function SetupPanel({
  pattern,
  cycles,
  onPatternChange,
  onCyclesChange,
  onStart,
}: {
  pattern: BreathPattern;
  cycles: number;
  onPatternChange: (id: string) => void;
  onCyclesChange: (n: number) => void;
  onStart: () => void;
}) {
  const totalSec = totalSessionDuration(pattern, cycles);
  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-2">
        {BREATH_PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPatternChange(p.id)}
            className={clsx(
              "text-left rounded-card border p-4 transition-all",
              p.id === pattern.id
                ? "border-accent bg-accent/5"
                : "border-line bg-bg-alt/30 hover:border-line-strong"
            )}
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <p className="font-display italic text-lg text-ink">{p.name}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
                {p.tone === "calm"
                  ? "calma"
                  : p.tone === "focus"
                    ? "foco"
                    : "energía"}
              </p>
            </div>
            <p className="font-body text-xs text-muted">{p.short}</p>
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="rounded-card border-l-2 border-accent/40 pl-4 sm:pl-5">
        <p className="font-body text-sm text-ink leading-relaxed">
          {pattern.long}
        </p>
        {pattern.source && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-2">
            {pattern.source}
          </p>
        )}
      </div>

      {/* Cycles slider */}
      <div className="rounded-card border border-line bg-bg-alt/30 p-4 sm:p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
          Ciclos
        </p>
        <div className="flex items-baseline gap-2">
          <p className="font-display italic text-3xl text-ink">{cycles}</p>
          <p className="font-body text-sm text-muted">
            ≈ {formatDuration(totalSec)}
          </p>
        </div>
        <input
          type="range"
          min={1}
          max={pattern.id === "wim-hof-mini" ? 50 : 20}
          value={cycles}
          onChange={(e) => onCyclesChange(parseInt(e.target.value, 10))}
          className="w-full mt-3 accent-accent"
        />
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-card bg-accent text-bg font-body font-medium hover:opacity-90 transition-opacity"
      >
        <Play size={16} /> Empezar
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Run session — circle animation + phase ticking
// ─────────────────────────────────────────────────────────────

function RunSession({
  pattern,
  cycles,
  onAbort,
  onComplete,
}: {
  pattern: BreathPattern;
  cycles: number;
  onAbort: () => void;
  onComplete: () => void;
}) {
  const [paused, setPaused] = useState(false);
  const [cycleIdx, setCycleIdx] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const phase = pattern.cycle[phaseIdx];
  const phaseDur = phase.seconds;

  // Tick: cada 100ms avanza el progreso de la fase. Cuando llega
  // al final, salta a la siguiente.
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setPhaseElapsed((e) => {
        const next = e + 0.1;
        if (next >= phaseDur) {
          // Avanzar fase
          setPhaseIdx((idx) => {
            const nextIdx = idx + 1;
            if (nextIdx >= pattern.cycle.length) {
              // Avanzar ciclo
              setCycleIdx((c) => {
                const nextCycle = c + 1;
                if (nextCycle >= cycles) {
                  // Done
                  setTimeout(onComplete, 0);
                  return c;
                }
                return nextCycle;
              });
              return 0;
            }
            return nextIdx;
          });
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [paused, phaseDur, pattern.cycle.length, cycles, onComplete]);

  // Color e icon mapping
  const phaseRatio = phaseElapsed / phaseDur;
  const scale = phaseScale(phase.kind, phaseRatio);

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Big breath circle */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-accent/20" />
        <div
          className="absolute rounded-full bg-accent/20 transition-all duration-300 ease-in-out"
          style={{
            width: `${scale * 100}%`,
            height: `${scale * 100}%`,
            opacity: 0.7,
          }}
        />
        <div
          className="absolute rounded-full bg-accent/40 transition-all duration-300 ease-in-out"
          style={{
            width: `${scale * 80}%`,
            height: `${scale * 80}%`,
          }}
        />
        <div className="relative z-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Ciclo {cycleIdx + 1} / {cycles}
          </p>
          <p className="font-display italic text-3xl sm:text-4xl text-ink mt-1">
            {phaseLabel(phase.kind)}
          </p>
          <p className="font-display italic text-5xl sm:text-6xl text-accent mt-1 tabular-nums">
            {Math.max(1, Math.ceil(phaseDur - phaseElapsed))}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAbort}
          className="h-11 px-4 rounded-full border border-line text-muted hover:text-ink hover:border-line-strong font-mono text-[10px] uppercase tracking-widest"
        >
          <RotateCcw size={12} className="inline mr-1" /> Salir
        </button>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="h-12 w-12 rounded-full bg-accent text-bg flex items-center justify-center hover:opacity-90"
          aria-label={paused ? "Reanudar" : "Pausar"}
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </div>

      {/* Tip */}
      <p className="font-body text-xs text-muted italic max-w-sm text-center leading-relaxed">
        Si te mareas, detén la sesión y respira normal. La incomodidad
        leve es información — el dolor real, una señal.
      </p>
      {/* Suppress unused-var when started_at debug needed */}
      <span className="hidden">{startedAtRef.current}</span>
    </div>
  );
}

function phaseScale(kind: string, ratio: number): number {
  // Returns 0.4..1.0 based on phase
  // inhale: grow 0.4 → 1.0
  // hold-in: stay at 1.0
  // exhale: shrink 1.0 → 0.4
  // hold-out: stay at 0.4
  if (kind === "inhale") return 0.4 + 0.6 * ratio;
  if (kind === "hold-in") return 1.0;
  if (kind === "exhale") return 1.0 - 0.6 * ratio;
  if (kind === "hold-out") return 0.4;
  return 0.7;
}

// ─────────────────────────────────────────────────────────────
// Complete panel — log session
// ─────────────────────────────────────────────────────────────

function CompletePanel({
  pattern,
  cycles,
  onAgain,
}: {
  pattern: BreathPattern;
  cycles: number;
  onAgain: () => void;
}) {
  const create = useCreateMeditation();
  const [logged, setLogged] = useState(false);
  const [feeling, setFeeling] = useState<number | null>(null);

  async function logSession() {
    await create.mutateAsync({
      meditation_type: "respiracion",
      duration_seconds: Math.round(totalSessionDuration(pattern, cycles)),
      intention: pattern.name,
      feeling_after: feeling,
    });
    setLogged(true);
  }

  return (
    <div className="text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-accent/20 text-accent mx-auto flex items-center justify-center mb-4">
        <Wind size={28} />
      </div>
      <h2 className="font-display italic text-2xl text-ink mb-2">
        Sesión completa.
      </h2>
      <p className="font-body text-sm text-muted leading-relaxed mb-6">
        {cycles} ciclos de {pattern.name} ·{" "}
        {formatDuration(totalSessionDuration(pattern, cycles))}.
      </p>

      {!logged && (
        <div className="rounded-card border border-line bg-bg-alt/40 p-5 mb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
            ¿Cómo te sientes ahora?
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            {["😞", "😕", "😐", "🙂", "😄"].map((emoji, i) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFeeling(i + 1)}
                className={clsx(
                  "w-10 h-10 rounded-full border text-lg transition-all",
                  feeling === i + 1
                    ? "border-accent bg-accent/10 scale-110"
                    : "border-line bg-bg hover:border-line-strong"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={logSession}
            disabled={create.isPending}
            className="w-full h-10 rounded-lg bg-accent text-bg font-body text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Registrar sesión
          </button>
        </div>
      )}

      {logged && (
        <p className="font-body text-sm text-success mb-4">
          ✓ Sesión guardada en tu historial.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <button
          type="button"
          onClick={onAgain}
          className="h-11 px-6 rounded-full border border-line text-ink hover:border-line-strong font-body text-sm"
        >
          Otra sesión
        </button>
        <Link
          href="/reflexiones"
          className="h-11 px-6 rounded-full bg-accent text-bg font-body font-medium text-sm hover:opacity-90 inline-flex items-center justify-center"
        >
          Volver a Mentalidad
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDuration(sec: number): string {
  const total = Math.round(sec);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}
