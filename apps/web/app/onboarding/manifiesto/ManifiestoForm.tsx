"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";

const COMMITMENTS = [
  "Aceptar solo transacciones que crean valor para todas las partes.",
  "Atraer cooperación honesta mediante servicio, disciplina y ejemplo.",
  "Servir primero y prosperar ayudando a otros a prosperar.",
  "Sustituir odio, envidia y cinismo por comprensión, gratitud y dominio de mí mismo.",
  "Mantener la verdad y la justicia como base de cualquier riqueza que construya.",
  "Fortalecer la fe de los demás en mí con resultados, carácter y palabra cumplida.",
];

export function ManifiestoForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Escribe tu nombre completo para firmar.");
      return;
    }
    if (!agreed) {
      setError("Debes confirmar que leíste la declaración.");
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: userResp } = await supabase.auth.getUser();
    const userId = userResp.user?.id;
    if (!userId) {
      setError("Sesión expirada. Vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }
    const { error: insertError } = await supabase
      .from("user_signed_manifesto")
      .insert({
        user_id: userId,
        signed_name: name.trim(),
        signed_place: place.trim() || null,
      });
    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Ya firmaste antes. Te llevamos al dashboard."
          : "No pudimos registrar tu firma. Intenta de nuevo."
      );
      // Si el error es por duplicado, igual avanzamos
      if (insertError.code === "23505") {
        setTimeout(() => router.push("/onboarding/wizard"), 800);
      }
      setLoading(false);
      return;
    }
    router.push("/onboarding/wizard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSign} className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted text-center">
        Lee en voz alta cada mañana y noche esta declaración.
      </p>

      <article className="font-body text-base text-ink leading-relaxed space-y-4 px-1">
        <p>
          Declaro que asumo la responsabilidad total de mi vida y de los
          resultados que obtenga. Me exijo acción perseverante y continua hasta
          lograr los objetivos que me propongo.
        </p>
        <p>
          Dedicaré 30 minutos al día a plasmar mis ideas, reflexiones y
          objetivos en esta Agenda de Zeus, usándola como herramienta diaria
          para convertirme en una persona más disciplinada, productiva y
          valiosa para los demás.
        </p>
        <p>
          Entiendo que mis pensamientos dominantes guían mis actos y crean mi
          realidad. Practicaré la autosugestión leyendo esta declaración en
          voz alta dos veces al día y actuando en coherencia con cada línea.
        </p>
        <p className="font-medium pt-2">Me comprometo a:</p>
        <ul className="list-none pl-0 space-y-2">
          {COMMITMENTS.map((c, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-accent font-mono mt-0.5" aria-hidden="true">✕</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="italic text-muted pt-2">
          Recitaré esta declaración a diario con fe absoluta, permitiendo que
          moldee mis pensamientos y mis actos hasta que se refleje en mi
          realidad.
        </p>
      </article>

      <div className="border-t border-line pt-6 mt-2 flex flex-col gap-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-line accent-accent"
          />
          <span className="font-body text-sm text-ink">
            He leído la declaración en voz alta y la acepto.
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="signed_name"
              className="font-mono text-xs uppercase tracking-widest text-muted"
            >
              FIRMA (TU NOMBRE COMPLETO)
            </label>
            <input
              id="signed_name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              required
              autoComplete="name"
              className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="signed_place"
              className="font-mono text-xs uppercase tracking-widest text-muted"
            >
              LUGAR (OPCIONAL)
            </label>
            <input
              id="signed_place"
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Ciudad"
              autoComplete="address-level2"
              className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-danger text-sm font-body">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-lg bg-accent text-bg font-body font-medium text-base hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {loading ? "Firmando…" : "Firmar y continuar"}
        </button>
      </div>
    </form>
  );
}
