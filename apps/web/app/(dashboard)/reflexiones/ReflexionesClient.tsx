"use client";
import { Feather, Moon, Sunrise } from "lucide-react";

/**
 * Reflexiones module — v0 stub.
 *
 * Framed around Epicteto (the two other stoic voices in the app are
 * taken: Séneca anchors /notas, Marco Aurelio anchors /revision).
 * Epicteto's cut is the "día-a-día": his handbook (el Enquiridión) is
 * short, imperative, and practical — matches a daily reflection
 * prompt well. Module uses the violet accent (see globals.css).
 *
 * Scope for v1 (not built yet, intentionally shipped as stub first):
 *   - Prompt del día (rotativo, ~60 del Enquiridión)
 *   - Entrada libre de mañana + noche
 *   - Mini-histórico similar al de Notas
 */
export function ReflexionesClient() {
  return (
    <div data-module="reflexiones" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Reflexiones
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl">
            Piensa despacio, escribe breve.
          </h1>
          <p className="font-body text-white/60 text-sm mt-3 max-w-prose leading-relaxed">
            &ldquo;No son las cosas las que perturban a los hombres, sino la
            opinión que tienen de ellas.&rdquo; —{" "}
            <span className="italic">Epicteto, Enquiridión V</span>. Un
            espacio diario para revisar qué fue tuyo y qué no — la raíz
            del estoicismo práctico.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="rounded-card border border-accent/30 bg-accent/5 p-6 sm:p-8 mb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            En construcción
          </p>
          <h2 className="font-display italic text-2xl text-ink mb-2">
            Llegando pronto
          </h2>
          <p className="font-body text-sm text-muted leading-relaxed max-w-prose">
            En Notas (con Séneca) escribes lo que aprendiste al completar
            un hábito. En Revisión (con Marco Aurelio) miras la semana en
            conjunto. Reflexiones, con Epicteto, será el espacio del día:
            una pregunta breve por la mañana, una mirada honesta por la
            noche.
          </p>
        </div>

        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4">
          Lo que vendrá
        </h3>
        <ul className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          <PreviewCard
            Icon={Sunrise}
            title="Prompt matutino"
            body="Una frase del Enquiridión para empezar el día, con un espacio corto para responder sin ceremonia."
          />
          <PreviewCard
            Icon={Moon}
            title="Cierre nocturno"
            body="Tres líneas al final del día: qué fue tuyo, qué no, qué harás distinto mañana."
          />
          <PreviewCard
            Icon={Feather}
            title="Archivo ligero"
            body="Un histórico navegable, buscable, sin redes — tu diario estoico, sólo para ti."
          />
        </ul>
      </section>
    </div>
  );
}

function PreviewCard({
  Icon,
  title,
  body,
}: {
  Icon: typeof Feather;
  title: string;
  body: string;
}) {
  return (
    <li className="flex flex-col gap-3 p-5 rounded-card border border-line bg-bg">
      <span
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent"
        aria-hidden
      >
        <Icon size={16} />
      </span>
      <h4 className="font-body text-sm font-medium text-ink">{title}</h4>
      <p className="font-body text-xs text-muted leading-relaxed">{body}</p>
    </li>
  );
}
