/**
 * Finanzas skeleton — coincide con FinanzasClient: balance hero, donut
 * de gastos por categoría, lista de transacciones recientes. Reserva el
 * espacio exacto del donut (h-64) para que no haya CLS cuando recharts
 * hidrate.
 */
export default function FinanzasLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando finanzas"
      data-module="finanzas"
      className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10"
    >
      <div className="animate-pulse space-y-8">
        {/* Eyebrow + título */}
        <div className="space-y-3">
          <div className="h-3 w-28 rounded-full bg-bg-alt" />
          <div className="h-10 md:h-12 w-2/3 rounded-md bg-bg-alt" />
        </div>

        {/* Balance hero card */}
        <div className="rounded-card border border-line bg-bg-alt/40 p-6 md:p-8 space-y-4">
          <div className="h-3 w-20 rounded-full bg-bg-alt" />
          <div className="h-12 md:h-16 w-1/2 rounded-md bg-bg-alt" />
          <div className="flex gap-3 pt-2">
            <div className="h-8 w-24 rounded-md bg-bg-alt/70" />
            <div className="h-8 w-24 rounded-md bg-bg-alt/70" />
          </div>
        </div>

        {/* Donut + leyenda lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-card border border-line bg-bg-alt/40 p-5 flex items-center justify-center h-64">
            <div className="w-40 h-40 rounded-full bg-bg-alt" />
          </div>
          <div className="rounded-card border border-line bg-bg-alt/40 p-5 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-bg-alt shrink-0" />
                <div className="flex-1 h-3 rounded bg-bg-alt/70" />
                <div className="h-3 w-16 rounded bg-bg-alt/70" />
              </div>
            ))}
          </div>
        </div>

        {/* Lista de transacciones */}
        <div className="rounded-card border border-line bg-bg-alt/40 p-5 space-y-3">
          <div className="h-5 w-40 rounded-md bg-bg-alt" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-9 w-9 rounded-full bg-bg-alt shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/5 rounded bg-bg-alt" />
                <div className="h-3 w-1/3 rounded bg-bg-alt/70" />
              </div>
              <div className="h-4 w-20 rounded bg-bg-alt" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
