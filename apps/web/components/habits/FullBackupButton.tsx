"use client";
import { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";
import {
  backupFilename,
  gatherFullBackup,
  totalRows,
} from "../../lib/backup-full";

/**
 * Backup completo · descarga JSON con TODOS los datos del user
 * (todas las tablas con RLS permitida). Se usa en /ajustes.
 *
 * El archivo es portable — el user puede guardarlo donde quiera.
 * No hay endpoint backend: query directo + Blob + click anchor.
 */
export function FullBackupButton() {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error("No estás autenticado");
      const backup = await gatherFullBackup(sb, user.id);
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backupFilename(backup.exportedAt);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Backup completo`, {
        description: `${totalRows(backup).toLocaleString()} filas · ${
          Object.keys(backup.counts).length
        } tablas`,
      });
    } catch (err) {
      console.error("Backup failed", err);
      toast.error("No se pudo generar el backup.", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg border border-line text-ink font-body text-sm hover:bg-bg-alt hover:border-accent/30 disabled:opacity-40 transition-colors w-full sm:w-auto self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Backup completo en JSON"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        <Database size={16} aria-hidden />
      )}
      {loading ? "Generando backup..." : "Backup completo"}
    </button>
  );
}
