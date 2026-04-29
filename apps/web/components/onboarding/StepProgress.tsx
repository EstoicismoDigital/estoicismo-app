"use client";

export function StepProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      className="flex flex-col gap-2"
    >
      <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-muted">
        <span>
          Paso {current + 1} de {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 bg-bg-alt rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
