/**
 * Dashboard-wide loading skeleton. Shown by Next.js during RSC streaming
 * between dashboard routes. The AppShell (masthead / bottom nav) stays
 * mounted across navigations — this only fills the <main> slot, so the
 * chrome doesn't flash.
 *
 * Design notes:
 *  - Uses the same max-w-6xl / px-6 rhythm as the real pages so there's
 *    no layout shift when content swaps in.
 *  - Pulse is driven by Tailwind's animate-pulse (opacity-only), which
 *    honors prefers-reduced-motion automatically.
 *  - All blocks use `bg-bg-alt` / `border-line` — palette-agnostic, so
 *    whatever module the user is in, the skeleton is calm and neutral.
 */
export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando contenido"
      className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10"
    >
      <div className="animate-pulse space-y-6">
        {/* Eyebrow */}
        <div className="h-3 w-28 rounded-full bg-bg-alt" />

        {/* Display heading */}
        <div className="space-y-3">
          <div className="h-10 md:h-12 w-2/3 rounded-md bg-bg-alt" />
          <div className="h-4 w-1/2 rounded-md bg-bg-alt" />
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-card border border-line bg-bg-alt/60"
            />
          ))}
        </div>

        {/* Primary content block */}
        <div className="space-y-3 pt-2">
          <div className="h-5 w-40 rounded-md bg-bg-alt" />
          <div className="rounded-card border border-line bg-bg-alt/40 p-4 md:p-6 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-bg-alt shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-bg-alt" />
                  <div className="h-3 w-1/2 rounded bg-bg-alt/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
