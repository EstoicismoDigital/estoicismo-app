"use client";
import { useMemo } from "react";
import { IKIGAI_AXES, type IkigaiScores } from "../../lib/business/ikigai";

/**
 * Radar visual del Ikigai con SVG inline. 4 ejes (love, good_at,
 * needed, paid_for) con escala 0-5. Sin librería de charts.
 */
export function IkigaiRadar(props: { scores: IkigaiScores; size?: number }) {
  const size = props.size ?? 220;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 28; // radio máximo

  // 4 puntos cardinales: love top, paid_for right, good_at bottom, needed left
  const positions: { axis: keyof IkigaiScores; angle: number }[] = [
    { axis: "love", angle: -Math.PI / 2 },
    { axis: "paid_for", angle: 0 },
    { axis: "good_at", angle: Math.PI / 2 },
    { axis: "needed", angle: Math.PI },
  ];

  const points = useMemo(() => {
    return positions.map(({ axis, angle }) => {
      const score = props.scores[axis];
      const r = score !== null ? (score / 5) * R : 0;
      return {
        axis,
        angle,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        labelX: cx + Math.cos(angle) * (R + 18),
        labelY: cy + Math.sin(angle) * (R + 18),
        score,
      };
    });
  }, [props.scores, R, cx, cy]);

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-auto max-w-xs mx-auto"
      aria-label="Radar Ikigai"
    >
      {/* Anillos de fondo */}
      {[1, 2, 3, 4, 5].map((level) => (
        <circle
          key={level}
          cx={cx}
          cy={cy}
          r={(level / 5) * R}
          fill="none"
          stroke="currentColor"
          className="text-line/40"
          strokeWidth="0.5"
        />
      ))}
      {/* Líneas eje */}
      {positions.map((p) => (
        <line
          key={p.axis}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(p.angle) * R}
          y2={cy + Math.sin(p.angle) * R}
          stroke="currentColor"
          className="text-line/30"
          strokeWidth="0.5"
        />
      ))}
      {/* Polígono del score */}
      {points.some((p) => p.score !== null) && (
        <polygon
          points={polygon}
          fill="rgb(var(--color-accent) / 0.2)"
          stroke="rgb(var(--color-accent))"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {/* Puntos */}
      {points.map((p) => {
        const meta = IKIGAI_AXES.find((a) => a.key === p.axis)!;
        return (
          <g key={p.axis}>
            {p.score !== null && (
              <circle cx={p.x} cy={p.y} r={4} fill={meta.color} />
            )}
            {/* Emoji + label */}
            <text
              x={p.labelX}
              y={p.labelY}
              fontSize="14"
              textAnchor="middle"
              dominantBaseline="middle"
              className="select-none"
            >
              {meta.emoji}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
