"use client";
import { useEffect, useState } from "react";
import { useDailyJournal, type StoicState } from "../../hooks/useDailyJournal";
import { useSavedState } from "../../hooks/useSavedState";
import { SaveIndicator } from "../ui/SaveIndicator";

const STATES: { key: StoicState; label: string; desc: string }[] = [
  { key: "eudaimonia", label: "Eudaimonía", desc: "Mentalidad fuerte, claridad total" },
  { key: "sophrosyne", label: "Sophrosyne", desc: "Día estable, ni alto ni bajo" },
  { key: "agon", label: "Agón", desc: "Día con retos, lucha interna con control" },
  { key: "thymos", label: "Thymos", desc: "Cansancio emocional. No fue mejor día" },
  { key: "ekpyrosis", label: "Ekpyrosis", desc: "Perdiste el centro. Caos interno" },
];

const VITALES = [
  { key: "vital_eter" as const, label: "Éter", sub: "Meditación" },
  { key: "vital_forja" as const, label: "Forja", sub: "Ejercicio" },
  { key: "vital_nectar" as const, label: "Néctar", sub: "Hidratación" },
  { key: "vital_kleos" as const, label: "Kleos", sub: "Lectura" },
];

/**
 * LunaCard — sección "Luna" (noche) del daily journal. Replica la
 * página derecha de la agenda física: reflexión del día, vitales,
 * estado, balance financiero, objetivos de mañana. Autosave
 * debounced a 1.5s con SaveIndicator visible.
 */
export function LunaCard() {
  const { data, save } = useDailyJournal();
  const ind = useSavedState();

  const [reflection, setReflection] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [vitales, setVitales] = useState({
    vital_eter: false,
    vital_forja: false,
    vital_nectar: false,
    vital_kleos: false,
  });
  const [state, setState] = useState<StoicState | "">("");
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (data === undefined || hydrated) return;
    setReflection(data?.evening_reflection ?? "");
    setEndedAt(data?.day_ended_at ?? "");
    setVitales({
      vital_eter: !!data?.vital_eter,
      vital_forja: !!data?.vital_forja,
      vital_nectar: !!data?.vital_nectar,
      vital_kleos: !!data?.vital_kleos,
    });
    setState((data?.state ?? "") as StoicState | "");
    setIncome(data?.income_today != null ? String(data.income_today) : "");
    setExpense(data?.expense_today != null ? String(data.expense_today) : "");
    setTomorrow(data?.tomorrow_objectives ?? "");
    setHydrated(true);
  }, [data, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      void ind.run(() =>
        save({
          evening_reflection: reflection || null,
          day_ended_at: endedAt || null,
          ...vitales,
          state: state || null,
          income_today: income ? Number(income) : null,
          expense_today: expense ? Number(expense) : null,
          tomorrow_objectives: tomorrow || null,
        })
      );
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflection, endedAt, vitales, state, income, expense, tomorrow, hydrated]);

  return (
    <section
      id="luna-card"
      className="rounded-card border border-line bg-bg-alt p-5 sm:p-6"
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">
            🌙
          </span>
          <h2 className="font-display italic text-2xl text-ink">Mi noche</h2>
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
            htmlFor="day_ended"
            className="font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            MI DÍA TERMINÓ
          </label>
          <input
            id="day_ended"
            type="time"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            className="h-12 px-4 rounded-lg border border-line bg-bg font-body text-base text-ink"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <label
          htmlFor="evening_reflection"
          className="font-mono text-[10px] uppercase tracking-widest text-muted"
        >
          ¿CÓMO VIVÍ ESTE DÍA?
        </label>
        <textarea
          id="evening_reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Lo mejor que hiciste, lo que aprendiste, ideas, dibujos, pendientes que sueltas para mañana."
          className="px-4 py-3 rounded-lg border border-line bg-bg font-body text-base text-ink resize-none placeholder:text-muted"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-6">
        <fieldset id="vitales">
          <legend className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
            VITALES DE TU OLIMPO
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {VITALES.map((v) => (
              <label
                key={v.key}
                className="flex items-center gap-2 p-2 rounded border border-line bg-bg cursor-pointer hover:border-accent/40 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={vitales[v.key]}
                  onChange={(e) =>
                    setVitales((vv) => ({ ...vv, [v.key]: e.target.checked }))
                  }
                  className="h-4 w-4 accent-accent"
                />
                <span className="flex flex-col">
                  <span className="font-medium text-sm text-ink leading-tight">
                    {v.label}
                  </span>
                  <span className="font-mono text-[9px] uppercase text-muted">
                    {v.sub}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset id="estado">
          <legend className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
            ESTADO DE TU OLIMPO
          </legend>
          <div className="flex flex-col gap-1">
            {STATES.map((s) => (
              <label
                key={s.key}
                className="flex items-start gap-2 p-2 rounded border border-line bg-bg cursor-pointer hover:border-accent/40 transition-colors"
              >
                <input
                  type="radio"
                  name="state"
                  checked={state === s.key}
                  onChange={() => setState(s.key)}
                  className="mt-0.5 accent-accent"
                />
                <span className="flex flex-col leading-tight">
                  <span className="font-medium text-sm text-ink">{s.label}</span>
                  <span className="text-[11px] text-muted">{s.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset id="balance">
          <legend className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
            BALANCE DE TU OLIMPO
          </legend>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="income"
                className="font-mono text-[9px] uppercase tracking-widest text-muted"
              >
                (+) INGRESOS DE HOY
              </label>
              <input
                id="income"
                type="number"
                inputMode="decimal"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="h-10 px-3 rounded border border-line bg-bg font-body text-sm text-ink"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="expense"
                className="font-mono text-[9px] uppercase tracking-widest text-muted"
              >
                (−) GASTOS DE HOY
              </label>
              <input
                id="expense"
                type="number"
                inputMode="decimal"
                value={expense}
                onChange={(e) => setExpense(e.target.value)}
                className="h-10 px-3 rounded border border-line bg-bg font-body text-sm text-ink"
              />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-1 mb-4">
        <label
          htmlFor="tomorrow_obj"
          className="font-mono text-[10px] uppercase tracking-widest text-muted"
        >
          OBJETIVOS PRINCIPALES DE MAÑANA
        </label>
        <textarea
          id="tomorrow_obj"
          value={tomorrow}
          onChange={(e) => setTomorrow(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Lo más importante que harás mañana."
          className="px-4 py-3 rounded-lg border border-line bg-bg font-body text-base text-ink resize-none placeholder:text-muted"
        />
      </div>

      <p className="text-center font-body text-sm italic text-muted mt-4">
        "Descansa… pero no te apagues. Mañana el rayo vuelve a caer."
      </p>
    </section>
  );
}
