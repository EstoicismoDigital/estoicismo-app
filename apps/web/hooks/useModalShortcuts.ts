"use client";
import { useEffect } from "react";

/**
 * Hook compartido para shortcuts en modales.
 *
 * Mientras el modal esté abierto:
 *  - ESC cierra (si onClose se provee).
 *  - Cmd/Ctrl+Enter dispara onSubmit (si se provee).
 *
 * Diseñado para reemplazar la repetición manual de useEffect con
 * keydown que existe en cada modal. Se ignora si el evento ya fue
 * handled (e.preventDefault marca defaultPrevented).
 */
export function useModalShortcuts({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, onSubmit]);
}
