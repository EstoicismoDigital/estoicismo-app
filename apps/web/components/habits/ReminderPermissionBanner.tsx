"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { toast } from "sonner";
import {
  getPermission,
  isSupported,
  requestPermission,
  type PermissionState,
} from "../../lib/notifications";

const DISMISS_KEY = "estoicismo:reminder-banner-dismissed";

/**
 * Renders a small prompt above the habit list when the user has at
 * least one habit with a reminder time AND hasn't yet granted (or has
 * since blocked) notification permission.
 *
 * States and what they render:
 *   - "granted" or "unsupported" → nothing (no friction when it works
 *     or when the platform can't help).
 *   - "default" → friendly nudge with a primary action that triggers
 *     the browser prompt.
 *   - "denied" → soft explanation pointing to the browser's site
 *     settings. We don't try to re-request; browsers ignore the call
 *     after a denial in the same origin.
 *
 * Dismissal is sticky per-device (localStorage). Users with zero
 * reminder-bearing habits never see this — the banner assumes the user
 * has already expressed intent by configuring a reminder time.
 */
export function ReminderPermissionBanner({
  hasReminderHabits,
}: {
  hasReminderHabits: boolean;
}) {
  // Start in a neutral state so the first server render matches the
  // first client render — avoiding hydration diff noise. The real
  // permission is read from the browser in the mount effect.
  const [permission, setPermission] = useState<PermissionState>("default");
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPermission(getPermission());
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // Private-mode / disabled storage: treat as not-dismissed. The
      // worst case is the banner reappears next reload.
    }
    setHydrated(true);
  }, []);

  // Avoid any render on the server / pre-hydration: the banner's
  // visibility depends on browser-only state (Notification.permission
  // and localStorage) that we can't honestly know during SSR.
  if (!hydrated) return null;
  if (!hasReminderHabits) return null;
  if (!isSupported()) return null;
  if (permission === "granted") return null;
  if (permission === "unsupported") return null;
  if (dismissed) return null;

  const denied = permission === "denied";

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

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage unavailable: the banner won't stay dismissed, but the
      // state is still hidden for the rest of this session.
    }
  }

  return (
    <div
      role="status"
      className="flex items-start gap-3 p-4 mb-4 rounded-card bg-accent/5 border border-accent/20"
    >
      {denied ? (
        <BellOff
          size={20}
          className="text-accent flex-shrink-0 mt-0.5"
          aria-hidden
        />
      ) : (
        <Bell
          size={20}
          className="text-accent flex-shrink-0 mt-0.5"
          aria-hidden
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-ink font-medium">
          {denied ? "Notificaciones bloqueadas" : "Activa los recordatorios"}
        </p>
        <p className="font-body text-xs text-muted mt-0.5 leading-relaxed">
          {denied
            ? "Permite las notificaciones desde los ajustes del navegador para recibir avisos a la hora de cada hábito."
            : "Recibe un aviso a la hora de cada hábito mientras la app esté abierta."}
        </p>
        {!denied && (
          <button
            type="button"
            onClick={handleEnable}
            className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-accent text-bg font-body text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Activar notificaciones
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Descartar aviso"
        className="w-8 h-8 rounded-md text-muted hover:text-ink hover:bg-bg-alt flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
