"use client";
import { useState } from "react";
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Captura rápida en diario"
        className="md:hidden fixed left-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-30 w-12 h-12 rounded-full bg-ink text-bg shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
      >
        <Pencil size={18} />
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
