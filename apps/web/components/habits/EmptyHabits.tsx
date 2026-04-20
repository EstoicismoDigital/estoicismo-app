"use client";
import { Plus } from "lucide-react";
import { useCreateHabit } from "../../hooks/useHabits";
import { HABIT_TEMPLATES, type HabitTemplate } from "../../lib/habitTemplates";

export function EmptyHabits({ onCreate }: { onCreate: () => void }) {
  const createM = useCreateHabit();

  function handlePick(t: HabitTemplate) {
    const { id: _id, tagline: _tagline, ...input } = t;
    createM.mutate(input);
  }

  return (
    <div className="py-14 sm:py-20 px-4">
      <div className="text-center">
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
          className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-accent text-bg font-body font-medium text-[15px] hover:opacity-90 active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 min-w-[44px]"
        >
          <Plus size={18} />
          Crear mi primer hábito
        </button>
      </div>

      <div className="mt-14 sm:mt-16 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px flex-1 bg-line" aria-hidden />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            O elige una práctica estoica
          </p>
          <span className="h-px flex-1 bg-line" aria-hidden />
        </div>

        <ul
          role="list"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3"
        >
          {HABIT_TEMPLATES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => handlePick(t)}
                disabled={createM.isPending}
                aria-label={`Añadir plantilla ${t.name}`}
                className="w-full text-left p-3 sm:p-4 rounded-card bg-bg border border-line hover:border-accent/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl"
                    style={{
                      backgroundColor: `${t.color}22`,
                      color: t.color,
                    }}
                    aria-hidden
                  >
                    {t.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body font-medium text-sm text-ink truncate">
                      {t.name}
                    </p>
                    <p className="font-body text-xs text-muted mt-0.5 leading-snug line-clamp-2">
                      {t.tagline}
                    </p>
                    {t.reminder_time && (
                      <p className="font-mono text-[10px] uppercase tracking-widest text-accent mt-1.5">
                        {t.reminder_time.slice(0, 5)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
