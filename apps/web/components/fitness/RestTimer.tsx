"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, X, Plus, Minus } from "lucide-react";
import { clsx } from "clsx";

/**
 * Rest timer entre series. Cuenta DESCENDENTE desde un valor
 * configurable (default 90s — típico para hipertrofia). Al
 * completar, vibra el dispositivo (si soporta) y reproduce un
 * tono breve.
 *
 * Uso: el caller lo monta cuando el user agrega una serie. Se
 * autocierra al terminar o el user lo descarta con X.
 */
export function RestTimer(props: {
  defaultSeconds?: number;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { defaultSeconds = 90, onClose, onComplete } = props;
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);

  const startedAtRef = useRef<number | null>(null);
  const initialSecondsRef = useRef<number>(defaultSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (paused || completed) return;
    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
      initialSecondsRef.current = seconds;
    }
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - (startedAtRef.current ?? 0)) / 1000;
      const remaining = Math.max(0, initialSecondsRef.current - elapsed);
      setSeconds(remaining);
      if (remaining <= 0 && !hasFiredRef.current) {
        hasFiredRef.current = true;
        setCompleted(true);
        beep();
        if ("vibrate" in navigator) {
          try {
            (navigator as Navigator & { vibrate: (p: number[]) => boolean }).vibrate([
              200, 100, 200,
            ]);
          } catch {
            /* noop */
          }
        }
        onComplete?.();
      }
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, completed, onComplete]);

  function togglePause() {
    if (paused) {
      // Resume — recalcula startedAt para que reste sólo el tiempo restante.
      startedAtRef.current = Date.now();
      initialSecondsRef.current = seconds;
      setPaused(false);
    } else {
      setPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }

  function adjust(delta: number) {
    setSeconds((s) => {
      const newVal = Math.max(0, s + delta);
      initialSecondsRef.current = newVal;
      startedAtRef.current = Date.now();
      hasFiredRef.current = false;
      setCompleted(false);
      return newVal;
    });
  }

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const totalProgress = 1 - seconds / initialSecondsRef.current;

  return (
    <div
      className={clsx(
        "fixed bottom-20 sm:bottom-6 right-4 z-[90] rounded-card shadow-2xl border-2 p-4 w-72",
        "transition-colors",
        completed
          ? "bg-success/15 border-success animate-pulse"
          : "bg-bg-deep/95 border-accent/40 backdrop-blur"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          {completed ? "¡Descansa lo justo, ahora!" : "Descanso"}
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded text-muted hover:text-ink"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      </div>

      <div className="text-center py-2">
        <p
          className={clsx(
            "font-display italic text-5xl tabular-nums",
            completed ? "text-success" : "text-white"
          )}
        >
          {minutes}:{secs.toString().padStart(2, "0")}
        </p>
      </div>

      <div className="h-1 bg-line/40 rounded-full overflow-hidden mb-3">
        <div
          className={clsx(
            "h-full transition-all",
            completed ? "bg-success" : "bg-accent"
          )}
          style={{ width: `${Math.min(100, totalProgress * 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => adjust(-15)}
          className="px-2 py-1.5 rounded-md border border-line/40 text-white/70 hover:text-white text-[11px] font-mono inline-flex items-center gap-1"
        >
          <Minus size={11} /> 15s
        </button>
        <button
          onClick={togglePause}
          className="flex-1 py-1.5 rounded-md bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 inline-flex items-center justify-center gap-1.5"
        >
          {paused ? <Play size={12} /> : <Pause size={12} />}
          {paused ? "Reanudar" : "Pausar"}
        </button>
        <button
          onClick={() => adjust(15)}
          className="px-2 py-1.5 rounded-md border border-line/40 text-white/70 hover:text-white text-[11px] font-mono inline-flex items-center gap-1"
        >
          <Plus size={11} /> 15s
        </button>
      </div>
    </div>
  );
}

/** Pequeño beep usando Web Audio API. */
function beep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(() => ctx.close(), 500);
    }, 100);
  } catch {
    /* sin sonido si el browser bloquea AudioContext sin user gesture */
  }
}
