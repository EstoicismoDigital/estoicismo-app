"use client";
import { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useHabits } from "../../hooks/useHabits";
import { downloadIcs } from "../../lib/ical-export";

/**
 * Botón "Exportar a calendario" — genera un .ics con tus hábitos
 * como eventos recurrentes que puedes importar a Google / Apple
 * Calendar.
 */
export function IcalExportButton() {
  const { habits } = useHabits();
  const [loading, setLoading] = useState(false);

  function handleExport() {
    if (habits.length === 0) {
      toast.error("Aún no tienes hábitos para exportar.");
      return;
    }
    setLoading(true);
    try {
      downloadIcs(
        habits.filter((h) => !h.is_archived),
        `estoicismo-habitos-${new Date().toISOString().slice(0, 10)}.ics`
      );
      toast.success("Calendario exportado", {
        description:
          "Importa el .ics a Google Calendar o Apple Calendar.",
      });
    } catch (err) {
      toast.error("No se pudo exportar.", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading || habits.length === 0}
      className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg border border-line text-ink font-body text-sm hover:bg-bg-alt hover:border-accent/30 disabled:opacity-40 transition-colors w-full sm:w-auto self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Exportar hábitos a calendario (.ics)"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        <Calendar size={16} aria-hidden />
      )}
      Exportar a calendario
    </button>
  );
}
