"use client";

export function StepReady({
  onFinish,
  onBack,
}: {
  onFinish: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        TU OLIMPO ESTÁ LISTO
      </p>
      <h1 className="font-display text-4xl font-bold text-ink leading-tight">
        No mires atrás. Enfócate.
      </h1>
      <p className="font-body text-base text-ink leading-relaxed max-w-prose mx-auto">
        Mañana al despertar y en la noche antes de dormir, vas a recitar tu
        MPD. Cada día abrirás{" "}
        <strong className="text-ink">/hoy</strong> para registrar tu Sol y tu
        Luna.
      </p>
      <p className="font-body text-muted text-sm italic max-w-prose mx-auto">
        Has firmado un compromiso contigo mismo. Que tu trazo sea el
        testimonio de que decides vivir con dirección, disciplina y temple.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-12 rounded-lg border border-line text-ink font-body font-medium hover:bg-bg-alt transition-colors"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 h-12 rounded-lg bg-accent text-bg font-body font-medium hover:opacity-90 transition-opacity"
        >
          Comenzar
        </button>
      </div>
    </div>
  );
}
