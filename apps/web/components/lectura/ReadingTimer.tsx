"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { formatDuration } from "../../lib/reading/stats";

/**
 * Cronómetro de lectura.
 *
 * Patrón heredado de MeditationClient:
 *   - Usa Date.now() como fuente de verdad para sobrevivir background
 *     throttling de la pestaña.
 *   - setInterval(250ms) recalcula `elapsedMs` desde el `startedAt`.
 *   - Pausa: guardamos `accumulatedMs` y limpiamos startedAt.
 *   - Reset: vuelve a 0.
 *
 * Cuando el usuario detiene (stop), llama a `onComplete` con
 * los segundos totales — el padre abre la modal de resumen.
 */
export function ReadingTimer(props: {
  onComplete: (seconds: number) => void;
  disabled?: boolean;
}) {
  const { onComplete, disabled } = props;

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick recalcula desde startedAt para evitar drift.
  useEffect(() => {
    if (running && !paused) {
      intervalRef.current = setInterval(() => {
        if (startedAtRef.current) {
          setElapsedMs(accumulatedRef.current + (Date.now() - startedAtRef.current));
        }
      }, 250);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, paused]);

  function start() {
    if (disabled) return;
    startedAtRef.current = Date.now();
    accumulatedRef.current = 0;
    setElapsedMs(0);
    setRunning(true);
    setPaused(false);
  }

  function togglePause() {
    if (paused) {
      // resume
      startedAtRef.current = Date.now();
      setPaused(false);
    } else {
      // pause
      if (startedAtRef.current) {
        accumulatedRef.current += Date.now() - startedAtRef.current;
        startedAtRef.current = null;
      }
      setPaused(true);
    }
  }

  function reset() {
    setRunning(false);
    setPaused(false);
    startedAtRef.current = null;
    accumulatedRef.current = 0;
    setElapsedMs(0);
  }

  function stop() {
    let total = elapsedMs;
    if (startedAtRef.current) {
      total = accumulatedRef.current + (Date.now() - startedAtRef.current);
    }
    const seconds = Math.max(0, Math.floor(total / 1000));
    setRunning(false);
    setPaused(false);
    startedAtRef.current = null;
    accumulatedRef.current = 0;
    setElapsedMs(0);
    onComplete(seconds);
  }

  return (
    <div className="rounded-card border border-line bg-bg-alt/40 p-6 sm:p-8 text-center space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        Cronómetro
      </p>
      <p
        className={clsx(
          "font-display italic text-5xl sm:text-6xl",
          running && !paused ? "text-ink" : "text-muted"
        )}
      >
        {formatTimerDisplay(elapsedMs)}
      </p>
      <div className="flex items-center justify-center gap-2">
        {!running ? (
          <button
            type="button"
            onClick={start}
            disabled={disabled}
            className="px-6 py-3 rounded-full bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
          >
            <Play size={14} /> Iniciar lectura
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={togglePause}
              className="px-4 py-2.5 rounded-full border border-line text-ink hover:bg-line/40 inline-flex items-center gap-1.5"
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? "Reanudar" : "Pausar"}
            </button>
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2.5 rounded-full bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Square size={12} /> Terminar
            </button>
            <button
              type="button"
              onClick={reset}
              className="p-2.5 rounded-full border border-line text-muted hover:text-ink"
              aria-label="Reiniciar"
            >
              <RotateCcw size={14} />
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-muted">
        Cuando termines, escribirás un breve resumen con tus palabras.
      </p>
    </div>
  );
}

/** mm:ss en lecturas cortas, h:mm:ss en lecturas largas. */
function formatTimerDisplay(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export { formatDuration };
