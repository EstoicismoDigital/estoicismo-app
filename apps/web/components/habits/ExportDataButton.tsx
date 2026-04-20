"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchArchivedHabits,
  fetchHabitLogs,
  fetchHabits,
  type Habit,
  type HabitLog,
} from "@estoicismo/supabase";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";
import {
  buildExport,
  exportFilename,
  exportToJson,
} from "../../lib/export";

/**
 * A wide but safe range that definitely covers any real completion date. We
 * pick a lower bound far before the product launched and an upper bound that
 * keeps this JSON sensible for decades to come.
 */
const EXPORT_FROM = "1970-01-01";
const EXPORT_TO = "2099-12-31";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * Triggers a client-side download without any server endpoint. Creates a
 * Blob URL, clicks a hidden anchor, then releases the URL so the tab
 * doesn't leak memory if the user exports repeatedly.
 */
function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // Safari needs the anchor attached to the DOM before click fires.
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportDataButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const sb = getSupabaseBrowserClient();
      const uid = await getUserId();
      const [active, archived, logs]: [Habit[], Habit[], HabitLog[]] =
        await Promise.all([
          fetchHabits(sb, uid),
          fetchArchivedHabits(sb, uid),
          fetchHabitLogs(sb, uid, EXPORT_FROM, EXPORT_TO),
        ]);
      const allHabits = [...active, ...archived];
      const now = new Date().toISOString();
      const env = buildExport(allHabits, logs, now);
      triggerDownload(exportFilename(now), exportToJson(env));
      toast.success(
        `Exportados ${env.habitsCount} hábitos y ${env.logsCount} completados.`
      );
    } catch (err) {
      console.error("Export failed", err);
      toast.error("No se pudo exportar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg border border-line text-ink font-body text-sm hover:bg-bg-alt hover:border-accent/30 disabled:opacity-40 transition-colors w-full sm:w-auto self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Descargar mis datos en JSON"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        <Download size={16} aria-hidden />
      )}
      {loading ? "Preparando archivo..." : "Exportar mis datos"}
    </button>
  );
}
