"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Minimal network-status banner.
 *
 * Shows a slim amber strip at the top of the viewport when the browser
 * reports `navigator.onLine === false`. The app is Supabase-backed, so
 * mutations will fail while offline — this makes the state legible
 * instead of silent. React Query mutations still queue and retry when
 * connectivity returns (our default retry policy is already in place
 * via QueryProvider), so no extra work here beyond the visual cue.
 *
 * Renders nothing on the server and nothing while online — zero DOM
 * cost for the default case.
 */
export function OfflineIndicator() {
  const [hydrated, setHydrated] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setHydrated(true);
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    function onOnline() {
      setOnline(true);
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!hydrated || online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 py-1.5 px-4 bg-danger text-white text-xs font-mono uppercase tracking-widest shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
      style={{ paddingTop: "calc(0.375rem + env(safe-area-inset-top))" }}
    >
      <WifiOff size={12} aria-hidden />
      <span>Sin conexión</span>
    </div>
  );
}
