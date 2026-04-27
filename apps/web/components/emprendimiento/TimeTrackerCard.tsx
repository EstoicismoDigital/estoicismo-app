"use client";
import { useEffect, useMemo, useState } from "react";
import { Play, Square, Clock, Trash2, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import {
  useTimeEntries,
  useActiveTimeEntry,
  useStartTimeEntry,
  useStopTimeEntry,
  useDeleteTimeEntry,
} from "../../hooks/useBusiness";
import { totalMinutesSince } from "@estoicismo/supabase";

/**
 * Time tracker lite — un timer global con label + project libre.
 *
 * Diseño:
 *  - Si no hay entry activa: input para qué estás haciendo + Play.
 *  - Si hay activa: muestra contador en vivo (mm:ss) y botón Stop.
 *  - Resumen rápido: total de hoy y semana (sumando ended_at).
 *  - Lista compacta de últimas entries con duración y borrar.
 *
 * Sin proyectos formales (no FK), sin facturación. Eso es scope de
 * un módulo más serio que se puede agregar después.
 */

function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatLive(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekStartIso(): string {
  const d = new Date();
  const day = d.getDay(); // 0=dom
  const diff = day === 0 ? 6 : day - 1; // semana inicia en lunes
  d.setDate(d.getDate() - diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TimeTrackerCard() {
  const { data: entries = [], isLoading } = useTimeEntries();
  const { data: active } = useActiveTimeEntry();
  const start = useStartTimeEntry();
  const stop = useStopTimeEntry();
  const del = useDeleteTimeEntry();

  const [label, setLabel] = useState("");
  const [project, setProject] = useState("");

  // Live counter
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  const liveSeconds = useMemo(() => {
    if (!active) return 0;
    return Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000);
  }, [active]);

  const minsToday = totalMinutesSince(entries, todayIso());
  const minsWeek = totalMinutesSince(entries, weekStartIso());

  async function handleStart() {
    if (active) return;
    await start.mutateAsync({
      label: label.trim() || "Trabajo",
      project: project.trim() || null,
    });
    setLabel("");
    setProject("");
  }

  async function handleStop() {
    if (!active) return;
    await stop.mutateAsync(active.id);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleStart();
    }
  }

  return (
    <section className="rounded-card border border-line bg-bg p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-accent" />
          <h2 className="font-display italic text-lg text-ink">
            Tiempo en el negocio
          </h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted">
          <span>
            Hoy <span className="text-ink">{formatMins(minsToday)}</span>
          </span>
          <span aria-hidden>·</span>
          <span>
            Semana <span className="text-ink">{formatMins(minsWeek)}</span>
          </span>
        </div>
      </header>

      {/* Active timer or start form */}
      {active ? (
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm text-ink truncate">
                {active.label || "Trabajando…"}
              </p>
              {active.project && (
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-0.5 truncate">
                  {active.project}
                </p>
              )}
            </div>
            <div
              className="font-display italic text-2xl text-accent tabular-nums"
              aria-live="polite"
            >
              {formatLive(liveSeconds)}
            </div>
            <button
              type="button"
              onClick={handleStop}
              disabled={stop.isPending}
              className="h-10 w-10 rounded-full bg-danger/15 text-danger flex items-center justify-center hover:bg-danger/25 transition-colors disabled:opacity-40"
              aria-label="Detener timer"
            >
              {stop.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Square size={14} fill="currentColor" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-bg-alt p-3 mb-4 flex items-center gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKey}
            placeholder="¿Qué estás haciendo?"
            className="flex-1 min-w-0 bg-transparent border-0 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none"
          />
          <input
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Proyecto"
            className="w-28 bg-transparent border-0 font-mono text-xs text-muted placeholder:text-muted/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleStart}
            disabled={start.isPending}
            className="h-9 w-9 rounded-full bg-accent text-bg flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity"
            aria-label="Iniciar timer"
          >
            {start.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </button>
        </div>
      )}

      {/* History */}
      {isLoading ? (
        <p className="font-body text-xs text-muted">Cargando…</p>
      ) : entries.length === 0 ? (
        <p className="font-body text-xs text-muted italic">
          Sin entradas todavía. Inicia tu primer bloque arriba.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {entries
            .filter((e) => e.ended_at)
            .slice(0, 6)
            .map((e) => {
              const start = new Date(e.started_at);
              const end = new Date(e.ended_at!);
              const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
              return (
                <li
                  key={e.id}
                  className={clsx(
                    "flex items-center gap-3 py-2 group"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm text-ink truncate">
                      {e.label || "—"}
                      {e.project && (
                        <span className="text-muted font-mono text-[10px] ml-2">
                          · {e.project}
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      {start.toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      })}
                      {" · "}
                      {start.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="font-display italic text-base text-ink tabular-nums">
                    {formatMins(mins)}
                  </span>
                  <button
                    type="button"
                    onClick={() => del.mutate(e.id)}
                    aria-label="Borrar entrada"
                    className="h-8 w-8 rounded-md text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}
