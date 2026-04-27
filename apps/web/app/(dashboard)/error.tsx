"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

/**
 * Error boundary del dashboard. Si algo falla en una ruta del
 * dashboard (ej. /finanzas, /hoy, /habitos), se muestra esto en
 * vez de pantalla en blanco.
 *
 * Próximas acciones:
 *  - "Reintentar" llama reset() — re-monta el segmento.
 *  - "Volver a Hoy" navega a /.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 h-12 w-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
          <AlertCircle size={20} />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-danger mb-2">
          Error en este módulo
        </p>
        <h1 className="font-display italic text-2xl sm:text-3xl text-ink leading-tight mb-3">
          Lo que sucede no depende de ti, lo que haces sí.
        </h1>
        <p className="font-body text-sm text-muted leading-relaxed mb-6 max-w-prose mx-auto">
          Algo falló al cargar esta página. Puedes intentar de nuevo o
          volver al inicio.
        </p>
        {error.message && (
          <p className="font-mono text-[10px] text-muted/70 bg-bg-alt rounded px-3 py-2 mb-6 break-all">
            {error.message}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-accent text-bg font-body text-sm font-medium hover:opacity-90"
          >
            <RotateCcw size={14} /> Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full border border-line text-ink hover:border-line-strong font-body text-sm"
          >
            <Home size={14} /> Volver a Hoy
          </Link>
        </div>
        {error.digest && (
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted/50 mt-6">
            ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
