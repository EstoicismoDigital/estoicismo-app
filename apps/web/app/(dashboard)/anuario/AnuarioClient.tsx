"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Printer,
  ListChecks,
  Wallet,
  Brain,
  Briefcase,
  BookOpen,
  Dumbbell,
  Pencil,
  Sparkles,
  Trophy,
} from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";
import {
  gatherAnnualReport,
  MONTH_NAMES,
  type AnnualReport,
} from "../../../lib/annual-report/gather";

/**
 * Anuario · Year in Review.
 *
 * "Spotify Wrapped" sobrio: stats reales del año + texto editorial.
 * Botón imprimir/PDF usa window.print con CSS print-friendly.
 *
 * El user puede navegar a años pasados (year - 1, year - 2…).
 */
export function AnuarioClient() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: report, isLoading } = useQuery<AnnualReport>({
    queryKey: ["anuario", year],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return gatherAnnualReport(sb, user.id, year);
    },
    staleTime: 1000 * 60 * 30,
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-bg-deep text-white print:bg-white print:text-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-accent" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Anuario
            </p>
            <span className="h-px flex-1 bg-white/10 print:bg-black/10" />
            <YearPicker
              year={year}
              onChange={setYear}
              currentYear={currentYear}
            />
          </div>

          <h1 className="font-display italic text-4xl sm:text-5xl leading-tight">
            Tu año en una página.
          </h1>
          <p className="font-body text-white/60 print:text-black/60 text-sm mt-3 max-w-prose leading-relaxed">
            {year} · Hábitos, finanzas, mente, lectura, fitness, negocio.
            Datos reales — los tuyos. Sin métricas vacías.
          </p>

          {/* Print button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-widest transition-colors print:hidden"
          >
            <Printer size={12} /> Imprimir / Guardar PDF
          </button>
        </div>
      </section>

      {/* Body */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : !report ? null : (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 print:py-4 print:space-y-4">
          <HabitsSection r={report} />
          <FinanceSection r={report} />
          <MindsetSection r={report} />
          <ReadingSection r={report} />
          <FitnessSection r={report} />
          <BusinessSection r={report} />
          <JournalSection r={report} />

          {/* Closing */}
          <section className="pt-6 border-t border-line">
            <p className="font-display italic text-xl text-ink leading-snug max-w-prose">
              Mira lo que hiciste. Sin necesitar que nadie lo aplaudiera.
              Mañana sigues construyendo.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-3">
              Marco Aurelio · Estoicismo Digital
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Year picker
// ─────────────────────────────────────────────────────────────

function YearPicker({
  year,
  onChange,
  currentYear,
}: {
  year: number;
  onChange: (y: number) => void;
  currentYear: number;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(year - 1)}
        className="h-7 w-7 rounded-full hover:bg-white/10 flex items-center justify-center"
        aria-label="Año anterior"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="font-display italic text-base px-2">{year}</span>
      <button
        type="button"
        onClick={() => onChange(year + 1)}
        disabled={year >= currentYear}
        className="h-7 w-7 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-30"
        aria-label="Año siguiente"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  module,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  module?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3" data-module={module}>
      <Icon size={14} className="text-accent" />
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        {title}
      </p>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function BigStat({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="font-display italic text-3xl text-ink leading-none">
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-1">
        {label}
      </p>
      {sub && <p className="font-body text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function HabitsSection({ r }: { r: AnnualReport }) {
  const { habits } = r;
  if (habits.totalCompletions === 0)
    return (
      <EmptySection
        icon={ListChecks}
        title="Hábitos"
        message="Sin registros este año todavía. Empieza con un hábito pequeño."
      />
    );
  return (
    <section data-module="habits">
      <SectionHeader icon={ListChecks} title="Hábitos" module="habits" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <BigStat
          value={habits.totalCompletions.toString()}
          label="Completaciones"
        />
        <BigStat
          value={habits.activeHabits.toString()}
          label="Hábitos activos"
        />
        {habits.topHabit && (
          <BigStat
            value={habits.topHabit.completions.toString()}
            label={`Mejor hábito`}
            sub={habits.topHabit.name}
          />
        )}
      </div>
      {habits.topHabit && (
        <p className="font-body text-sm text-muted mt-4 max-w-prose leading-relaxed">
          Tu hábito más constante fue{" "}
          <span className="text-ink italic">{habits.topHabit.name}</span> con{" "}
          {habits.topHabit.completions} días — la diferencia entre saber y
          hacer.
        </p>
      )}
    </section>
  );
}

function FinanceSection({ r }: { r: AnnualReport }) {
  const { finance } = r;
  if (finance.txCount === 0)
    return (
      <EmptySection
        icon={Wallet}
        title="Finanzas"
        message="Sin movimientos registrados este año."
      />
    );
  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
  return (
    <section data-module="finanzas">
      <SectionHeader icon={Wallet} title="Finanzas" module="finanzas" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <BigStat
          value={fmt(finance.incomeTotal)}
          label="Ingresos"
          sub={finance.currency}
        />
        <BigStat
          value={fmt(finance.expenseTotal)}
          label="Gastos"
          sub={finance.currency}
        />
        <BigStat
          value={fmt(finance.balance)}
          label="Balance"
          sub={finance.balance >= 0 ? "ahorrado" : "neto"}
        />
      </div>
      <p className="font-body text-sm text-muted mt-4 max-w-prose leading-relaxed">
        {finance.txCount} transacciones registradas.
        {finance.topIncomeMonth && (
          <>
            {" "}
            Tu mejor mes en ingresos fue{" "}
            <span className="text-ink italic">
              {MONTH_NAMES[finance.topIncomeMonth.month - 1]}
            </span>{" "}
            ({fmt(finance.topIncomeMonth.total)} {finance.currency}).
          </>
        )}
        {finance.topExpenseCategory && (
          <>
            {" "}
            Donde más gastaste:{" "}
            <span className="text-ink italic">
              {finance.topExpenseCategory.name}
            </span>{" "}
            ({fmt(finance.topExpenseCategory.total)} {finance.currency}).
          </>
        )}
      </p>
    </section>
  );
}

function MindsetSection({ r }: { r: AnnualReport }) {
  const { mindset } = r;
  const hasData =
    mindset.mpdLogDays > 0 ||
    mindset.moodLogDays > 0 ||
    mindset.meditationSessions > 0 ||
    mindset.visionAchieved > 0 ||
    mindset.pinnedInsights > 0 ||
    mindset.futureLetters > 0 ||
    mindset.gratitudeDays > 0;
  if (!hasData)
    return (
      <EmptySection
        icon={Brain}
        title="Mentalidad"
        message="Sin registros mentales este año todavía."
      />
    );
  return (
    <section data-module="reflexiones">
      <SectionHeader icon={Brain} title="Mentalidad" module="reflexiones" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <BigStat
          value={mindset.mpdLogDays.toString()}
          label="Días con MPD"
        />
        <BigStat
          value={mindset.moodLogDays.toString()}
          label="Días con mood"
          sub={
            mindset.moodAvg !== null
              ? `prom. ${mindset.moodAvg}/5`
              : undefined
          }
        />
        <BigStat
          value={mindset.gratitudeDays.toString()}
          label="Días con gratitud"
          sub={
            mindset.gratitudeEntries > 0
              ? `${mindset.gratitudeEntries} cosas`
              : undefined
          }
        />
        <BigStat
          value={mindset.meditationSessions.toString()}
          label="Meditaciones"
        />
        <BigStat
          value={mindset.visionAchieved.toString()}
          label="Visión cumplida"
        />
        <BigStat
          value={mindset.pinnedInsights.toString()}
          label="Insights guardados"
          sub="con Pegasso"
        />
        <BigStat
          value={mindset.futureLetters.toString()}
          label="Cartas al futuro"
        />
      </div>
    </section>
  );
}

function ReadingSection({ r }: { r: AnnualReport }) {
  const { reading } = r;
  if (reading.sessions === 0 && reading.booksFinished === 0)
    return (
      <EmptySection
        icon={BookOpen}
        title="Lectura"
        message="Sin sesiones de lectura este año."
      />
    );
  return (
    <section>
      <SectionHeader icon={BookOpen} title="Lectura" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BigStat
          value={reading.booksFinished.toString()}
          label="Libros leídos"
        />
        <BigStat value={reading.pagesRead.toString()} label="Páginas" />
        <BigStat value={reading.minutesRead.toString()} label="Minutos" />
        <BigStat value={reading.sessions.toString()} label="Sesiones" />
      </div>
      {reading.favoriteBook && (
        <p className="font-body text-sm text-muted mt-4 max-w-prose leading-relaxed">
          Tu libro favorito del año:{" "}
          <span className="text-ink italic">{reading.favoriteBook.title}</span>
          {reading.favoriteBook.rating != null && (
            <> · {reading.favoriteBook.rating}/5</>
          )}
          .
        </p>
      )}
    </section>
  );
}

function FitnessSection({ r }: { r: AnnualReport }) {
  const { fitness } = r;
  if (fitness.workoutsCount === 0 && fitness.setsCount === 0)
    return (
      <EmptySection
        icon={Dumbbell}
        title="Fitness"
        message="Sin entrenamientos registrados este año."
      />
    );
  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
  return (
    <section>
      <SectionHeader icon={Dumbbell} title="Fitness" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BigStat
          value={fitness.workoutsCount.toString()}
          label="Workouts"
        />
        <BigStat value={fitness.setsCount.toString()} label="Sets" />
        <BigStat value={fmt(fitness.totalReps)} label="Reps totales" />
        <BigStat
          value={fmt(fitness.totalVolume)}
          label="Volumen"
          sub="kg×reps"
        />
      </div>
    </section>
  );
}

function BusinessSection({ r }: { r: AnnualReport }) {
  const { business, finance } = r;
  if (
    business.salesCount === 0 &&
    business.tasksCompleted === 0 &&
    business.milestonesAchieved === 0
  )
    return null;
  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
  return (
    <section data-module="emprendimiento">
      <SectionHeader
        icon={Briefcase}
        title="Negocio"
        module="emprendimiento"
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BigStat
          value={business.salesCount.toString()}
          label="Ventas"
        />
        <BigStat
          value={fmt(business.salesTotal)}
          label="Vendido"
          sub={finance.currency}
        />
        <BigStat
          value={business.tasksCompleted.toString()}
          label="Tareas"
        />
        <BigStat
          value={business.milestonesAchieved.toString()}
          label="Hitos"
          sub="logrados"
        />
      </div>
      {business.milestonesAchieved > 0 && (
        <p className="font-body text-sm text-muted mt-4 max-w-prose leading-relaxed inline-flex items-center gap-1.5">
          <Trophy size={14} className="text-accent" /> {business.milestonesAchieved}{" "}
          {business.milestonesAchieved === 1 ? "hito alcanzado" : "hitos alcanzados"}{" "}
          este año — sigue subiendo el listón.
        </p>
      )}
    </section>
  );
}

function JournalSection({ r }: { r: AnnualReport }) {
  const { journal } = r;
  if (journal.entriesCount === 0) return null;
  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
  return (
    <section>
      <SectionHeader icon={Pencil} title="Diario" />
      <div className="grid grid-cols-2 gap-4">
        <BigStat
          value={journal.entriesCount.toString()}
          label="Entradas"
        />
        <BigStat
          value={fmt(journal.wordsTotal)}
          label="Palabras"
          sub="aprox."
        />
      </div>
    </section>
  );
}

function EmptySection({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  message: string;
}) {
  return (
    <section>
      <SectionHeader icon={Icon} title={title} />
      <p className="font-body text-sm text-muted italic">{message}</p>
    </section>
  );
}
