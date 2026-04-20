"use client";
import { Plus } from "lucide-react";

export function EmptyHabits({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="py-16 sm:py-24 px-4 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">
        Empieza
      </p>
      <h2 className="font-display italic text-3xl sm:text-4xl text-ink mb-3">
        Empieza tu primer hábito.
      </h2>
      <p className="font-body text-[15px] text-muted max-w-md mx-auto mb-8 leading-relaxed">
        Los hábitos pequeños, sostenidos, construyen una vida.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-accent text-white font-body font-medium text-[15px] hover:opacity-90 active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 min-w-[44px]"
      >
        <Plus size={18} />
        Crear mi primer hábito
      </button>
    </div>
  );
}
