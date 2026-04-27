import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Annual report · gather data from all modules for a given year.
 *
 * Best-effort: si una tabla falla, sigue con las demás. Pensado
 * como "year in review" estilo Spotify Wrapped pero sobrio:
 * datos crudos + texto editorial sobre ellos.
 */

export type AnnualReport = {
  year: number;
  habits: {
    totalCompletions: number;
    activeHabits: number;
    topHabit: { name: string; completions: number } | null;
    bestStreakHabit: { name: string; streak: number } | null;
  };
  finance: {
    incomeTotal: number;
    expenseTotal: number;
    balance: number;
    currency: string;
    txCount: number;
    topExpenseCategory: { name: string; total: number } | null;
    topIncomeMonth: { month: number; total: number } | null;
  };
  reading: {
    booksFinished: number;
    pagesRead: number;
    minutesRead: number;
    sessions: number;
    favoriteBook: { title: string; rating: number | null } | null;
  };
  fitness: {
    workoutsCount: number;
    setsCount: number;
    totalReps: number;
    totalVolume: number; // weight × reps
  };
  mindset: {
    mpdLogDays: number;
    moodLogDays: number;
    moodAvg: number | null;
    meditationSessions: number;
    visionAchieved: number;
    pinnedInsights: number;
    futureLetters: number;
    gratitudeDays: number;
    gratitudeEntries: number;
  };
  business: {
    salesCount: number;
    salesTotal: number;
    tasksCompleted: number;
    milestonesAchieved: number;
  };
  journal: {
    entriesCount: number;
    wordsTotal: number;
  };
};

export async function gatherAnnualReport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>,
  userId: string,
  year: number
): Promise<AnnualReport> {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const startTs = `${start}T00:00:00Z`;
  const endTs = `${end}T23:59:59Z`;

  const result: AnnualReport = {
    year,
    habits: {
      totalCompletions: 0,
      activeHabits: 0,
      topHabit: null,
      bestStreakHabit: null,
    },
    finance: {
      incomeTotal: 0,
      expenseTotal: 0,
      balance: 0,
      currency: "MXN",
      txCount: 0,
      topExpenseCategory: null,
      topIncomeMonth: null,
    },
    reading: {
      booksFinished: 0,
      pagesRead: 0,
      minutesRead: 0,
      sessions: 0,
      favoriteBook: null,
    },
    fitness: {
      workoutsCount: 0,
      setsCount: 0,
      totalReps: 0,
      totalVolume: 0,
    },
    mindset: {
      mpdLogDays: 0,
      moodLogDays: 0,
      moodAvg: null,
      meditationSessions: 0,
      visionAchieved: 0,
      pinnedInsights: 0,
      futureLetters: 0,
      gratitudeDays: 0,
      gratitudeEntries: 0,
    },
    business: {
      salesCount: 0,
      salesTotal: 0,
      tasksCompleted: 0,
      milestonesAchieved: 0,
    },
    journal: { entriesCount: 0, wordsTotal: 0 },
  };

  // Habits
  try {
    const { data: logs } = await sb
      .from("habit_logs")
      .select("habit_id, completed_at")
      .eq("user_id", userId)
      .gte("completed_at", start)
      .lte("completed_at", end);
    if (logs) {
      result.habits.totalCompletions = logs.length;
      const byHabit = new Map<string, number>();
      for (const l of logs as { habit_id: string }[]) {
        byHabit.set(l.habit_id, (byHabit.get(l.habit_id) ?? 0) + 1);
      }
      result.habits.activeHabits = byHabit.size;
      const top = Array.from(byHabit.entries()).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        const { data: habit } = await sb
          .from("habits")
          .select("name")
          .eq("id", top[0])
          .maybeSingle();
        if (habit) {
          result.habits.topHabit = {
            name: (habit as { name: string }).name,
            completions: top[1],
          };
        }
      }
    }
  } catch {
    /* ignore */
  }

  // Finance
  try {
    const { data: txs } = await sb
      .from("finance_transactions")
      .select("amount, kind, currency, category_id, occurred_on")
      .eq("user_id", userId)
      .gte("occurred_on", start)
      .lte("occurred_on", end);
    if (txs) {
      const rows = txs as {
        amount: number;
        kind: "income" | "expense";
        currency: string;
        category_id: string | null;
        occurred_on: string;
      }[];
      result.finance.txCount = rows.length;
      const byCat = new Map<string, number>();
      const byMonthIncome = new Map<number, number>();
      for (const r of rows) {
        if (r.kind === "income") {
          result.finance.incomeTotal += Number(r.amount);
          const m = parseInt(r.occurred_on.slice(5, 7), 10);
          byMonthIncome.set(m, (byMonthIncome.get(m) ?? 0) + Number(r.amount));
        } else {
          result.finance.expenseTotal += Number(r.amount);
          if (r.category_id) {
            byCat.set(
              r.category_id,
              (byCat.get(r.category_id) ?? 0) + Number(r.amount)
            );
          }
        }
        if (r.currency) result.finance.currency = r.currency;
      }
      result.finance.balance =
        result.finance.incomeTotal - result.finance.expenseTotal;

      const topCat = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0];
      if (topCat) {
        const { data: cat } = await sb
          .from("finance_categories")
          .select("name")
          .eq("id", topCat[0])
          .maybeSingle();
        if (cat) {
          result.finance.topExpenseCategory = {
            name: (cat as { name: string }).name,
            total: topCat[1],
          };
        }
      }
      const topMonth = Array.from(byMonthIncome.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0];
      if (topMonth) {
        result.finance.topIncomeMonth = {
          month: topMonth[0],
          total: topMonth[1],
        };
      }
    }
  } catch {
    /* ignore */
  }

  // Reading
  try {
    const { count: bookCount } = await sb
      .from("reading_books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_finished", true)
      .gte("finished_at", start)
      .lte("finished_at", end);
    result.reading.booksFinished = bookCount ?? 0;

    const { data: sessions } = await sb
      .from("reading_sessions")
      .select("duration_seconds, pages_from, pages_to")
      .eq("user_id", userId)
      .gte("occurred_on", start)
      .lte("occurred_on", end);
    if (sessions) {
      const rows = sessions as {
        duration_seconds: number;
        pages_from: number | null;
        pages_to: number | null;
      }[];
      result.reading.sessions = rows.length;
      result.reading.minutesRead = Math.round(
        rows.reduce((a, r) => a + (r.duration_seconds ?? 0), 0) / 60
      );
      result.reading.pagesRead = rows.reduce((a, r) => {
        if (r.pages_from != null && r.pages_to != null) {
          return a + Math.max(0, r.pages_to - r.pages_from);
        }
        return a;
      }, 0);
    }

    // Favorite book by rating
    const { data: top } = await sb
      .from("reading_books")
      .select("title, rating, finished_at")
      .eq("user_id", userId)
      .eq("is_finished", true)
      .gte("finished_at", start)
      .lte("finished_at", end)
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(1);
    if (top && top.length > 0) {
      const t = top[0] as { title: string; rating: number | null };
      result.reading.favoriteBook = { title: t.title, rating: t.rating };
    }
  } catch {
    /* ignore */
  }

  // Fitness
  try {
    const { count: workouts } = await sb
      .from("fitness_workouts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("performed_on", start)
      .lte("performed_on", end);
    result.fitness.workoutsCount = workouts ?? 0;

    const { data: sets } = await sb
      .from("fitness_workout_sets")
      .select("reps, weight, occurred_on")
      .eq("user_id", userId)
      .gte("occurred_on", start)
      .lte("occurred_on", end);
    if (sets) {
      const rows = sets as {
        reps: number | null;
        weight: number | null;
      }[];
      result.fitness.setsCount = rows.length;
      result.fitness.totalReps = rows.reduce((a, r) => a + (r.reps ?? 0), 0);
      result.fitness.totalVolume = rows.reduce(
        (a, r) => a + (r.reps ?? 0) * (r.weight ?? 0),
        0
      );
    }
  } catch {
    /* ignore */
  }

  // Mindset MPD logs + moods + meditation + vision + pins + letters
  try {
    const { count: mpdDays } = await sb
      .from("mindset_mpd_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end);
    result.mindset.mpdLogDays = mpdDays ?? 0;

    const { data: moods } = await sb
      .from("mindset_mood_logs")
      .select("mood")
      .eq("user_id", userId)
      .gte("occurred_on", start)
      .lte("occurred_on", end);
    if (moods && moods.length > 0) {
      const rows = moods as { mood: number }[];
      result.mindset.moodLogDays = rows.length;
      result.mindset.moodAvg = +(
        rows.reduce((a, r) => a + r.mood, 0) / rows.length
      ).toFixed(1);
    }

    const { count: meds } = await sb
      .from("mindset_meditations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("occurred_on", start)
      .lte("occurred_on", end);
    result.mindset.meditationSessions = meds ?? 0;

    const { count: vis } = await sb
      .from("mindset_vision_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("achieved", true)
      .gte("achieved_at", startTs)
      .lte("achieved_at", endTs);
    result.mindset.visionAchieved = vis ?? 0;

    const { count: pins } = await sb
      .from("pegasso_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_pinned", true)
      .gte("pinned_at", startTs)
      .lte("pinned_at", endTs);
    result.mindset.pinnedInsights = pins ?? 0;

    const { count: letters } = await sb
      .from("mindset_future_letters")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startTs)
      .lte("created_at", endTs);
    result.mindset.futureLetters = letters ?? 0;

    const { data: gratitudeRows } = await sb
      .from("mindset_gratitude")
      .select("occurred_on")
      .eq("user_id", userId)
      .gte("occurred_on", start)
      .lte("occurred_on", end);
    if (gratitudeRows) {
      const rows = gratitudeRows as { occurred_on: string }[];
      result.mindset.gratitudeEntries = rows.length;
      result.mindset.gratitudeDays = new Set(
        rows.map((r) => r.occurred_on)
      ).size;
    }
  } catch {
    /* ignore */
  }

  // Business
  try {
    const { data: sales } = await sb
      .from("business_sales")
      .select("amount")
      .eq("user_id", userId)
      .gte("occurred_on", start)
      .lte("occurred_on", end);
    if (sales) {
      const rows = sales as { amount: number }[];
      result.business.salesCount = rows.length;
      result.business.salesTotal = rows.reduce(
        (a, r) => a + Number(r.amount),
        0
      );
    }

    const { count: tasks } = await sb
      .from("business_tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_completed", true)
      .gte("completed_at", startTs)
      .lte("completed_at", endTs);
    result.business.tasksCompleted = tasks ?? 0;

    const { count: ms } = await sb
      .from("business_milestones")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "achieved")
      .gte("achieved_at", startTs)
      .lte("achieved_at", endTs);
    result.business.milestonesAchieved = ms ?? 0;
  } catch {
    /* ignore */
  }

  // Journal
  try {
    const { data: entries } = await sb
      .from("journal_entries")
      .select("content")
      .eq("user_id", userId)
      .gte("created_at", startTs)
      .lte("created_at", endTs);
    if (entries) {
      const rows = entries as { content: string | null }[];
      result.journal.entriesCount = rows.length;
      result.journal.wordsTotal = rows.reduce(
        (a, r) => a + countWords(r.content ?? ""),
        0
      );
    }
  } catch {
    /* ignore */
  }

  return result;
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
