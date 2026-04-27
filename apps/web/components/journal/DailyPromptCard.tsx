"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, RefreshCw, ArrowRight, HeartPulse } from "lucide-react";
import {
  getMoodAwareJournalPrompt,
  moodBucket,
  type JournalPrompt,
} from "../../lib/journal/prompts";
import { getAreaMeta } from "../../lib/journal/areas";
import { useCreateJournalEntry } from "../../hooks/useJournal";
import { useMoodLogForDate } from "../../hooks/useMindset";
import { getTodayStr } from "../../lib/dateUtils";
import type { CreateJournalEntryInput } from "@estoicismo/supabase";

const JournalEntryModal = dynamic(
  () => import("./JournalEntryModal").then((m) => m.JournalEntryModal),
  { ssr: false }
);

/**
 * Tarjeta del prompt diario para journaling.
 *
 * Si el user registró su mood hoy → el prompt se adapta (low/mid/high).
 * Si no → fallback determinístico día-del-año.
 * Botón "Otro" permite navegar.
 */
export function DailyPromptCard() {
  const today = useMemo(() => getTodayStr(), []);
  const [seedOffset, setSeedOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const createM = useCreateJournalEntry();
  const { data: todayMood } = useMoodLogForDate(today);
  const bucket = moodBucket(todayMood?.mood);

  const prompt: JournalPrompt = useMemo(
    () => getMoodAwareJournalPrompt(todayMood?.mood ?? null, seedOffset),
    [seedOffset, todayMood?.mood]
  );
  const meta = getAreaMeta(prompt.suggestedArea ?? "free");

  return (
    <>
      <section
        className="rounded-card border p-4 sm:p-5 space-y-3"
        style={{
          background: `linear-gradient(135deg, ${meta.color}10 0%, transparent 60%)`,
          borderColor: `${meta.color}40`,
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted inline-flex items-center gap-1">
            <Sparkles size={11} className="text-accent" />
            Prompt del día
            {bucket && (
              <span className="ml-1 inline-flex items-center gap-1 text-accent">
                <HeartPulse size={10} />
                {bucket === "low"
                  ? "para días duros"
                  : bucket === "high"
                    ? "para días buenos"
                    : "neutral"}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => setSeedOffset((s) => s + 1)}
            className="text-[10px] font-mono uppercase tracking-widest text-muted hover:text-ink inline-flex items-center gap-1"
          >
            <RefreshCw size={10} /> Otro
          </button>
        </div>
        <p className="font-display italic text-lg sm:text-xl text-ink leading-snug">
          {prompt.text}
        </p>
        {prompt.source && (
          <p className="text-[11px] text-muted italic">— {prompt.source}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5"
          >
            Escribir <ArrowRight size={11} />
          </button>
          <span className="text-[10px] text-muted">
            {meta.emoji} sugerido: {meta.label.toLowerCase()}
          </span>
        </div>
      </section>

      <JournalEntryModal
        open={open}
        initialArea={prompt.suggestedArea}
        saving={createM.isPending}
        onClose={() => setOpen(false)}
        onSave={async (input: CreateJournalEntryInput) => {
          // Pre-rellenar el title con el prompt para tener contexto.
          await createM.mutateAsync({
            ...input,
            title: input.title || prompt.text.slice(0, 60),
          });
          setOpen(false);
        }}
      />
    </>
  );
}
