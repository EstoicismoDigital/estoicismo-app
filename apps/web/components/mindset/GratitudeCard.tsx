"use client";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2, Check, Flame } from "lucide-react";
import { clsx } from "clsx";
import {
  useGratitudeForDate,
  useGratitudeRange,
  useUpsertGratitudeSlot,
} from "../../hooks/useMindset";
import { getTodayStr, computeStreak } from "../../lib/dateUtils";

/**
 * Gratitude card · 3 cosas por las que estás agradecido hoy.
 *
 * UX:
 *  - 3 inputs (slots 1, 2, 3). Cada uno se guarda independiente.
 *  - Auto-save por slot a 800ms de inactividad.
 *  - Streak: días consecutivos con al menos 1 slot lleno.
 *  - Pregunta rota — suaviza el "qué escribir" con sugerencias rotantes.
 */

const PROMPTS = [
  "Hoy recibí…",
  "Aún tengo…",
  "Pude disfrutar de…",
  "Me sorprendió…",
  "Alguien hizo por mí…",
  "Está saliendo bien…",
  "Mi cuerpo hoy puede…",
  "Tengo cerca a…",
];

export function GratitudeCard({ embed = false }: { embed?: boolean } = {}) {
  const today = useMemo(() => getTodayStr(), []);
  const { data: rows = [], isLoading } = useGratitudeForDate(today);

  // For streak: load last 60 days range
  const { data: history = [] } = useGratitudeRange({
    from: shiftDays(today, -60),
    to: today,
  });

  const streak = useMemo(() => {
    // Distinct dates with >= 1 entry
    const dates = Array.from(
      new Set(history.map((r) => r.occurred_on))
    ).sort();
    return computeStreak(dates);
  }, [history]);

  if (isLoading) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center min-h-[140px]",
          embed
            ? "py-4"
            : "rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6"
        )}
      >
        <Loader2 size={18} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div
      className={
        embed
          ? ""
          : "rounded-card border border-line bg-bg-alt/50 p-5 sm:p-6"
      }
    >
      {!embed && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Sparkles size={14} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Gratitud · hoy
          </p>
          <span className="h-px flex-1 bg-line min-w-4" />
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-accent/10 text-accent font-mono text-[9px] uppercase tracking-widest">
              <Flame size={10} /> {streak}d
            </span>
          )}
        </div>
      )}

      {embed && streak > 0 && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2 inline-flex items-center gap-1">
          <Flame size={10} /> {streak}d racha
        </p>
      )}

      {!embed && (
        <p className="font-body text-sm text-muted mb-4 leading-relaxed">
          Tres cosas. No tienen que ser grandes. La práctica es notar lo
          que ya tienes.
        </p>
      )}

      <div className="space-y-2.5">
        {[1, 2, 3].map((slot) => (
          <GratitudeSlot
            key={slot}
            slot={slot}
            initialContent={rows.find((r) => r.slot === slot)?.content ?? ""}
            placeholder={PROMPTS[(slot - 1) % PROMPTS.length]}
            today={today}
          />
        ))}
      </div>
    </div>
  );
}

function GratitudeSlot({
  slot,
  initialContent,
  placeholder,
  today,
}: {
  slot: number;
  initialContent: string;
  placeholder: string;
  today: string;
}) {
  const [value, setValue] = useState(initialContent);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const upsert = useUpsertGratitudeSlot();

  // Sync from server when fresh load
  useEffect(() => {
    if (!dirty) setValue(initialContent);
  }, [initialContent, dirty]);

  // Auto-save 800ms after typing stops
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        // Empty: don't upsert; let user delete manually if needed
        setDirty(false);
        return;
      }
      upsert.mutate(
        { occurred_on: today, slot, content: trimmed },
        {
          onSuccess: () => {
            setDirty(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          },
        }
      );
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dirty]);

  return (
    <div className="flex items-start gap-2">
      <span
        className={clsx(
          "h-7 w-7 rounded-full flex items-center justify-center font-mono text-[11px] shrink-0",
          value.trim()
            ? "bg-accent text-bg"
            : "bg-bg-alt text-muted border border-line"
        )}
      >
        {slot}
      </span>
      <div className="flex-1 min-w-0 relative">
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setDirty(true);
          }}
          rows={1}
          maxLength={500}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-body text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[40px]"
          style={{ height: "auto" }}
          ref={(el) => {
            // Auto-resize textarea
            if (el) {
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }
          }}
        />
        {(upsert.isPending || saved) && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted">
            {upsert.isPending ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Check size={10} className="text-success" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function shiftDays(yyyymmdd: string, days: number): string {
  const [y, m, d] = yyyymmdd.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
