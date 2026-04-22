"use client";
import { Coins, TrendingUp, Wallet } from "lucide-react";

/**
 * Finanzas module — v0 stub.
 *
 * Intentionally minimal: an editorial landing page that explains what
 * the module will become, using the module's green accent via
 * `data-module="finanzas"` on the wrapper (see globals.css).
 *
 * Near-term roadmap (intentionally not built yet so the module ships
 * without data migrations or empty UI):
 *   - Ingresos / gastos rápidos por día
 *   - Presupuestos mensuales con % de cumplimiento
 *   - Meta de ahorro con progreso (estilo hábito)
 *   - Vista semanal como la de Hábitos (heat strip verde)
 */
export function FinanzasClient() {
  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Finanzas
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl">
            Tu dinero, con cabeza fría.
          </h1>
          <p className="font-body text-white/60 text-sm mt-3 max-w-prose leading-relaxed">
            &ldquo;No es pobre el que tiene poco, sino el que mucho
            desea.&rdquo; — <span className="italic">Séneca</span>. Aquí
            llevarás un registro simple de ingresos, gastos y metas, con la
            misma disciplina con la que construyes tus hábitos.
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
            Estamos diseñando Finanzas con la misma filosofía de Hábitos:
            pocos campos, un gesto al día, y una vista semanal que te
            devuelva la imagen real de tu mes. Mientras tanto, puedes
            empezar a pensar qué quieres medir.
          </p>
        </div>

        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4">
          Lo que vendrá
        </h3>
        <ul className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          <PreviewCard
            Icon={Wallet}
            title="Registro diario"
            body="Un toque al día para anotar cuánto entró y cuánto salió. Sin categorías infinitas, solo lo esencial."
          />
          <PreviewCard
            Icon={TrendingUp}
            title="Metas con progreso"
            body="Tu meta de ahorro como un hábito: barrita verde, racha, y una foto semanal clara."
          />
          <PreviewCard
            Icon={Coins}
            title="Vista mensual"
            body="El mes en una página. Ver antes de juzgar — el primer paso del estoico con el dinero."
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
  Icon: typeof Wallet;
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
