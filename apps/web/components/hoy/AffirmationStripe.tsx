"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Loader2,
  Volume2,
  VolumeX,
  Quote,
} from "lucide-react";
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
  const text = mpd.affirmation || mpd.aim;

  return (
    <div
      className={clsx(
        "rounded-card border p-5 sm:p-6 transition-colors",
        read
          ? "border-success/30 bg-success/5"
          : "border-accent/30 bg-accent/5"
      )}
    >
      <div className="flex items-start gap-3">
        <p className="font-display italic text-lg sm:text-xl text-ink leading-snug flex-1">
          {text}
        </p>
        <SpeakButton text={text} />
      </div>
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

/**
 * Botón "leer en voz alta" usando Web Speech API. Si el browser no
 * soporta o el usuario navega fuera mientras habla, abortamos limpio.
 */
function SpeakButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window))
      return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    u.rate = 0.9; // un poco más lento — afirmaciones se digieren mejor
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  // Esconder si el browser no soporta TTS
  if (
    typeof window !== "undefined" &&
    !("speechSynthesis" in window)
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={speak}
      title={speaking ? "Detener" : "Escuchar"}
      className="h-7 w-7 rounded-full bg-bg-alt hover:bg-line/40 text-muted hover:text-ink flex items-center justify-center transition-colors"
      aria-label={speaking ? "Detener lectura" : "Leer afirmación en voz alta"}
    >
      {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
    </button>
  );
}
