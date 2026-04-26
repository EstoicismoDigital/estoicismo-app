/**
 * Skeleton genérico para loading.tsx de cualquier ruta del dashboard.
 *
 * Reserva espacio para: hero (eyebrow + título), 1-2 cards principales,
 * y una lista de items. Esto reduce CLS porque coincide con el layout
 * típico de los Client components al hidratar.
 *
 * Server component — sin hooks, sin estado. Sólo HTML + Tailwind.
 */
export function PageSkeleton(props: {
  /** Texto eyebrow para SR. Ej: "Finanzas · Ahorro". */
  label?: string;
  /** Cuántas tarjetas/listas mostrar (default 4). */
  rows?: number;
  /** Si la página tiene un module accent ("habits", "finanzas", etc). */
  module?: string;
}) {
  const rows = props.rows ?? 4;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={props.label ? `Cargando ${props.label}` : "Cargando"}
      data-module={props.module}
      className="min-h-screen bg-bg"
    >
      {/* Hero */}
      <section className="bg-bg-deep">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7 space-y-3">
          <div className="h-3 w-32 rounded-full bg-white/10 animate-pulse" />
          <div className="h-7 w-3/4 rounded-md bg-white/10 animate-pulse" />
        </div>
      </section>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="h-24 rounded-card bg-bg-alt/60 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-card bg-bg-alt/60 animate-pulse" />
          <div className="h-16 rounded-card bg-bg-alt/60 animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-card bg-bg-alt/40 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
