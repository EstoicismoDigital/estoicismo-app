"use client";

export function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        QUERIDO ESTOICO, QUERIDA ESTOICA
      </p>
      <h1 className="font-display text-4xl font-bold text-ink leading-tight">
        Has recibido la Agenda de Zeus.
      </h1>
      <article className="font-body text-base text-ink leading-relaxed space-y-4">
        <p>
          Tu nueva herramienta de disciplina. Cada página existe para
          recordarte que el tiempo es lo único que no puedes recuperar.
        </p>
        <p>
          Aquí anotarás lo esencial: qué harás, cómo lo harás y cuándo lo
          harás. Nada más. La claridad es poder. El hábito de registrar y
          cumplir lo escrito forja carácter, y el carácter decide tu
          destino.
        </p>
        <p>
          No esperes inspiración: espera de ti mismo acción. No pospongas. No
          olvides. Cumple.
        </p>
        <p>
          Esta agenda es un espejo: mostrará, sin engaños, si fuiste dueño
          de tu día o esclavo de tus excusas.
        </p>
        <p className="text-muted italic">— Zeus</p>
      </article>
      <button
        type="button"
        onClick={onNext}
        className="h-12 rounded-lg bg-accent text-bg font-body font-medium text-base hover:opacity-90 transition-opacity mt-2"
      >
        Continuar
      </button>
    </div>
  );
}
