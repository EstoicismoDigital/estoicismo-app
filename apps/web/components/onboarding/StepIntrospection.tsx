"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";

type PilarExtra = { id: string; label: string };
type Pilar = {
  key: "habits" | "finance" | "mindset" | "business";
  title: string;
  philosopher: string;
  intro: string;
  visual: string;
  extras?: PilarExtra[];
};

const PILARES: Pilar[] = [
  {
    key: "habits",
    title: "Hábitos",
    philosopher: "Epicteto",
    intro: "¿Qué hábitos me alejan de mi MPD?",
    visual: "¿Qué hábitos diarios me acercarán a mi MPD?",
  },
  {
    key: "finance",
    title: "Finanzas",
    philosopher: "Marco Aurelio",
    intro: "¿Cómo es hoy mi relación con el dinero?",
    visual: "¿Cómo se ven las finanzas que me acercarán a mi MPD?",
    extras: [
      { id: "current_income", label: "¿Cuánto gano hoy?" },
      { id: "target_income", label: "¿Cuánto quiero ganar?" },
    ],
  },
  {
    key: "mindset",
    title: "Mentalidad",
    philosopher: "Porcia Catón",
    intro: "¿Cómo reacciono actualmente en mi día a día?",
    visual: "¿Cuál es la mentalidad que me acercará a mi MPD?",
  },
  {
    key: "business",
    title: "Emprendimiento",
    philosopher: "Séneca",
    intro: "¿Cuáles han sido mis aprendizajes al emprender?",
    visual: "¿Cómo se ve mi emprendimiento al lograr mi MPD?",
    extras: [
      { id: "current_revenue", label: "¿Cuánto genera mi negocio hoy?" },
      { id: "target_revenue", label: "¿Cuánto generará al lograr mi MPD?" },
    ],
  },
];

type IntrospectionData = {
  habits_bad?: string;
  habits_good?: string;
  finance_current?: string;
  finance_current_income?: string;
  finance_target?: string;
  finance_target_income?: string;
  mindset_current?: string;
  mindset_target?: string;
  business_current?: string;
  business_current_revenue?: string;
  business_target?: string;
  business_target_revenue?: string;
};

export function StepIntrospection({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [activePilar, setActivePilar] = useState(0);
  const [data, setData] = useState<IntrospectionData>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof IntrospectionData, value: string) {
    setData((d) => ({ ...d, [field]: value }));
  }

  function fieldsForPilar(p: Pilar): {
    intro: keyof IntrospectionData;
    visual: keyof IntrospectionData;
  } {
    if (p.key === "habits") return { intro: "habits_bad", visual: "habits_good" };
    if (p.key === "finance") return { intro: "finance_current", visual: "finance_target" };
    if (p.key === "mindset") return { intro: "mindset_current", visual: "mindset_target" };
    return { intro: "business_current", visual: "business_target" };
  }

  // Detecta si el usuario llenó al menos un campo. Si no, salta el
  // upsert y avanza directo (todo opcional).
  function hasAnyData(): boolean {
    return Object.values(data).some((v) => v !== undefined && v !== "");
  }

  async function handleFinish() {
    setError(null);
    if (!hasAnyData()) {
      onNext();
      return;
    }
    setSaving(true);
    try {
      const sb = getSupabaseBrowserClient();
      const { data: userResp } = await sb.auth.getUser();
      const uid = userResp.user?.id;
      if (!uid) throw new Error("No auth");

      const payload = {
        user_id: uid,
        habits_bad: data.habits_bad ?? null,
        habits_good: data.habits_good ?? null,
        finance_current: data.finance_current ?? null,
        finance_current_income: data.finance_current_income ? Number(data.finance_current_income) : null,
        finance_target: data.finance_target ?? null,
        finance_target_income: data.finance_target_income ? Number(data.finance_target_income) : null,
        mindset_current: data.mindset_current ?? null,
        mindset_target: data.mindset_target ?? null,
        business_current: data.business_current ?? null,
        business_current_revenue: data.business_current_revenue ? Number(data.business_current_revenue) : null,
        business_target: data.business_target ?? null,
        business_target_revenue: data.business_target_revenue ? Number(data.business_target_revenue) : null,
        completed_at: new Date().toISOString(),
      };

      // Cast: tabla user_introspection se agrega en migración posterior;
      // los Database types generados no la incluyen todavía.
      const { error: e } = await (
        sb.from("user_introspection") as unknown as {
          upsert: (
            row: typeof payload,
            opts: { onConflict: string }
          ) => Promise<{ error: { code?: string; message: string } | null }>;
        }
      ).upsert(payload, { onConflict: "user_id" });
      // Si la tabla no existe (42P01), avanzamos sin guardar — el
      // user no debe quedarse atorado por una migración pendiente.
      if (e && e.code !== "42P01") throw e;
      onNext();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos guardar. Puedes saltarte este paso."
      );
    } finally {
      setSaving(false);
    }
  }

  const p = PILARES[activePilar];
  const fields = fieldsForPilar(p);

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        LAS 4 COLUMNAS DE TU OLIMPO
      </p>
      <h1 className="font-display text-3xl font-bold text-ink">{p.title}</h1>
      <p className="font-body text-muted text-sm italic">
        Bajo la guía de {p.philosopher}.
      </p>

      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {PILARES.map((pp, i) => (
          <button
            key={pp.key}
            type="button"
            onClick={() => setActivePilar(i)}
            className={`px-3 py-2 rounded-md font-mono text-xs uppercase tracking-widest whitespace-nowrap transition-colors ${
              i === activePilar
                ? "bg-accent text-bg"
                : "bg-bg-alt text-muted hover:text-ink"
            }`}
          >
            {pp.title}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs uppercase tracking-widest text-muted">
          INTROSPECCIÓN: {p.intro}
        </label>
        <textarea
          value={data[fields.intro] ?? ""}
          onChange={(e) => set(fields.intro, e.target.value)}
          rows={5}
          maxLength={1000}
          className="px-4 py-3 rounded-lg border border-line bg-bg-alt font-body text-base text-ink resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs uppercase tracking-widest text-muted">
          VISUALIZACIÓN: {p.visual}
        </label>
        <textarea
          value={data[fields.visual] ?? ""}
          onChange={(e) => set(fields.visual, e.target.value)}
          rows={5}
          maxLength={1000}
          className="px-4 py-3 rounded-lg border border-line bg-bg-alt font-body text-base text-ink resize-none"
        />
      </div>

      {p.extras &&
        p.extras.map((ex) => {
          const fieldKey = `${p.key}_${ex.id}` as keyof IntrospectionData;
          return (
            <div key={ex.id} className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-widest text-muted">
                {ex.label}
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={(data[fieldKey] as string) ?? ""}
                onChange={(e) => set(fieldKey, e.target.value)}
                className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink"
              />
            </div>
          );
        })}

      {error && (
        <p role="alert" className="text-danger text-sm font-body">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={activePilar === 0 ? onBack : () => setActivePilar(activePilar - 1)}
          disabled={saving}
          className="flex-1 h-12 rounded-lg border border-line text-ink font-body font-medium hover:bg-bg-alt transition-colors disabled:opacity-40"
        >
          Atrás
        </button>
        {activePilar < PILARES.length - 1 ? (
          <button
            type="button"
            onClick={() => setActivePilar(activePilar + 1)}
            className="flex-1 h-12 rounded-lg bg-accent text-bg font-body font-medium hover:opacity-90 transition-opacity"
          >
            Siguiente pilar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={saving}
            className="flex-1 h-12 rounded-lg bg-accent text-bg font-body font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {saving ? "Guardando…" : "Terminar"}
          </button>
        )}
      </div>
    </div>
  );
}
