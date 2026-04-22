/**
 * Reflexiones skeleton — coincide con el shape real de ReflexionesClient:
 * hero + stat row + card principal (ritual del día) + grid de entradas.
 * Palette-agnostic: bg-bg-alt / border-line para que no "parpadee" color
 * cuando el pilar Mentalidad (rojo terracota) tome el acento.
 */
export default function ReflexionesLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando reflexiones"
      data-module="reflexiones"
      className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10"
    >
      <div className="animate-pulse space-y-8">
        {/* Hero eyebrow + título */}
        <div className="space-y-3">
          <div className="h-3 w-32 rounded-full bg-bg-alt" />
          <div className="h-10 md:h-14 w-3/4 rounded-md bg-bg-alt" />
          <div className="h-4 w-1/2 rounded-md bg-bg-alt/80" />
        </div>

        {/* Stat row (3 métricas: racha, meditaciones, entradas) */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-card border border-line bg-bg-alt/60"
            />
          ))}
        </div>

        {/* Card ritual del día */}
        <div className="rounded-card border border-line bg-bg-alt/40 p-5 md:p-7 space-y-4">
          <div className="h-3 w-24 rounded-full bg-bg-alt" />
          <div className="h-7 w-2/3 rounded-md bg-bg-alt" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-bg-alt/70" />
            <div className="h-3 w-5/6 rounded bg-bg-alt/70" />
          </div>
          <div className="h-11 w-40 rounded-lg bg-bg-alt mt-3" />
        </div>

        {/* Grid de entradas (meditación + escritura) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-card border border-line bg-bg-alt/40 p-5 space-y-3"
            >
              <div className="h-6 w-1/2 rounded-md bg-bg-alt" />
              <div className="h-3 w-full rounded bg-bg-alt/70" />
              <div className="h-3 w-4/5 rounded bg-bg-alt/70" />
              <div className="h-10 w-32 rounded-lg bg-bg-alt mt-2" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
