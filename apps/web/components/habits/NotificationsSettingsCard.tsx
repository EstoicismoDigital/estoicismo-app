"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import {
  getPermission,
  isSupported,
  requestPermission,
  type PermissionState,
} from "../../lib/notifications";

/**
 * Surfaces the user's current browser notification permission on the
 * Ajustes page, plus a single action that either requests the prompt
 * (permission = default) or guides them to browser settings (denied).
 *
 * Unlike the dashboard banner — which only appears when the user has
 * reminders configured and permission isn't granted — this card is
 * always rendered on the settings page so the user has a predictable
 * place to review / adjust the state.
 */
export function NotificationsSettingsCard() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPermission(getPermission());
    setHydrated(true);
  }, []);

  async function handleEnable() {
    const next = await requestPermission();
    setPermission(next);
    if (next === "granted") {
      toast.success("Recordatorios activados", {
        description: "Te avisaremos a la hora de cada hábito.",
        duration: 3500,
      });
    } else if (next === "denied") {
      toast.error("Permiso denegado", {
        description:
          "Actívalo en los ajustes del navegador para recibir recordatorios.",
        duration: 5000,
      });
    }
  }

  // During SSR / first paint we render a neutral placeholder so
  // hydration matches. The real state arrives one tick later.
  const supported = hydrated && isSupported();

  const statusLabel = !hydrated
    ? "…"
    : !supported
    ? "No disponible"
    : permission === "granted"
    ? "Activados"
    : permission === "denied"
    ? "Bloqueados"
    : "Sin configurar";

  const statusTone =
    permission === "granted" && supported
      ? "bg-accent/10 text-accent border-accent/30"
      : permission === "denied"
      ? "bg-danger/10 text-danger border-danger/30"
      : "bg-bg-alt text-muted border-line";

  return (
    <div className="rounded-card border border-line bg-bg p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span
          className="w-10 h-10 rounded-full bg-bg-alt text-muted flex items-center justify-center flex-shrink-0"
          aria-hidden
        >
          <Bell size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-body text-sm font-medium text-ink">
              Recordatorios
            </h3>
            <span
              className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusTone}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="font-body text-xs text-muted mt-1 leading-relaxed max-w-md">
            {!supported
              ? "Tu navegador no admite notificaciones. Prueba en un navegador de escritorio o añade la app a la pantalla de inicio."
              : permission === "granted"
              ? "Recibes avisos a la hora de cada hábito mientras la app está abierta. Para desactivarlos, cámbialo en los ajustes del sitio en tu navegador."
              : permission === "denied"
              ? "El navegador está bloqueando las notificaciones de este sitio. Abre los ajustes del sitio en tu navegador para volver a permitirlas."
              : "Avisos a la hora de cada hábito mientras la app está abierta. Tú decides cuándo activarlos."}
          </p>
        </div>
      </div>

      {supported && permission === "default" && (
        <button
          type="button"
          onClick={handleEnable}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent whitespace-nowrap"
        >
          Activar
        </button>
      )}
    </div>
  );
}
