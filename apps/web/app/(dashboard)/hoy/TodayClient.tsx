"use client";
import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Wind,
  Compass,
  Sparkles,
} from "lucide-react";
import { useProfile } from "../../../hooks/useProfile";
import { useTodayRitual, useRitualStreak } from "../../../hooks/useTodayRitual";
import { useTodaySkips } from "../../../hooks/useTodaySkips";
import { useTransactions } from "../../../hooks/useFinance";
import { useExercises, useFitnessProfile } from "../../../hooks/useFitness";
import { getTodayStr } from "../../../lib/dateUtils";
import { formatMoney } from "../../../lib/finance";
import { getStoicExerciseOfDay } from "../../../lib/mindset/stoic-exercises";

import { RitualProgressRing } from "../../../components/hoy/RitualProgressRing";
import { AffirmationStripe } from "../../../components/hoy/AffirmationStripe";
import { HoySection } from "../../../components/hoy/HoySection";
import { TodayHabitsList } from "../../../components/hoy/TodayHabitsList";
import { QuickAddTransactionRow } from "../../../components/hoy/QuickAddTransactionRow";
import { QuickAddSaleRow } from "../../../components/hoy/QuickAddSaleRow";
import { QuickAddReadingRow } from "../../../components/hoy/QuickAddReadingRow";
import { MoodTrackerCard } from "../../../components/mindset/MoodTrackerCard";
import { GratitudeCard } from "../../../components/mindset/GratitudeCard";
import { DailyPromptCard } from "../../../components/journal/DailyPromptCard";
import { QuickLogCard } from "../../../components/fitness/QuickLogCard";

/**
 * /hoy · Ritual matutino.
 *
 * Filosofía: una sola pantalla en vertical. El user abre la app a
 * primera hora, fila por fila, llena lo que toca. Las secciones
 * inactivas (sin fitness profile, sin libro, etc) se esconden.
 *
 * Objetivo: ritual completo en 10-15 min. Cero modal, cero clicks
 * extras, todo inline.
 *
 * El header tiene un anillo de progreso con emojis tappables que
 * scrollean a su sección correspondiente.
 */
export function TodayClient() {
  const today = useMemo(() => getTodayStr(), []);
  const { data: profile } = useProfile();
  const { data: rawStatus, isLoading: statusLoading } = useTodayRitual();
  const { data: streak = 0 } = useRitualStreak();
  const { isSkipped, toggle: toggleSkip } = useTodaySkips();

  // Mezclar skips locales con el status del DB: skipped sections cuentan
  // como done.
  const status = useMemo(() => {
    if (!rawStatus) return rawStatus;
    const sections = rawStatus.sections.map((s) => ({
      ...s,
      done: s.done || isSkipped(s.id),
    }));
    const available = sections.filter((s) => s.available);
    const done = available.filter((s) => s.done);
    const completedCount = done.length;
    const availableCount = available.length;
    const ratio = availableCount > 0 ? completedCount / availableCount : 0;
    return {
      ...rawStatus,
      sections,
      completedCount,
      availableCount,
      ratio,
      ritualMet: completedCount >= Math.min(4, availableCount),
    };
  }, [rawStatus, isSkipped]);

  // Transacciones de hoy para mostrar en la sección de plata
  const { data: txToday = [] } = useTransactions({ from: today, to: today });

  // Fitness data — solo se carga si el user tiene fitness profile
  const { data: fitnessProfile } = useFitnessProfile();
  const { data: exercises = [] } = useExercises();
  const incomeToday = txToday
    .filter((t) => t.kind === "income")
    .reduce((a, t) => a + Number(t.amount), 0);
  const expenseToday = txToday
    .filter((t) => t.kind === "expense")
    .reduce((a, t) => a + Number(t.amount), 0);
  const currency = txToday[0]?.currency ?? "MXN";

  const exercise = useMemo(() => getStoicExerciseOfDay(), []);

  function jumpTo(id: string) {
    // The ring emits the section's RitualSectionId ("inspire", "mood",
    // …) but our HoySection anchors are prefixed with "hoy-".
    document
      .getElementById(`hoy-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            {greetingByHour()} · {prettyDate()}
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl leading-tight mb-4">
            {profile?.username
              ? `${profile.username}, tu día empieza aquí.`
              : "Tu día empieza aquí."}
          </h1>

          {statusLoading || !status ? (
            <div className="h-24 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-white/60" />
            </div>
          ) : (
            <RitualProgressRing
              status={status}
              streak={streak}
              size={88}
              onJump={jumpTo}
            />
          )}

          {/* Subtítulo dinámico según progreso + hora */}
          <p className="font-body text-sm text-white/70 mt-5 leading-relaxed max-w-prose">
            {ritualNudge(
              status?.completedCount ?? 0,
              status?.availableCount ?? 0
            )}
          </p>
        </div>
      </section>

      {/* Body — secciones */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* 1. Afirmación / MPD */}
        <HoySection
          step={1}
          emoji="✨"
          title="Tu por qué"
          caption="Léelo antes que nada. Tu cerebro escucha."
          done={status?.sections.find((s) => s.id === "inspire")?.done}
          skipped={isSkipped("inspire")}
          onSkipToggle={() => toggleSkip("inspire")}
          anchor="hoy-inspire"
        >
          <AffirmationStripe />
        </HoySection>

        {/* 2. Mood */}
        <HoySection
          step={2}
          emoji="💗"
          title="¿Cómo amaneces?"
          caption="Un toque. Sin pensarlo dos veces."
          done={status?.sections.find((s) => s.id === "mood")?.done}
          skipped={isSkipped("mood")}
          onSkipToggle={() => toggleSkip("mood")}
          anchor="hoy-mood"
        >
          <MoodTrackerCard embed />
        </HoySection>

        {/* 3. Gratitud */}
        <HoySection
          step={3}
          emoji="🙏"
          title="Tres gracias"
          caption="No tienen que ser grandes. La práctica es notar."
          done={status?.sections.find((s) => s.id === "gratitude")?.done}
          skipped={isSkipped("gratitude")}
          onSkipToggle={() => toggleSkip("gratitude")}
          anchor="hoy-gratitude"
        >
          <GratitudeCard embed />
        </HoySection>

        {/* 4. Hábitos */}
        {status?.sections.find((s) => s.id === "habits")?.available && (
          <HoySection
            step={4}
            emoji="✓"
            title="Hábitos de hoy"
            caption="Solo los que aplican según tu frecuencia."
            done={status?.sections.find((s) => s.id === "habits")?.done}
            skipped={isSkipped("habits")}
            onSkipToggle={() => toggleSkip("habits")}
            anchor="hoy-habits"
          >
            <TodayHabitsList />
          </HoySection>
        )}

        {/* 5. Plata */}
        <HoySection
          step={5}
          emoji="💰"
          title="Plata de hoy"
          caption="Cada peso registrado hoy. Hazlo en frío, no esperes a fin de mes."
          done={status?.sections.find((s) => s.id === "money")?.done}
          skipped={isSkipped("money")}
          onSkipToggle={() => toggleSkip("money")}
          anchor="hoy-money"
          hint="Tip: Enter para guardar y seguir. Más opciones en /finanzas."
        >
          <div className="space-y-2">
            <QuickAddTransactionRow defaultKind="expense" />
            <QuickAddTransactionRow defaultKind="income" />
            {txToday.length > 0 && (
              <div className="rounded-lg border border-line bg-bg-alt/40 p-3 mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    Hoy: {txToday.length}{" "}
                    {txToday.length === 1 ? "movimiento" : "movimientos"}
                  </p>
                  <Link
                    href="/finanzas"
                    className="font-mono text-[10px] uppercase tracking-widest text-accent hover:underline"
                  >
                    Ver todas →
                  </Link>
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  {incomeToday > 0 && (
                    <span className="text-success font-display italic text-sm">
                      +{formatMoney(incomeToday, currency)}
                    </span>
                  )}
                  {expenseToday > 0 && (
                    <span className="text-danger font-display italic text-sm">
                      -{formatMoney(expenseToday, currency)}
                    </span>
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted ml-auto">
                    Neto:{" "}
                    {formatMoney(incomeToday - expenseToday, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </HoySection>

        {/* 6. Negocio */}
        {status?.sections.find((s) => s.id === "business")?.available && (
          <HoySection
            step={6}
            emoji="💼"
            title="Negocio"
            caption="Si vendiste hoy o cerraste tarea — acá."
            done={status?.sections.find((s) => s.id === "business")?.done}
            skipped={isSkipped("business")}
            onSkipToggle={() => toggleSkip("business")}
            anchor="hoy-business"
          >
            <div className="space-y-2">
              <QuickAddSaleRow />
              <Link
                href="/emprendimiento"
                className="block text-center font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink py-1"
              >
                Tareas, hitos, productos → /emprendimiento
              </Link>
            </div>
          </HoySection>
        )}

        {/* 7. Cuerpo */}
        {status?.sections.find((s) => s.id === "body")?.available && (
          <HoySection
            step={7}
            emoji="💪"
            title="Cuerpo"
            caption="Una serie aquí mismo. Para más, /habitos/fitness."
            done={status?.sections.find((s) => s.id === "body")?.done}
            skipped={isSkipped("body")}
            onSkipToggle={() => toggleSkip("body")}
            anchor="hoy-body"
          >
            <div className="space-y-2">
              <QuickLogCard
                exercises={exercises}
                preferredExerciseSlugs={
                  fitnessProfile?.preferred_exercises ?? []
                }
              />
              <Link
                href="/habitos/fitness"
                className="block text-center font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink py-1"
              >
                Workout completo, PRs, medidas → /habitos/fitness
              </Link>
            </div>
          </HoySection>
        )}

        {/* 8. Lectura */}
        {status?.sections.find((s) => s.id === "reading")?.available && (
          <HoySection
            step={8}
            emoji="📖"
            title="Lectura"
            caption="20 minutos hoy = 12 libros al año."
            done={status?.sections.find((s) => s.id === "reading")?.done}
            skipped={isSkipped("reading")}
            onSkipToggle={() => toggleSkip("reading")}
            anchor="hoy-reading"
          >
            <QuickAddReadingRow />
          </HoySection>
        )}

        {/* 9. Reflexión */}
        <HoySection
          step={9}
          emoji="📓"
          title="Reflexión"
          caption="Cierra tu mañana con un pensamiento real."
          done={status?.sections.find((s) => s.id === "reflect")?.done}
          skipped={isSkipped("reflect")}
          onSkipToggle={() => toggleSkip("reflect")}
          anchor="hoy-reflect"
        >
          <div className="space-y-3">
            {/* Stoic exercise of the day — collapsed view */}
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Compass size={12} className="text-accent" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Ejercicio estoico de hoy
                </p>
                {exercise.source && (
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted ml-auto">
                    {exercise.source}
                  </p>
                )}
              </div>
              <p className="font-display italic text-base text-ink">
                {exercise.title}
              </p>
              <p className="font-body text-xs text-muted mt-1 leading-snug">
                {exercise.description}
              </p>
            </div>
            <DailyPromptCard />
          </div>
        </HoySection>

        {/* Atajos al final */}
        <section className="pt-4 border-t border-line">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
            Más a fondo
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <ShortcutLink href="/reflexiones/respira" emoji="🌬" label="Respira" />
            <ShortcutLink
              href="/reflexiones/meditacion"
              emoji="🧘"
              label="Meditar"
            />
            <ShortcutLink href="/anuario" emoji="📅" label="Anuario" />
            <ShortcutLink href="/pegasso" emoji="✨" label="Pegasso" />
            <ShortcutLink href="/progreso" emoji="📊" label="Progreso" />
            <ShortcutLink href="/notas" emoji="✍️" label="Diario" />
          </div>
        </section>

        {/* Cierre del día */}
        {status?.ritualMet && (
          <section className="rounded-card border border-success/30 bg-success/5 p-5 sm:p-6 text-center">
            <Sparkles size={20} className="text-success mx-auto mb-2" />
            <p className="font-display italic text-xl text-ink mb-1">
              Ritual completo.
            </p>
            <p className="font-body text-sm text-muted leading-relaxed max-w-prose mx-auto">
              {streak > 0
                ? `Llevas ${streak} ${streak === 1 ? "día" : "días"} seguidos. La consistencia es la única magia que existe.`
                : "Vuelve mañana — la racha se construye un día a la vez."}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shortcuts row
// ─────────────────────────────────────────────────────────────

function ShortcutLink({
  href,
  emoji,
  label,
}: {
  href: string;
  emoji: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border border-line bg-bg-alt/30 p-3 hover:border-line-strong hover:bg-bg-alt/60 transition-all"
    >
      <span className="text-base">{emoji}</span>
      <span className="font-body text-xs text-ink truncate">{label}</span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function prettyDate(): string {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Texto motivacional dinámico bajo el ring de progreso. Cambia según
 * cuánto llevas + qué hora es. Corto, sin moralina.
 */
function ritualNudge(done: number, available: number): string {
  const h = new Date().getHours();
  const isMorning = h < 12;
  const isEvening = h >= 19;
  if (available === 0) {
    return "Configura tu MPD para empezar — todo lo demás se acomoda.";
  }
  if (done === 0) {
    if (isMorning) return "Empieza con cualquier sección. Da igual cuál.";
    if (isEvening)
      return "Aún hay tiempo. Una sección hoy es mejor que cero.";
    return "Tu yo de la noche te lo agradecerá. Empieza por algo pequeño.";
  }
  if (done < 4) {
    return `Vas en ${done}. Cada uno construye el siguiente.`;
  }
  if (done >= available) {
    return "Día completo. Sin necesitar que nadie lo aplaudiera.";
  }
  // Ritual met but not all done
  return "Ritual cubierto. Lo que sigue es propina.";
}
