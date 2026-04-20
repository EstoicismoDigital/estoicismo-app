"use client";
import { useEffect, useState } from "react";
import { Smartphone, Share } from "lucide-react";

/**
 * Prompts the user to install the PWA on devices that support it.
 *
 * Three branches, auto-selected:
 *   1. Browser is already in standalone mode (PWA installed OR tab
 *      manually opened with `?standalone=1`): render nothing.
 *   2. Browser fired `beforeinstallprompt` (Chrome / Edge desktop &
 *      Android, Samsung Internet): render an "Instalar" button that
 *      calls `prompt()` on the stashed event. Once the user installs
 *      or dismisses, we honor their choice for the session.
 *   3. iOS Safari: `beforeinstallprompt` is never fired, but we can
 *      still help — render inline instructions for Share → Add to
 *      Home Screen. iOS requires PWA install for browser push to
 *      work at all, so this branch is important for parity with
 *      Android users who just enabled reminders.
 *
 * Returns `null` when none of the branches apply (e.g. desktop Firefox
 * today, which doesn't ship a PWA install flow at all).
 */

// Minimal shape of the beforeinstallprompt event. Not in lib.dom.d.ts
// because it's a proposed non-standard API, so we declare our own.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  // Safari-like UA: has "Safari" AND NOT "CriOS" (Chrome on iOS) /
  // "FxiOS" (Firefox on iOS) / "EdgiOS". Those browsers route all web
  // views through WKWebView and also can't install a PWA themselves,
  // so the hint we render (Share → Add to Home Screen) doesn't apply.
  const isSafari =
    /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS-specific: Safari sets navigator.standalone when launched from
  // the home screen shortcut.
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function InstallAppCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [hydrated, setHydrated] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    if (detectIOSSafari()) {
      setIosHint(true);
    }

    function onBeforeInstallPrompt(e: Event) {
      // Prevent the mini-infobar that Chrome sometimes shows on
      // mobile; we want to be the single source of prompting.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "dismissed") {
        setDismissed(true);
      }
      setDeferred(null);
    } catch {
      setDeferred(null);
    }
  }

  if (!hydrated) return null;
  if (installed) return null;
  if (dismissed) return null;

  const canInstallNow = !!deferred;
  // Nothing actionable: desktop Firefox / Chromium variants without a
  // prompt event, etc. Rather than show a dead card, we hide.
  if (!canInstallNow && !iosHint) return null;

  return (
    <div className="rounded-card border border-line bg-bg p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span
          className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0"
          aria-hidden
        >
          <Smartphone size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-body text-sm font-medium text-ink">
            Instalar la app
          </h3>
          {canInstallNow ? (
            <p className="font-body text-xs text-muted mt-1 leading-relaxed max-w-md">
              Añádela a tu pantalla de inicio para acceder con un toque y
              recibir recordatorios aunque no tengas la pestaña abierta.
            </p>
          ) : (
            <p className="font-body text-xs text-muted mt-1 leading-relaxed max-w-md">
              En iOS: toca{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-alt text-ink font-medium">
                <Share size={11} aria-hidden />
                Compartir
              </span>{" "}
              en la barra del navegador y elige{" "}
              <span className="px-1.5 py-0.5 rounded bg-bg-alt text-ink font-medium">
                Añadir a pantalla de inicio
              </span>
              . Es requisito para que lleguen los recordatorios.
            </p>
          )}
        </div>
      </div>

      {canInstallNow && (
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent whitespace-nowrap"
        >
          Instalar
        </button>
      )}
    </div>
  );
}
