"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Step = {
  selector: string;
  title: string;
  body: string;
};

// Tour minimalista: solo 3 puntos clave, todos saltables.
// Si no encuentra un elemento, salta al siguiente. Si nada se
// encuentra, se cierra solo.
const TOUR_STEPS: Step[] = [
  {
    selector: "#sol-card",
    title: "Tu mañana",
    body: "Cada día escribe tu intención y planea hasta 7 tareas con bloque de tiempo.",
  },
  {
    selector: "#luna-card",
    title: "Tu noche",
    body: "Antes de dormir, registra cómo viviste el día y prepara el siguiente.",
  },
];

/**
 * InteractiveTour — overlay con tooltips paso a paso. La primera
 * vista pregunta si quiere ver el tour (no asume). Si sí, recorre
 * 2 puntos clave. Es saltable en cualquier momento (botón X, ESC,
 * o "Saltar").
 *
 * Si un elemento no se encuentra, salta al siguiente. Nunca bloquea.
 */
export function InteractiveTour({ onFinish }: { onFinish: () => void }) {
  // -1 = pantalla inicial (¿quieres ver el tour?), 0+ = paso del tour
  const [stepIdx, setStepIdx] = useState<number>(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const finishedRef = useRef(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }

  // ESC para cerrar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Posicionar tooltip cuando cambia el paso
  useEffect(() => {
    if (stepIdx < 0) {
      setRect(null);
      return;
    }
    const step = TOUR_STEPS[stepIdx];
    if (!step) {
      finish();
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) {
      // Si no encuentra, salta al siguiente o termina
      const t = setTimeout(() => {
        if (stepIdx < TOUR_STEPS.length - 1) setStepIdx(stepIdx + 1);
        else finish();
      }, 200);
      return () => clearTimeout(t);
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const updateRect = () => setRect(el.getBoundingClientRect());
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    const interval = setInterval(updateRect, 250);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      clearInterval(interval);
    };
  }, [stepIdx]);

  // Pantalla inicial — pregunta si quiere ver el tour
  if (stepIdx === -1) {
    return (
      <div
        role="dialog"
        aria-labelledby="tour-intro-title"
        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
      >
        <div className="bg-bg border border-line rounded-xl shadow-2xl p-6 max-w-sm">
          <div className="flex items-start justify-between mb-3 gap-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              BIENVENIDA
            </p>
            <button
              type="button"
              onClick={finish}
              aria-label="Cerrar"
              className="text-muted hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
          <h2
            id="tour-intro-title"
            className="font-display text-2xl text-ink mb-2"
          >
            ¿Quieres un tour rápido?
          </h2>
          <p className="font-body text-sm text-ink leading-relaxed mb-6">
            Te muestro en 30 segundos las 2 secciones clave de tu día (Sol y
            Luna). Puedes saltarte y explorar por tu cuenta.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={finish}
              className="flex-1 h-11 rounded-lg border border-line text-ink font-body font-medium hover:bg-bg-alt transition-colors"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={() => setStepIdx(0)}
              className="flex-1 h-11 rounded-lg bg-accent text-bg font-body font-medium hover:opacity-90 transition-opacity"
            >
              Sí, muéstrame
            </button>
          </div>
        </div>
      </div>
    );
  }

  const step = TOUR_STEPS[stepIdx];
  if (!step || !rect) {
    return (
      <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm pointer-events-none" />
    );
  }

  function next() {
    if (stepIdx < TOUR_STEPS.length - 1) setStepIdx(stepIdx + 1);
    else finish();
  }

  // Posición del tooltip: debajo si hay espacio, arriba si no
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const placeBelow = rect.bottom + 200 < viewportH;
  const tooltipTop = placeBelow ? rect.bottom + 16 : Math.max(16, rect.top - 200);

  return (
    <div
      className="fixed inset-0 z-[150] pointer-events-none"
      role="dialog"
      aria-labelledby="tour-step-title"
    >
      {/* Overlay con recorte alrededor del elemento */}
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - 8}
              y={rect.top - 8}
              width={rect.width + 16}
              height={rect.height + 16}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
        />
      </svg>

      <div
        className="absolute border-2 border-accent rounded-xl pointer-events-none transition-all"
        style={{
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      />

      <div
        className="absolute bg-bg border border-line rounded-xl shadow-2xl p-5 max-w-sm pointer-events-auto"
        style={{
          left: Math.min(
            Math.max(16, rect.left + rect.width / 2 - 192),
            (typeof window !== "undefined" ? window.innerWidth - 400 : 0)
          ),
          top: tooltipTop,
        }}
      >
        <div className="flex items-start justify-between mb-2 gap-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Paso {stepIdx + 1} de {TOUR_STEPS.length}
          </p>
          <button
            type="button"
            onClick={finish}
            aria-label="Cerrar tutorial"
            className="text-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <h3 id="tour-step-title" className="font-display text-xl text-ink mb-2">
          {step.title}
        </h3>
        <p className="font-body text-sm text-ink leading-relaxed mb-4">
          {step.body}
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink"
          >
            Saltar
          </button>
          <button
            type="button"
            onClick={next}
            className="h-10 px-4 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90"
          >
            {stepIdx < TOUR_STEPS.length - 1 ? "Siguiente" : "Listo"}
          </button>
        </div>
      </div>
    </div>
  );
}
