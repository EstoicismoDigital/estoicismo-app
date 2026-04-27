"use client";

import { useEffect } from "react";

/**
 * Global error boundary — captura errores que ocurren en root layout
 * o que no fueron capturados por un error.tsx inferior.
 *
 * Es la última red de seguridad. Debe ser un component completo
 * (incluye <html> y <body>) porque reemplaza el root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif",
          background: "#0a0a0a",
          color: "#f5f5f5",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#d4af37",
              marginBottom: "1rem",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            Algo se rompió
          </p>
          <h1
            style={{
              fontSize: "2rem",
              fontStyle: "italic",
              lineHeight: 1.2,
              marginBottom: "1rem",
            }}
          >
            Lo que sucede no depende de ti, lo que haces sí.
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "#a3a3a3",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            Hubo un error inesperado. Intenta recargar — si persiste,
            el error está siendo registrado.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "11px",
                fontFamily: "ui-monospace, monospace",
                color: "#737373",
                marginBottom: "1.5rem",
              }}
            >
              ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              background: "#d4af37",
              color: "#0a0a0a",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Volver a intentar
          </button>
        </div>
      </body>
    </html>
  );
}
