/**
 * Habito detail skeleton — coincide con la página /habitos/[id]: hero
 * con nombre del hábito + racha, heatmap/calendario de completados,
 * stats, notas. Tag el data-module para que el acento amarillo-ámbar
 * aparezca si el skeleton respeta el color del pilar Hábitos.
 */
export default function HabitoDetailLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando hábito"
      data-module="habits"
      className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10"
    >
      <div className="animate-pulse space-y-8">
        {/* Back link */}
        <div className="h-4 w-24 rounded bg-bg-alt" />

        {/* Hero: nombre + racha */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-bg-alt shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-20 rounded-full bg-bg-alt" />
            <div className="h-9 w-3/4 rounded-md bg-bg-alt" />
            <div className="h-4 w-1/2 rounded-md bg-bg-alt/70" />
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-card border border-line bg-bg-alt/60"
            />
          ))}
        </div>

        {/* Calendar / heatmap (reserve 7×14 grid height) */}
        <div className="rounded-card border border-line bg-bg-alt/40 p-5 space-y-4">
          <div className="h-5 w-32 rounded-md bg-bg-alt" />
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 42 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-sm bg-bg-alt/70"
              />
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="rounded-card border border-line bg-bg-alt/40 p-5 space-y-3">
          <div className="h-5 w-28 rounded-md bg-bg-alt" />
          <div className="h-3 w-full rounded bg-bg-alt/70" />
          <div className="h-3 w-5/6 rounded bg-bg-alt/70" />
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
