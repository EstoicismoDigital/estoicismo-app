"use client";
import { useEffect, useRef } from "react";

export function HabitContextMenu({
  open,
  onClose,
  onEdit,
  onArchive,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute top-full right-3 mt-1 z-20 bg-bg border border-line rounded-card shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onEdit();
        }}
        className="w-full text-left px-4 py-2.5 font-body text-sm text-ink hover:bg-bg-alt transition-colors"
      >
        Editar
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onArchive();
        }}
        className="w-full text-left px-4 py-2.5 font-body text-sm text-danger hover:bg-danger/5 transition-colors border-t border-line"
      >
        Archivar
      </button>
    </div>
  );
}
