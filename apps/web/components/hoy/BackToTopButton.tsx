"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { clsx } from "clsx";

/**
 * Botón flotante "volver arriba" — aparece cuando el user hace scroll
 * profundo (>800px) y ofrece volver al hero del ritual con scroll
 * suave.
 *
 * Posicionado abajo-derecha, sin tapar bottom-nav (que está abajo
 * en mobile). Auto-hide cuando user vuelve al top.
 */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 800);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollTop}
      data-print-hide
      aria-label="Volver al inicio"
      className={clsx(
        // Position: justo arriba del bottom-nav en mobile, abajo-derecha en desktop
        "fixed right-4 z-30 print:hidden",
        "bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] md:bottom-6",
        // Look
        "h-11 w-11 rounded-full bg-ink text-bg shadow-lg",
        "flex items-center justify-center",
        "hover:opacity-90 active:scale-95 transition-all duration-200",
        // Show/hide
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none"
      )}
    >
      <ArrowUp size={18} />
    </button>
  );
}
