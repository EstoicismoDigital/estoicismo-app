"use client";
import { useEffect, useState } from "react";
import { useDailyJournal } from "../../hooks/useDailyJournal";
import { useSavedState } from "../../hooks/useSavedState";
import { SaveIndicator } from "../ui/SaveIndicator";

const EMPTY_TASKS = Array.from({ length: 7 }, () => ({
  text: "",
  from: "",
  to: "",
  done: false,
}));

/**
 * SolCard — sección "Sol" (mañana) del daily journal. Replica la
 * página izquierda de la agenda física: hora de inicio, intención
 * del día, hasta 7 tareas con bloque de tiempo. Autosave debounced
 * a 1.5s con SaveIndicator visible.
 */
export function SolCard() {
  const { data, save } = useDailyJournal();
  const ind = useSavedState();

  const [intent, setIntent] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [tasks, setTasks] = useState(EMPTY_TASKS);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde DB al primer cargo
  useEffect(() => {
    if (data === undefined || hydrated) return;
    setIntent(data?.morning_intent ?? "");
    setStartedAt(data?.day_started_at ?? "");
    if (data?.tasks?.length) {
      const filled = [
        ...data.tasks.map((t) => ({
          text: t.text ?? "",
          from: t.time_from ?? "",
          to: t.time_to ?? "",
          done: t.done ?? false,
        })),
        ...EMPTY_TASKS.slice(data.tasks.length),
      ].slice(0, 7);
      setTasks(filled);
    }
    setHydrated(true);
  }, [data, hydrated]);

  // Autosave debounced
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      void ind.run(() =>
        save({
          day_started_at: startedAt || null,
          morning_intent: intent || null,
          tasks: tasks
            .filter((t) => t.text.trim() || t.from || t.to)
            .map((t) => ({
              text: t.text,
              time_from: t.from,
              time_to: t.to,
              done: t.done,
            })),
        })
      );
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, startedAt, tasks, hydrated]);

  return (
    <section
      id="sol-card"
      className="rounded-card border border-line bg-bg-alt p-5 sm:p-6"
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">
            ☀
          </span>
          <h2 className="font-display italic text-2xl text-ink">Mi mañana</h2>
        </div>
        <SaveIndicator
          state={ind.state}
          savedAt={ind.savedAt}
          error={ind.error}
        />
      </header>

      <div className="grid sm:grid-cols-[auto_1fr] gap-4 mb-4 items-end">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="day_started"
            className="font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            MI DÍA INICIÓ
          </label>
          <input
            id="day_started"
            type="time"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="h-12 px-4 rounded-lg border border-line bg-bg font-body text-base text-ink"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <label
          htmlFor="morning_intent"
          className="font-mono text-[10px] uppercase tracking-widest text-muted"
        >
          ¿CÓMO QUIERO VIVIR ESTE DÍA?
        </label>
        <textarea
          id="morning_intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Cómo te sientes, qué agradeces, qué esperas, con qué actitud lo enfrentas, qué pequeña acción harás si hoy te cuesta."
          className="px-4 py-3 rounded-lg border border-line bg-bg font-body text-base text-ink resize-none placeholder:text-muted"
        />
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
          TAREAS DEL DÍA — HASTA 7 IMPORTANTES
        </p>
        <ul className="space-y-2">
          {tasks.map((t, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_72px_72px_auto] gap-2 items-center"
            >
              <input
                type="text"
                value={t.text}
                onChange={(e) =>
                  setTasks((arr) =>
                    arr.map((x, j) =>
                      j === i ? { ...x, text: e.target.value } : x
                    )
                  )
                }
                placeholder={`${i + 1}. Tarea`}
                maxLength={120}
                className="h-10 px-3 rounded-md border border-line bg-bg font-body text-sm text-ink"
              />
              <input
                type="time"
                value={t.from}
                onChange={(e) =>
                  setTasks((arr) =>
                    arr.map((x, j) =>
                      j === i ? { ...x, from: e.target.value } : x
                    )
                  )
                }
                aria-label={`Hora inicio tarea ${i + 1}`}
                className="h-10 px-2 rounded-md border border-line bg-bg font-body text-sm text-ink"
              />
              <input
                type="time"
                value={t.to}
                onChange={(e) =>
                  setTasks((arr) =>
                    arr.map((x, j) =>
                      j === i ? { ...x, to: e.target.value } : x
                    )
                  )
                }
                aria-label={`Hora fin tarea ${i + 1}`}
                className="h-10 px-2 rounded-md border border-line bg-bg font-body text-sm text-ink"
              />
              <input
                type="checkbox"
                checked={t.done}
                onChange={(e) =>
                  setTasks((arr) =>
                    arr.map((x, j) =>
                      j === i ? { ...x, done: e.target.checked } : x
                    )
                  )
                }
                aria-label={`Marcar tarea ${i + 1} como hecha`}
                className="h-5 w-5 accent-accent"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
