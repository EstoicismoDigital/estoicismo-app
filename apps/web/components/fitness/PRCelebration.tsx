"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trophy, Sparkles } from "lucide-react";

/**
 * Overlay de celebración cuando rompes un PR.
 *
 * Aparece full-screen con confetti CSS, frase estoica + el dato
 * del récord. Auto-cierra a los 3.5s o con click.
 */
export function PRCelebration(props: {
  open: boolean;
  exerciseName: string;
  /** Valor numérico nuevo (en kg para weight_reps, reps para reps_only). */
  newRecord: number;
  unit: "kg" | "reps";
  /** El record anterior — opcional. */
  previousRecord?: number;
  onClose: () => void;
}) {
  const { open, exerciseName, newRecord, unit, previousRecord, onClose } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Auto-close
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const delta = previousRecord ? newRecord - previousRecord : null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer animate-in fade-in duration-200"
    >
      {/* Confetti CSS — emojis flotando */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-2xl animate-pr-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: "-10%",
              animationDelay: `${Math.random() * 1.2}s`,
              animationDuration: `${2 + Math.random() * 1.5}s`,
            }}
          >
            {["🏆", "⚡", "🔥", "✨", "💪"][i % 5]}
          </span>
        ))}
      </div>

      <div className="relative max-w-sm mx-4 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto animate-bounce">
          <Trophy size={40} className="text-accent" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent inline-flex items-center gap-1.5">
          <Sparkles size={11} /> Récord roto
        </p>
        <h2 className="font-display italic text-3xl text-white leading-tight">
          {exerciseName}
        </h2>
        <p className="font-display italic text-5xl text-accent">
          {newRecord} {unit}
        </p>
        {delta !== null && delta > 0 && (
          <p className="text-sm text-white/70">
            <span className="text-success">+{Math.round(delta * 10) / 10}</span> sobre tu marca anterior
          </p>
        )}
        <p className="text-xs text-white/50 italic mt-4">
          "El obstáculo es el camino." — Marco Aurelio
        </p>
        <p className="text-[10px] text-white/40">Toca para cerrar</p>
      </div>

      <style jsx>{`
        @keyframes pr-confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-pr-confetti {
          animation-name: pr-confetti;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>,
    document.body
  );
}
