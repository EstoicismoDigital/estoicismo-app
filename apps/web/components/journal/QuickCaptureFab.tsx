"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Pencil } from "lucide-react";
import { useCreateJournalEntry } from "../../hooks/useJournal";
import type { JournalArea, CreateJournalEntryInput } from "@estoicismo/supabase";

const JournalEntryModal = dynamic(
  () => import("./JournalEntryModal").then((m) => m.JournalEntryModal),
  { ssr: false }
);

/**
 * FAB global para captura rápida de entradas de diario desde
 * cualquier pantalla. Detecta el área activa según el pathname
 * y la pre-selecciona en el modal — así una entrada escrita
 * desde /finanzas se etiqueta finanzas, desde /habitos/fitness
 * se etiqueta fitness, etc.
 *
 * Vive abajo a la izquierda en mobile (lejos del FAB de Hábitos
 * que ya vive abajo-derecha en /). En desktop lo escondemos
 * porque la topbar ya tiene el JournalLink — no se justifica un
 * elemento extra flotante.
 */
export function QuickCaptureFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const createM = useCreateJournalEntry();

  // Inferir área desde la ruta actual.
  const area: JournalArea = inferAreaFromPath(pathname);

  // Atajo: Cmd+J (mac) / Ctrl+J (win/linux) abre Reflexión rápida
  // desde cualquier lugar. Coexiste con Cmd+K (command palette).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // No mostrar en /pegasso (interfiere con el chat) ni en /sign-in,
  // ni en /notas (ya hay un botón principal).
  if (
    pathname.startsWith("/pegasso") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/notas") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  ) {
    return null;
  }

  return (
    <>
      {/* Mobile: FAB redondo abajo-izquierda */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Reflexión rápida"
        title="Reflexión rápida"
        data-print-hide
        className="md:hidden fixed left-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-30 w-12 h-12 rounded-full bg-ink text-bg shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all print:hidden"
      >
        <Pencil size={18} aria-hidden />
      </button>

      {/* Desktop: pill flotante abajo-derecha con etiqueta visible.
          El user pidió "abrir 5 min y llenar todo" → el FAB necesita
          ser descubrible sin que el user busque. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Reflexión rápida (Cmd+J)"
        title="Reflexión rápida · Cmd+J"
        data-print-hide
        className="hidden md:inline-flex fixed right-6 bottom-6 z-30 items-center gap-2 h-11 pl-4 pr-2 rounded-full bg-ink text-bg shadow-lg hover:opacity-90 active:scale-95 transition-all print:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Pencil size={15} aria-hidden />
        <span className="font-mono text-[11px] uppercase tracking-widest">
          Reflexión rápida
        </span>
        <kbd className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-bg/15 border border-bg/20">
          ⌘J
        </kbd>
      </button>

      <JournalEntryModal
        open={open}
        initialArea={area}
        saving={createM.isPending}
        onClose={() => setOpen(false)}
        onSave={async (input: CreateJournalEntryInput) => {
          await createM.mutateAsync(input);
          setOpen(false);
        }}
      />
    </>
  );
}

function inferAreaFromPath(pathname: string): JournalArea {
  if (pathname.startsWith("/habitos/fitness")) return "fitness";
  if (pathname.startsWith("/habitos/lectura")) return "lectura";
  if (pathname.startsWith("/habitos") || pathname === "/" ||
      pathname.startsWith("/calendario") || pathname.startsWith("/progreso") ||
      pathname.startsWith("/revision") || pathname.startsWith("/historial")) {
    return "habits";
  }
  if (pathname.startsWith("/finanzas")) return "finanzas";
  if (pathname.startsWith("/reflexiones")) return "mentalidad";
  if (pathname.startsWith("/emprendimiento")) return "emprendimiento";
  return "free";
}
