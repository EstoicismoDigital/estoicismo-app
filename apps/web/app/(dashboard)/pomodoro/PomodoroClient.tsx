"use client";
import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  Coffee,
  Settings,
  X,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";

/**
 * Pomodoro · técnica de trabajo en bloques de 25 minutos.
 *
 * Default: 25 min focus → 5 min break, cada 4 ciclos un break largo
 * de 15 min. Configurable.
 *
 * Persistencia: configuración + count de pomodoros del día en
 * localStorage. Sin DB porque la mayoría de users lo usa de forma
 * efímera.
 *
 * Date.now() based — resistente a background throttling del browser.
 */

type Phase = "focus" | "short_break" | "long_break";

type PomodoroSettings = {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  cyclesUntilLongBreak: number;
};

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesUntilLongBreak: 4,
};

const SETTINGS_KEY = "pomodoro:settings";
const COUNT_KEY_PREFIX = "pomodoro:count:";

function readSettings(): PomodoroSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const v = window.localStorage.getItem(SETTINGS_KEY);
    if (v) {
      const parsed = JSON.parse(v);
      return {
        focusMin: parsed.focusMin ?? DEFAULT_SETTINGS.focusMin,
        shortBreakMin: parsed.shortBreakMin ?? DEFAULT_SETTINGS.shortBreakMin,
        longBreakMin: parsed.longBreakMin ?? DEFAULT_SETTINGS.longBreakMin,
        cyclesUntilLongBreak:
          parsed.cyclesUntilLongBreak ??
          DEFAULT_SETTINGS.cyclesUntilLongBreak,
      };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

function writeSettings(s: PomodoroSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function todayKey(): string {
  return COUNT_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

function readCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = window.localStorage.getItem(todayKey());
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function bumpCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const next = readCount() + 1;
    window.localStorage.setItem(todayKey(), String(next));
    return next;
  } catch {
    return 0;
  }
}

export function PomodoroClient() {
  const [settings, setSettingsState] = useState<PomodoroSettings>(
    DEFAULT_SETTINGS
  );
  const [phase, setPhase] = useState<Phase>("focus");
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  // endsAt es timestamp absoluto (ms). Date.now() based para que
  // background throttling no afecte la cuenta.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0); // segundos
  const [completedCycles, setCompletedCycles] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [taskLabel, setTaskLabel] = useState("");
  // Boot: leer config y count
  useEffect(() => {
    setSettingsState(readSettings());
    setTodayCount(readCount());
  }, []);

  // Tick cada 250ms para suavidad visual sin gastar CPU
  useEffect(() => {
    if (!running || paused || endsAt == null) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(interval);
        onPhaseComplete();
      }
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused, endsAt]);

  // Cuando cambia phase, resetea remaining
  useEffect(() => {
    if (running && !paused && endsAt != null) {
      setRemaining(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
    } else {
      const seconds = phaseDuration(phase, settings) * 60;
      setRemaining(seconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, settings]);

  function phaseDuration(p: Phase, s: PomodoroSettings): number {
    if (p === "focus") return s.focusMin;
    if (p === "long_break") return s.longBreakMin;
    return s.shortBreakMin;
  }

  function start() {
    const seconds = phaseDuration(phase, settings) * 60;
    setEndsAt(Date.now() + seconds * 1000);
    setRunning(true);
    setPaused(false);
    setRemaining(seconds);
  }

  function togglePause() {
    if (!running) {
      start();
      return;
    }
    if (paused) {
      // Reanudar: re-anchor endsAt
      setEndsAt(Date.now() + remaining * 1000);
      setPaused(false);
    } else {
      setPaused(true);
    }
  }

  function reset() {
    setRunning(false);
    setPaused(false);
    setEndsAt(null);
    setRemaining(phaseDuration(phase, settings) * 60);
  }

  function skip() {
    onPhaseComplete();
  }

  function onPhaseComplete() {
    // Audio + vibration
    try {
      if (typeof window !== "undefined") {
        // Beep simple via Web Audio API
        const ctx = new (window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = phase === "focus" ? 880 : 660;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.3,
          ctx.currentTime + 0.05
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + 0.6
        );
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
        // Cleanup AudioContext
        setTimeout(() => ctx.close(), 1000);
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {
      /* ignore */
    }

    // Si terminé un focus → bump count + decidir tipo de break
    if (phase === "focus") {
      const next = bumpCount();
      setTodayCount(next);
      const newCycles = completedCycles + 1;
      setCompletedCycles(newCycles);
      const isLongBreak =
        newCycles % settings.cyclesUntilLongBreak === 0;
      setPhase(isLongBreak ? "long_break" : "short_break");
    } else {
      // Terminó break → vuelve a focus
      setPhase("focus");
    }

    setRunning(false);
    setPaused(false);
    setEndsAt(null);
  }

  const total = phaseDuration(phase, settings) * 60;
  const elapsed = total - remaining;
  const progress = total > 0 ? elapsed / total : 0;

  const phaseLabel: Record<Phase, string> = {
    focus: "Trabajo profundo",
    short_break: "Descanso corto",
    long_break: "Descanso largo",
  };

  const phaseColor: Record<Phase, string> = {
    focus: "text-accent",
    short_break: "text-success",
    long_break: "text-success",
  };

  return (
    <div data-module="habits" className="min-h-screen">
      {/* Hero */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href="/habitos"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-white mb-4"
          >
            ← Volver a Hábitos
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Pomodoro
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl leading-tight">
            Trabajo profundo en bloques.
          </h1>
          <p className="font-body text-white/60 text-sm mt-3 max-w-prose leading-relaxed">
            25 minutos de foco, 5 de descanso. Cada 4 ciclos, descanso
            largo. Tu cerebro está hecho para sprints, no maratones.
          </p>
        </div>
      </section>

      {/* Timer */}
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-card border border-line bg-bg-alt/40 p-6 sm:p-8">
          {/* Phase label + settings */}
          <div className="flex items-center gap-2 mb-6">
            <Timer
              size={14}
              className={clsx("shrink-0", phaseColor[phase])}
            />
            <p
              className={clsx(
                "font-mono text-[10px] uppercase tracking-widest",
                phaseColor[phase]
              )}
            >
              {phaseLabel[phase]}
            </p>
            <span className="h-px flex-1 bg-line" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Ciclo {completedCycles + 1}
            </p>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="h-7 w-7 rounded-full text-muted hover:text-ink hover:bg-bg flex items-center justify-center"
              aria-label="Ajustes"
            >
              <Settings size={12} />
            </button>
          </div>

          {/* Big circular timer */}
          <div className="relative w-60 h-60 sm:w-72 sm:h-72 mx-auto mb-6">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx={50}
                cy={50}
                r={46}
                stroke="currentColor"
                strokeWidth={3}
                fill="none"
                className="text-line"
              />
              <circle
                cx={50}
                cy={50}
                r={46}
                stroke="currentColor"
                strokeWidth={3}
                fill="none"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={(1 - progress) * 2 * Math.PI * 46}
                strokeLinecap="round"
                className={clsx(
                  "transition-all duration-300",
                  phase === "focus" ? "text-accent" : "text-success"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display italic text-5xl sm:text-6xl text-ink tabular-nums leading-none">
                {formatTime(remaining)}
              </p>
              {phase === "focus" ? (
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-3">
                  Foco · sin distracciones
                </p>
              ) : (
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-3 inline-flex items-center gap-1">
                  <Coffee size={11} /> Descanso · respira
                </p>
              )}
            </div>
          </div>

          {/* Optional task label */}
          {phase === "focus" && (
            <input
              type="text"
              value={taskLabel}
              onChange={(e) => setTaskLabel(e.target.value)}
              maxLength={80}
              placeholder="¿En qué vas a trabajar?"
              className="w-full bg-transparent border-0 text-center font-body italic text-base text-muted placeholder:text-muted/40 focus:outline-none focus:text-ink mb-6"
            />
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              disabled={!running && remaining === total}
              aria-label="Reset"
              className="h-11 w-11 rounded-full border border-line text-muted hover:text-ink hover:border-line-strong disabled:opacity-30 flex items-center justify-center"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={togglePause}
              className={clsx(
                "h-14 w-14 rounded-full flex items-center justify-center transition-colors",
                running && !paused
                  ? "bg-bg-alt text-ink"
                  : "bg-accent text-bg hover:opacity-90"
              )}
              aria-label={running && !paused ? "Pausar" : "Iniciar"}
            >
              {running && !paused ? (
                <Pause size={20} />
              ) : (
                <Play size={20} />
              )}
            </button>
            <button
              type="button"
              onClick={skip}
              aria-label="Saltar fase"
              className="h-11 w-11 rounded-full border border-line text-muted hover:text-ink hover:border-line-strong flex items-center justify-center"
            >
              <SkipForward size={16} />
            </button>
          </div>
        </div>

        {/* Today stats */}
        <div className="mt-6 rounded-card border border-line bg-bg-alt/30 p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Pomodoros hoy
            </p>
            <p className="font-display italic text-2xl text-ink mt-0.5">
              {todayCount}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
            {Array.from({ length: Math.min(todayCount, 16) }).map((_, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-full bg-accent"
                aria-hidden
              />
            ))}
            {todayCount > 16 && (
              <span className="font-mono text-[10px] text-muted ml-1">
                +{todayCount - 16}
              </span>
            )}
          </div>
        </div>

        {/* Tip */}
        <p className="mt-6 font-body text-xs text-muted text-center max-w-prose mx-auto leading-relaxed italic">
          Cierra notificaciones. Pon el teléfono en otro cuarto. La regla
          es simple: un solo foco por bloque.
        </p>
      </section>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={(s) => {
            setSettingsState(s);
            writeSettings(s);
            setShowSettings(false);
            // Si cambia la duración del phase actual, reset remaining
            if (!running) {
              setRemaining(phaseDuration(phase, s) * 60);
            }
          }}
        />
      )}
    </div>
  );
}

function SettingsModal({
  settings,
  onClose,
  onSave,
}: {
  settings: PomodoroSettings;
  onClose: () => void;
  onSave: (s: PomodoroSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-bg rounded-card border border-line shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h3 className="font-display italic text-xl text-ink">
            Ajustes Pomodoro
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <NumberField
            label="Foco"
            unit="min"
            value={draft.focusMin}
            min={5}
            max={90}
            onChange={(v) => setDraft({ ...draft, focusMin: v })}
          />
          <NumberField
            label="Descanso corto"
            unit="min"
            value={draft.shortBreakMin}
            min={1}
            max={30}
            onChange={(v) => setDraft({ ...draft, shortBreakMin: v })}
          />
          <NumberField
            label="Descanso largo"
            unit="min"
            value={draft.longBreakMin}
            min={5}
            max={60}
            onChange={(v) => setDraft({ ...draft, longBreakMin: v })}
          />
          <NumberField
            label="Ciclos hasta descanso largo"
            value={draft.cyclesUntilLongBreak}
            min={2}
            max={8}
            onChange={(v) =>
              setDraft({ ...draft, cyclesUntilLongBreak: v })
            }
          />
        </div>
        <div className="p-4 border-t border-line flex items-center justify-end gap-2">
          <button
            onClick={() => setDraft(DEFAULT_SETTINGS)}
            className="h-10 px-4 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg-alt"
          >
            Default
          </button>
          <button
            onClick={() => onSave(draft)}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-accent text-bg font-body text-sm font-medium hover:opacity-90"
          >
            <Check size={14} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-body text-sm text-ink flex-1 min-w-0">{label}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-8 w-8 rounded-full border border-line text-muted hover:text-ink"
          aria-label="Menos"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (Number.isFinite(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          className="w-14 text-center font-display italic text-lg text-ink bg-bg-alt rounded border border-line px-1 py-1 focus:outline-none focus:ring-2 focus:ring-accent tabular-nums"
        />
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted ml-1">
            {unit}
          </span>
        )}
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-8 w-8 rounded-full border border-line text-muted hover:text-ink"
          aria-label="Más"
        >
          +
        </button>
      </div>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
