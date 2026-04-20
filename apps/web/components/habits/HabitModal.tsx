"use client";
import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { HABIT_COLORS, HABIT_EMOJIS, type CreateHabitInput } from "@estoicismo/supabase";
import type { Habit } from "@estoicismo/supabase";

type Frequency =
  | { kind: "daily" }
  | { kind: "specific"; days: number[] }; // 0 = Mon, 6 = Sun

const DAY_LABELS: { value: number; label: string }[] = [
  { value: 0, label: "L" },
  { value: 1, label: "M" },
  { value: 2, label: "X" },
  { value: 3, label: "J" },
  { value: 4, label: "V" },
  { value: 5, label: "S" },
  { value: 6, label: "D" },
];

function habitFrequencyToLocal(freq: Habit["frequency"]): Frequency {
  if (typeof freq === "object" && freq && "days" in freq) {
    return { kind: "specific", days: freq.days };
  }
  return { kind: "daily" };
}

function localToHabitFrequency(f: Frequency): Habit["frequency"] {
  if (f.kind === "daily") return "daily";
  return { days: f.days };
}

export function HabitModal({
  open,
  onClose,
  onSave,
  editing,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: CreateHabitInput) => void | Promise<void>;
  editing?: Habit | null;
  saving?: boolean;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(HABIT_EMOJIS[0]);
  const [color, setColor] = useState<string>(HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<Frequency>({ kind: "daily" });
  const [reminderTime, setReminderTime] = useState<string>("");
  const [touched, setTouched] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Seed state when modal opens
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      if (editing) {
        setName(editing.name);
        setIcon(editing.icon);
        setColor(editing.color);
        setFrequency(habitFrequencyToLocal(editing.frequency));
        setReminderTime(editing.reminder_time ?? "");
      } else {
        setName("");
        setIcon(HABIT_EMOJIS[0]);
        setColor(HABIT_COLORS[0]);
        setFrequency({ kind: "daily" });
        setReminderTime("");
      }
      setTouched(false);
      // Focus after mount
      setTimeout(() => nameInputRef.current?.focus(), 10);
    } else if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  }, [open, editing]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const nameError = touched && !name.trim() ? "El nombre es obligatorio." : null;
  const canSave = !!name.trim() && !!icon && !!color;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSave) return;
    const input: CreateHabitInput = {
      name: name.trim(),
      icon,
      color,
      frequency: localToHabitFrequency(frequency),
      reminder_time: reminderTime || null,
    };
    await onSave(input);
  }

  function toggleDay(day: number) {
    if (frequency.kind !== "specific") return;
    const has = frequency.days.includes(day);
    const next = has
      ? frequency.days.filter((d) => d !== day)
      : [...frequency.days, day].sort();
    setFrequency({ kind: "specific", days: next });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
      />

      {/* Dialog body */}
      <div
        ref={dialogRef}
        className="relative bg-bg w-full sm:max-w-lg sm:rounded-modal rounded-t-modal shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-bg border-b border-line px-5 sm:px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              {editing ? "Editar hábito" : "Nuevo hábito"}
            </p>
            <h2
              id="habit-modal-title"
              className="font-display italic text-xl sm:text-2xl text-ink mt-0.5"
            >
              {editing ? "Ajusta los detalles" : "Define tu hábito"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 rounded-lg text-muted hover:text-ink hover:bg-bg-alt flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 flex flex-col gap-6">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="habit-name"
              className="font-mono text-[10px] uppercase tracking-widest text-muted"
            >
              Nombre
            </label>
            <input
              id="habit-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Meditar 10 minutos"
              maxLength={60}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "habit-name-error" : undefined}
              className={clsx(
                "h-12 px-4 rounded-lg border bg-bg-alt font-body text-base text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent transition-shadow",
                nameError ? "border-danger" : "border-line"
              )}
            />
            {nameError && (
              <p id="habit-name-error" className="text-danger text-xs font-body" role="alert">
                {nameError}
              </p>
            )}
          </div>

          {/* Icon picker */}
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Icono
            </p>
            <div
              role="radiogroup"
              aria-label="Selecciona un icono"
              className="grid grid-cols-10 gap-1.5"
            >
              {HABIT_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  role="radio"
                  aria-checked={icon === em}
                  aria-label={`Icono ${em}`}
                  onClick={() => setIcon(em)}
                  className={clsx(
                    "aspect-square rounded-lg flex items-center justify-center text-xl transition-all duration-150 ease-out active:scale-95",
                    icon === em
                      ? "bg-bg-alt ring-2 ring-accent"
                      : "hover:bg-bg-alt"
                  )}
                >
                  <span aria-hidden>{em}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Color
            </p>
            <div
              role="radiogroup"
              aria-label="Selecciona un color"
              className="flex items-center gap-2 flex-wrap"
            >
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={clsx(
                    "w-9 h-9 rounded-full transition-all duration-150 ease-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    color === c && "ring-2 ring-offset-2 ring-offset-bg ring-ink"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Frecuencia
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={frequency.kind === "daily"}
                onClick={() => setFrequency({ kind: "daily" })}
                className={clsx(
                  "flex-1 h-11 rounded-lg border font-body text-sm transition-colors duration-150 ease-out",
                  frequency.kind === "daily"
                    ? "border-accent bg-accent/10 text-ink font-medium"
                    : "border-line text-muted hover:border-accent/40"
                )}
              >
                Diario
              </button>
              <button
                type="button"
                aria-pressed={frequency.kind === "specific"}
                onClick={() =>
                  setFrequency({ kind: "specific", days: [0, 1, 2, 3, 4] })
                }
                className={clsx(
                  "flex-1 h-11 rounded-lg border font-body text-sm transition-colors duration-150 ease-out",
                  frequency.kind === "specific"
                    ? "border-accent bg-accent/10 text-ink font-medium"
                    : "border-line text-muted hover:border-accent/40"
                )}
              >
                Días específicos
              </button>
            </div>
            {frequency.kind === "specific" && (
              <div
                role="group"
                aria-label="Días de la semana"
                className="flex items-center gap-1.5 mt-1"
              >
                {DAY_LABELS.map((d) => {
                  const selected = frequency.days.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      aria-pressed={selected}
                      aria-label={d.label}
                      onClick={() => toggleDay(d.value)}
                      className={clsx(
                        "flex-1 h-10 rounded-lg border font-mono text-xs font-medium transition-colors duration-150 ease-out min-w-[36px]",
                        selected
                          ? "border-accent bg-accent text-bg"
                          : "border-line text-muted hover:border-accent/40"
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reminder time */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="habit-reminder"
              className="font-mono text-[10px] uppercase tracking-widest text-muted"
            >
              Recordatorio (opcional)
            </label>
            <input
              id="habit-reminder"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-5 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg-alt transition-colors min-w-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-accent text-bg font-body font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ease-out active:scale-[0.98]"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editing ? "Guardar" : "Crear hábito"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
