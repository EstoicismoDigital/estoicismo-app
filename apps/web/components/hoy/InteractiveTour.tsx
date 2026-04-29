"use client";
import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";

type Step = {
  selector: string;
  title: string;
  body: string;
};

const TOUR_STEPS: Step[] = [
  {
    selector: "#sol-card",
    title: "Sol — tu mañana",
    body: "Cada mañana antes de empezar, escribe cómo quieres vivir el día. Define tu intención, agradece, y planea hasta 7 tareas con bloque de tiempo. Es la página izquierda de tu agenda.",
  },
  {
    selector: "#luna-card",
    title: "Luna — tu noche",
    body: "Antes de dormir, registra cómo viviste el día. Marca tus vitales, define tu estado, anota el balance financiero y los objetivos de mañana. Es la página derecha.",
  },
  {
    selector: "#vitales",
    title: "Vitales de tu Olimpo",
    body: "Éter (meditación), Forja (ejercicio), Néctar (hidratación), Kleos (lectura). Son los 4 pilares de un día estoico. Si los cumples a diario, todo lo demás se acomoda.",
  },
  {
    selector: "#estado",
    title: "Estado de tu Olimpo",
    body: "Eudaimonía es el ideal — claridad total. Identifica honestamente cómo terminaste el día. La autoobservación sin juicio es la práctica estoica fundamental.",
  },
  {
    selector: "#balance",
    title: "Balance financiero",
    body: "Anota cuánto entró y cuánto salió. La consciencia financiera empieza con la observación diaria. Marco Aurelio administraba un imperio así.",
  },
];

/**
 * InteractiveTour — tooltip-based walkthrough que se dispara la
 * primera vez que el usuario llega a /hoy después del onboarding.
 * Usa getBoundingClientRect para posicionarse encima del elemento
 * destacado, scroll-into-view y un overlay oscuro alrededor.
 *
 * El estado de visto se persiste en profiles.tour_seen_v2 (flag).
 */
export function InteractiveTour({ onFinish }: { onFinish: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = TOUR_STEPS[stepIdx];

  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (!el) {
      // Si no encuentra el elemento (p.ej. si LunaCard no se ha
      // renderizado todavía), salta al siguiente
      const t = setTimeout(() => {
        if (stepIdx < TOUR_STEPS.length - 1) setStepIdx(stepIdx + 1);
        else onFinish();
      }, 500);
      return () => clearTimeout(t);
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const updateRect = () => setRect(el.getBoundingClientRect());
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    const interval = setInterval(updateRect, 250); // por si scroll smooth aún no terminó
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      clearInterval(interval);
    };
  }, [step, stepIdx, onFinish]);

  if (!step || !rect) {
    return (
      <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm pointer-events-none" />
    );
  }

  function next() {
    if (stepIdx < TOUR_STEPS.length - 1) setStepIdx(stepIdx + 1);
    else onFinish();
  }

  // Posicionar tooltip debajo del elemento (o arriba si no hay espacio)
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const tooltipBelow = rect.bottom + 16;
  const placeBelow = tooltipBelow + 200 < viewportH;
  const tooltipTop = placeBelow ? rect.bottom + 16 : Math.max(16, rect.top - 220);

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none">
      {/* Overlay oscuro con recorte alrededor del elemento */}
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

      {/* Borde resaltado alrededor del elemento */}
      <div
        className="absolute border-2 border-accent rounded-xl pointer-events-none transition-all"
        style={{
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      />

      {/* Tooltip */}
      <div
        role="dialog"
        aria-labelledby="tour-title"
        className="absolute bg-bg border border-line rounded-xl shadow-2xl p-5 max-w-sm pointer-events-auto"
        style={{
          left: Math.min(
            Math.max(16, rect.left + rect.width / 2 - 192),
            (typeof window !== "undefined" ? window.innerWidth : 0) - 400
          ),
          top: tooltipTop,
        }}
      >
        <div className="flex items-start justify-between mb-3 gap-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Paso {stepIdx + 1} de {TOUR_STEPS.length}
          </p>
          <button
            type="button"
            onClick={onFinish}
            aria-label="Cerrar tutorial"
            className="text-muted hover:text-ink transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <h3 id="tour-title" className="font-display text-xl text-ink mb-2">
          {step.title}
        </h3>
        <p className="font-body text-sm text-ink leading-relaxed mb-4">
          {step.body}
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onFinish}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink"
          >
            Saltar tutorial
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90"
          >
            {stepIdx < TOUR_STEPS.length - 1 ? "Siguiente" : "Listo"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
