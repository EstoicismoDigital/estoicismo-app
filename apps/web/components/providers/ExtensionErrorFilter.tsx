"use client";
import { useEffect } from "react";

/**
 * Silencia errores que vienen de extensiones de Chrome (MetaMask,
 * wallets, ad blockers, etc.) — no son de nuestra app y solo ensucian
 * el dev overlay de Next.js + Sentry/logs en producción.
 *
 * Patrón: añadimos listeners globales que llaman preventDefault()
 * cuando el origen del error es chrome-extension:// (o moz-extension:
 * para Firefox). Eso evita que Next.js los promueva a "Unhandled
 * Runtime Error".
 *
 * Solo afecta errores cuyo stack/filename apunta a una extensión.
 * Los errores reales de la app pasan limpios.
 */
export function ExtensionErrorFilter() {
  useEffect(() => {
    function isExtensionError(filename?: string | null): boolean {
      if (!filename) return false;
      return (
        filename.startsWith("chrome-extension://") ||
        filename.startsWith("moz-extension://") ||
        filename.startsWith("safari-web-extension://")
      );
    }

    function onError(e: ErrorEvent) {
      if (isExtensionError(e.filename)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }

    function onUnhandledRejection(e: PromiseRejectionEvent) {
      const reason = e.reason;
      const stack =
        typeof reason === "object" && reason !== null && "stack" in reason
          ? String((reason as { stack: unknown }).stack ?? "")
          : "";
      const message =
        typeof reason === "object" && reason !== null && "message" in reason
          ? String((reason as { message: unknown }).message ?? "")
          : String(reason ?? "");
      if (
        stack.includes("chrome-extension://") ||
        stack.includes("moz-extension://") ||
        message.includes("MetaMask") ||
        message.includes("Failed to connect to MetaMask")
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection, true);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener(
        "unhandledrejection",
        onUnhandledRejection,
        true
      );
    };
  }, []);

  return null;
}
