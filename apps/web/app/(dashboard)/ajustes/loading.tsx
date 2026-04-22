/**
 * Ajustes skeleton — coincide con AjustesClient: hero bg-deep + secciones
 * (perfil, plan, apariencia, notificaciones, app, datos, sesión). El hero
 * negro se preserva porque ajustes es el único lugar donde uso bg-deep
 * directo — sin ese hero, el usuario sentiría un "flash" blanco al llegar.
 */
export default function AjustesLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando ajustes"
      className="min-h-screen bg-bg"
    >
      {/* Hero bg-deep — estático, sin pulse (evita shimmer negro feo) */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-2">
          <div className="h-3 w-24 rounded-full bg-white/10" />
          <div className="h-9 sm:h-11 w-40 rounded-md bg-white/10" />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="animate-pulse space-y-10">
          {/* Perfil (3 filas: nombre, email, timezone) */}
          <div className="space-y-4">
            <div className="h-3 w-16 rounded-full bg-bg-alt" />
            <div className="rounded-card overflow-hidden border border-line bg-bg">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-4 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <div className="h-5 w-5 rounded bg-bg-alt shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-20 rounded bg-bg-alt/70" />
                    <div className="h-4 w-1/2 rounded bg-bg-alt" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan */}
          <div className="space-y-4">
            <div className="h-3 w-12 rounded-full bg-bg-alt" />
            <div className="rounded-card border border-line bg-bg p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-bg-alt shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-20 rounded bg-bg-alt/70" />
                <div className="h-5 w-32 rounded bg-bg-alt" />
                <div className="h-3 w-3/4 rounded bg-bg-alt/70" />
              </div>
            </div>
          </div>

          {/* Apariencia (tema + paleta) */}
          <div className="space-y-4">
            <div className="h-3 w-20 rounded-full bg-bg-alt" />
            <div className="rounded-card border border-line bg-bg p-5 h-20" />
            <div className="rounded-card border border-line bg-bg p-5 h-32" />
          </div>

          {/* Notificaciones */}
          <div className="space-y-4">
            <div className="h-3 w-24 rounded-full bg-bg-alt" />
            <div className="rounded-card border border-line bg-bg p-5 h-24" />
          </div>
        </div>
      </section>
    </div>
  );
}
