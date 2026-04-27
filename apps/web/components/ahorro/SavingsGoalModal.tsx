"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type { SavingsGoal, CreateGoalInput } from "@estoicismo/supabase";
import { ImageUploadField } from "../ui/ImageUploadField";

const PALETTE = [
  "#22774E",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#0EA5E9",
  "#0F766E",
  "#B45309",
];

const ICONS = [
  "piggy-bank",
  "plane",
  "home",
  "car",
  "graduation-cap",
  "gift",
  "smartphone",
  "heart",
];

export function SavingsGoalModal(props: {
  open: boolean;
  goal?: SavingsGoal | null;
  onClose: () => void;
  onSave: (input: CreateGoalInput) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, goal, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal?.target_amount ? String(goal.target_amount) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [imageUrl, setImageUrl] = useState(goal?.image_url ?? "");
  const [color, setColor] = useState(goal?.color ?? PALETTE[0]);
  const [icon, setIcon] = useState(goal?.icon ?? ICONS[0]);
  const [notes, setNotes] = useState(goal?.notes ?? "");

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setTarget(goal?.target_amount ? String(goal.target_amount) : "");
    setDeadline(goal?.deadline ?? "");
    setImageUrl(goal?.image_url ?? "");
    setColor(goal?.color ?? PALETTE[0]);
    setIcon(goal?.icon ?? ICONS[0]);
    setNotes(goal?.notes ?? "");
  }, [open, goal]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">
            {goal ? "Editar meta" : "Nueva meta de ahorro"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Viaje a Japón · Macbook · Departamento…"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Meta ($)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="50000"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Fecha límite (opcional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <ImageUploadField
            value={imageUrl}
            onChange={setImageUrl}
            bucket="savings-goals"
            purpose="goal"
            label="Imagen motivacional"
            aspectRatio="landscape"
            size="md"
            helper="Una foto del sueño que persigues. La verás cada vez que abras esta meta."
          />
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
              Color
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={clsx(
                    "w-7 h-7 rounded-full border-2",
                    color === c ? "border-ink" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink resize-none focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="border-t border-line px-5 py-3 flex justify-end gap-2 sticky bottom-0 bg-bg-alt/95">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!name.trim() || !target || saving}
            onClick={async () => {
              if (!name.trim() || !target) return;
              await onSave({
                name: name.trim(),
                target_amount: Number(target),
                deadline: deadline || null,
                image_url: imageUrl.trim() || null,
                color,
                icon,
                notes: notes.trim() || null,
              });
            }}
            className={clsx(
              "px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest",
              "hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {goal ? "Guardar" : "Crear meta"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
