"use client";
import { useState } from "react";
import { useUpsertMPD } from "../../hooks/useMindset";

export function StepMPD({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const upsertMPD = useUpsertMPD();
  const [date, setDate] = useState("");
  const [aim, setAim] = useState("");
  const [sacrifice, setSacrifice] = useState("");
  const [plan, setPlan] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleNext() {
    setError(null);
    if (!aim.trim() || aim.trim().length < 5) {
      setError("Define con claridad qué quieres lograr.");
      return;
    }
    const affirmation = date
      ? `El ${formatDateEs(date)} lograré ${aim.trim()}. A cambio sacrifico ${sacrifice.trim() || "lo necesario"}. Para lograrlo seguiré mi plan.`
      : `Lograré ${aim.trim()}. A cambio sacrifico ${sacrifice.trim() || "lo necesario"}. Para lograrlo seguiré mi plan.`;
    try {
      await upsertMPD.mutateAsync({
        aim: aim.trim(),
        offered_value: sacrifice.trim() || null,
        deadline: date || null,
        plan: plan.trim() || null,
        affirmation,
      });
      onNext();
    } catch {
      setError("No pudimos guardar tu MPD. Intenta de nuevo.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        META PRINCIPAL DEFINIDA
      </p>
      <h1 className="font-display text-3xl font-bold text-ink">
        ¿Qué vas a lograr y para cuándo?
      </h1>
      <p className="font-body text-muted text-sm italic">
        "No puedes llegar a un lugar que tu cerebro no cree que existe."
      </p>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="mpd-date"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          FECHA LÍMITE
        </label>
        <input
          id="mpd-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="mpd-aim"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          META (CON RESULTADO NUMÉRICO)
        </label>
        <input
          id="mpd-aim"
          type="text"
          value={aim}
          onChange={(e) => setAim(e.target.value)}
          placeholder="Ej: Generar $10,000 USD/mes con mi negocio"
          required
          maxLength={200}
          className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="mpd-sacrifice"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          A CAMBIO SACRIFICO
        </label>
        <textarea
          id="mpd-sacrifice"
          value={sacrifice}
          onChange={(e) => setSacrifice(e.target.value)}
          placeholder="Tiempo libre, distracciones, comodidad…"
          rows={3}
          maxLength={400}
          className="px-4 py-3 rounded-lg border border-line bg-bg-alt font-body text-base text-ink resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="mpd-plan"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          PLAN (PASOS CONCRETOS)
        </label>
        <textarea
          id="mpd-plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder="1) ... 2) ... 3) ..."
          rows={5}
          maxLength={1000}
          className="px-4 py-3 rounded-lg border border-line bg-bg-alt font-body text-base text-ink resize-none"
        />
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm font-body">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-12 rounded-lg border border-line text-ink font-body font-medium hover:bg-bg-alt transition-colors"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={upsertMPD.isPending}
          className="flex-1 h-12 rounded-lg bg-accent text-bg font-body font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {upsertMPD.isPending ? "Guardando…" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}

function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
