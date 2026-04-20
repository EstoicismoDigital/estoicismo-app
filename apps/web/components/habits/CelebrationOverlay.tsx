"use client";
import { useEffect, useState } from "react";

/**
 * Short-lived emoji starburst fired when the user completes the last
 * habit of the day. Driven by an incrementing `nonce` so the parent
 * doesn't have to manage mount/unmount — every bump mounts a fresh
 * set of particles, plays them for ~1.2s, then self-unmounts.
 *
 * Visual rules:
 *   - pointer-events: none (never blocks the UI underneath)
 *   - aria-hidden (pure decoration; "Día completo" toast carries the
 *     semantic announcement for screen readers)
 *   - honors `prefers-reduced-motion`: renders nothing when the user
 *     has opted out
 *   - mounts above everything except toasts (z-40; sonner uses z-50+)
 *
 * Per-particle randomness lives in inline CSS custom properties so a
 * single keyframe (`celebrate-spark`) drives every spark — lets the
 * browser compositor handle the heavy lifting on the GPU.
 */
const SPARK_EMOJI = ["✨", "⭐", "💫", "🔥", "🌟"] as const;
const COUNT = 14;
const DURATION_MS = 1200;

type Spark = {
  id: number;
  emoji: string;
  dx: number;
  dy: number;
  rot: number;
  s: number;
  delay: number;
};

function makeSparks(): Spark[] {
  // Evenly distribute around a circle, jitter each slot so the burst
  // doesn't look like a wheel spoke. Random distance + scale varies
  // weight; random rotation makes each emoji feel individual.
  const out: Spark[] = [];
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const distance = 110 + Math.random() * 90;
    out.push({
      id: i,
      emoji: SPARK_EMOJI[i % SPARK_EMOJI.length],
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      rot: (Math.random() - 0.5) * 540,
      s: 0.8 + Math.random() * 0.7,
      delay: Math.random() * 80,
    });
  }
  return out;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    // JSDOM / very old browsers — assume motion is OK rather than
    // silently suppressing the celebration for everyone.
    return false;
  }
}

export function CelebrationOverlay({ nonce }: { nonce: number }) {
  const [sparks, setSparks] = useState<Spark[] | null>(null);

  useEffect(() => {
    // nonce=0 is the initial mount — skip so already-complete users
    // don't see a flash when they first land on the page.
    if (nonce === 0) return;
    if (prefersReducedMotion()) return;

    setSparks(makeSparks());
    const t = window.setTimeout(() => setSparks(null), DURATION_MS + 200);
    return () => window.clearTimeout(t);
  }, [nonce]);

  if (!sparks) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center overflow-hidden"
    >
      {sparks.map((s) => (
        <span
          key={s.id}
          className="absolute text-3xl sm:text-4xl will-change-transform motion-safe:animate-celebrate-spark motion-reduce:hidden"
          style={
            {
              ["--dx" as string]: `${s.dx}px`,
              ["--dy" as string]: `${s.dy}px`,
              ["--rot" as string]: `${s.rot}deg`,
              ["--s" as string]: `${s.s}`,
              animationDelay: `${s.delay}ms`,
            } as React.CSSProperties
          }
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
}
