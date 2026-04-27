"use client";
import { useEffect, useMemo, useState } from "react";
import { Moon, Loader2, Check, X } from "lucide-react";
import { clsx } from "clsx";
import {
  useJournal,
  useCreateJournalEntry,
} from "../../hooks/useJournal";
import { getTodayStr } from "../../lib/dateUtils";

const TAG = "evening-review";

/**
 * Evening Review · práctica estoica diaria.
 *
 * Marco Aurelio y Séneca cerraban cada día revisando: ¿qué hice
 * bien? ¿qué fallé? ¿qué aprendí? Esta card sustituye el ruido del
 * scroll vespertino con tres prompts breves.
 *
 * Reglas de aparición:
 *  - Solo después de las 19:00 (configurable abajo).
 *  - Solo si NO hay ya una entrada de diario taggeada
 *    `evening-review` para hoy.
 *  - El user puede ocultarla con "Ahora no" — usa localStorage para
 *    no insistir el resto del día.
 *
 * Al guardar:
 *  - Crea un journal_entry con tag "evening-review", area "free",
 *    occurred_on = hoy.
 *  - Las tres respuestas se concatenan en el campo content como
 *    bloques claros.
 */

const SHOW_AFTER_HOUR = 19;
const SKIP_KEY_PREFIX = "evening-review:skip:";

function readSkipped(today: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SKIP_KEY_PREFIX + today) === "1";
  } catch {
    return false;
  }
}

function writeSkipped(today: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SKIP_KEY_PREFIX + today, "1");
  } catch {
    /* ignore */
  }
}

export function EveningReviewCard() {
  const today = getTodayStr();
  const [hour, setHour] = useState<number | null>(null);
  const [skipped, setSkipped] = useState<boolean>(true); // default true hasta hidratar

  // Hidrata client-side (evita mismatch SSR)
  useEffect(() => {
    setHour(new Date().getHours());
    setSkipped(readSkipped(today));
  }, [today]);

  const isEvening = hour !== null && hour >= SHOW_AFTER_HOUR;

  // Solo cargar entradas de hoy con el tag — no jalamos todo el diario.
  // El useQuery siempre dispara, pero limit=1 lo hace barato.
  const { data: todayEntries = [] } = useJournal({
    from: today,
    to: today,
    tag: TAG,
    limit: 1,
  });

  const alreadyDone = todayEntries.length > 0;

  const create = useCreateJournalEntry();

  const [win, setWin] = useState("");
  const [friction, setFriction] = useState("");
  const [lesson, setLesson] = useState("");

  const canSave = useMemo(
    () =>
      [win, friction, lesson].some((s) => s.trim().length > 0) &&
      !create.isPending,
    [win, friction, lesson, create.isPending]
  );

  // No render hasta hidratar y solo si aplica
  if (hour === null) return null;
  if (!isEvening) return null;
  if (skipped) return null;
  if (alreadyDone) {
    return (
      <section className="rounded-card border border-line/60 bg-bg-alt/30 p-4 sm:p-5 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
          <Check size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-success mb-0.5">
            Revisión nocturna · hecha
          </p>
          <p className="font-body text-sm text-ink/80">
            Cerraste el día con intención. Descansa bien.
          </p>
        </div>
      </section>
    );
  }

  async function handleSave() {
    const blocks = [
      win.trim() ? `**Victoria:**\n${win.trim()}` : null,
      friction.trim() ? `**Fricción:**\n${friction.trim()}` : null,
      lesson.trim() ? `**Lección:**\n${lesson.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!blocks) return;
    try {
      await create.mutateAsync({
        title: "Revisión nocturna",
        content: blocks,
        area: "free",
        tags: [TAG, "stoicismo"],
        occurred_on: today,
      });
      setWin("");
      setFriction("");
      setLesson("");
    } catch {
      /* toast handled by hook */
    }
  }

  function handleSkip() {
    writeSkipped(today);
    setSkipped(true);
  }

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Moon size={14} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Revisión nocturna
          </p>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="text-muted hover:text-ink p-1 -m-1"
          aria-label="Ahora no"
          title="Ahora no — vuelvo mañana"
        >
          <X size={14} />
        </button>
      </div>

      <p className="font-body text-sm text-ink/85 leading-relaxed mb-1">
        Antes de cerrar el día, tres preguntas que Séneca se hacía
        cada noche.
      </p>
      <p className="font-body text-xs text-muted leading-relaxed mb-4 italic">
        «Cuando llegues a casa al atardecer, repasa tu día. ¿Qué hice
        bien? ¿En qué fallé? ¿Qué aprendí?»
      </p>

      <div className="space-y-3">
        <ReviewField
          accent="success"
          label="✓ Victoria"
          placeholder="Algo que salió bien hoy. Por más pequeño que sea."
          value={win}
          onChange={setWin}
          autoFocus
        />
        <ReviewField
          accent="danger"
          label="× Fricción"
          placeholder="Qué te trabó, qué hiciste por debajo de tu estándar."
          value={friction}
          onChange={setFriction}
        />
        <ReviewField
          accent="accent"
          label="✦ Lección"
          placeholder="Una sola frase. Lo que te llevas para mañana."
          value={lesson}
          onChange={setLesson}
        />
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={handleSkip}
          className="h-9 px-3 rounded-lg font-body text-xs text-muted hover:text-ink hover:bg-bg-alt transition-colors"
        >
          Ahora no
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {create.isPending && <Loader2 size={12} className="animate-spin" />}
          Guardar reflexión
        </button>
      </div>
    </section>
  );
}

function ReviewField({
  label,
  placeholder,
  value,
  onChange,
  accent,
  autoFocus,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  accent: "success" | "danger" | "accent";
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label
        className={clsx(
          "block font-mono text-[10px] uppercase tracking-widest mb-1",
          accent === "success" && "text-success",
          accent === "danger" && "text-danger",
          accent === "accent" && "text-accent"
        )}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        maxLength={400}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-bg border border-line rounded-lg px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent resize-none leading-relaxed"
      />
    </div>
  );
}
