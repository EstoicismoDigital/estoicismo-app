"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Check, Quote, ArrowRight, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import {
  useMPD,
  useMPDLogForDate,
  useUpsertMPDLog,
} from "../../hooks/useMindset";
import { getTodayStr } from "../../lib/dateUtils";

/**
 * Stripe de tu MPD/afirmación arriba en /hoy.
 *
 * - Sin MPD: prompt minimal "define tu propósito → /reflexiones".
 * - Con MPD: muestra afirmación en serif italic + checkbox "leído hoy".
 *
 * Visualmente intenso porque es lo primero que el user lee — debe
 * resonar.
 */
export function AffirmationStripe() {
  const today = useMemo(() => getTodayStr(), []);
  const { data: mpd, isLoading } = useMPD();
  const { data: log } = useMPDLogForDate(today);
  const upsertLog = useUpsertMPDLog();

  if (isLoading) {
    return (
      <div className="rounded-card border border-line bg-bg-alt/50 p-5 flex items-center justify-center min-h-[100px]">
        <Loader2 size={16} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!mpd) {
    return (
      <div className="rounded-card border border-dashed border-line bg-bg-alt/30 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <Quote size={14} className="text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Tu propósito
          </p>
        </div>
        <p className="font-display italic text-lg text-ink leading-snug mb-3">
          Antes de cualquier hábito hay un por qué.
        </p>
        <p className="font-body text-sm text-muted leading-relaxed mb-4">
          Define tu Propósito Mayor Definido — una frase clara que tu mente
          aprenda a leer dos veces al día.
        </p>
        <Link
          href="/reflexiones"
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-accent text-bg font-body text-sm font-medium hover:opacity-90"
        >
          Escribir mi MPD <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const read = log?.read_affirmation ?? false;

  return (
    <div
      className={clsx(
        "rounded-card border p-5 sm:p-6 transition-colors",
        read
          ? "border-success/30 bg-success/5"
          : "border-accent/30 bg-accent/5"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Quote size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Tu por qué · léelo en voz alta
        </p>
      </div>
      <p className="font-display italic text-lg sm:text-xl text-ink leading-snug">
        {mpd.affirmation || mpd.aim}
      </p>
      {mpd.deadline && (
        <p className="font-body text-xs text-muted mt-2">
          Fecha objetivo: {formatDate(mpd.deadline)}
        </p>
      )}
      <button
        type="button"
        onClick={() =>
          upsertLog.mutate({
            date: today,
            read_affirmation: !read,
            progress_note: log?.progress_note ?? null,
            mood: log?.mood ?? null,
            belief: log?.belief ?? null,
          })
        }
        disabled={upsertLog.isPending}
        className={clsx(
          "mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-full font-body text-sm font-medium transition-colors",
          read
            ? "bg-success text-white hover:opacity-90"
            : "bg-accent text-bg hover:opacity-90",
          upsertLog.isPending && "opacity-60"
        )}
      >
        {upsertLog.isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Check size={14} strokeWidth={3} />
        )}
        {read ? "Leída hoy" : "Marcar como leída"}
      </button>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
