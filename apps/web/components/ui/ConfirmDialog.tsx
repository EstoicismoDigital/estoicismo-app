"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  destructive = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we only render the portal client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus confirm button + lock scroll + escape handler
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Defer focus until after mount
    const focusTimer = window.setTimeout(() => {
      confirmRef.current?.focus();
    }, 10);

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      // Simple focus trap between confirm and cancel
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!mounted || !open) return null;

  const titleId = "confirm-dialog-title";
  const descId = "confirm-dialog-description";

  const node = (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
      />

      <div
        ref={dialogRef}
        className="relative bg-bg-alt w-full sm:max-w-md rounded-t-modal sm:rounded-modal shadow-[0_20px_60px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 p-5 sm:p-6"
      >
        <h2
          id={titleId}
          className="font-display italic text-xl sm:text-2xl text-ink mb-2"
        >
          {title}
        </h2>
        {description && (
          <p
            id={descId}
            className="font-body text-[15px] text-muted leading-relaxed mb-6"
          >
            {description}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 min-h-[44px] px-5 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={clsx(
              "h-11 min-h-[44px] px-5 rounded-lg font-body font-medium text-sm text-white active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-alt",
              destructive
                ? "bg-danger hover:opacity-90 focus-visible:ring-danger"
                : "bg-accent hover:opacity-90 focus-visible:ring-accent"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
