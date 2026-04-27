"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "../lib/supabase-client";
import { getTodayStr } from "../lib/dateUtils";
import {
  computeRitualStatus,
  type RitualStatus,
} from "../lib/hoy/ritual";

/**
 * Trae todo lo necesario para calcular el ritual de hoy en una sola
 * query agregada. Devuelve el RitualStatus listo para renderizar.
 *
 * Decisión: una sola query con muchos counts en paralelo es más rápido
 * que 10 useQuery distintos (sólo 1 round trip de auth).
 */
export function useTodayRitual() {
  return useQuery<RitualStatus>({
    queryKey: ["hoy", "ritual", getTodayStr()],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const today = getTodayStr();
      const startTs = `${today}T00:00:00`;
      const endTs = `${today}T23:59:59`;

      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const uid = user.id;

      // Lanzar todo en paralelo
      const [
        mpdRow,
        mpdLogRow,
        moodRow,
        gratitudeRows,
        habitsHead,
        habitLogsToday,
        txToday,
        salesToday,
        businessProfileRow,
        businessTasksClosedToday,
        fitnessProfileRow,
        workoutsToday,
        setsToday,
        currentBookRow,
        readingSessionsToday,
        journalToday,
      ] = await Promise.all([
        sb.from("mindset_mpd").select("user_id").eq("user_id", uid).maybeSingle(),
        sb
          .from("mindset_mpd_logs")
          .select("read_affirmation")
          .eq("user_id", uid)
          .eq("date", today)
          .maybeSingle(),
        sb
          .from("mindset_mood_logs")
          .select("id")
          .eq("user_id", uid)
          .eq("occurred_on", today)
          .maybeSingle(),
        sb
          .from("mindset_gratitude")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("occurred_on", today),
        sb
          .from("habits")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("is_archived", false),
        sb
          .from("habit_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("completed_at", today),
        sb
          .from("finance_transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("occurred_on", today),
        sb
          .from("business_sales")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("occurred_on", today),
        sb
          .from("business_profile")
          .select("status")
          .eq("user_id", uid)
          .maybeSingle(),
        sb
          .from("business_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("is_completed", true)
          .gte("completed_at", startTs)
          .lte("completed_at", endTs),
        sb
          .from("fitness_user_profile")
          .select("user_id")
          .eq("user_id", uid)
          .maybeSingle(),
        sb
          .from("fitness_workouts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("performed_on", today),
        sb
          .from("fitness_workout_sets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("occurred_on", today),
        sb
          .from("reading_books")
          .select("id")
          .eq("user_id", uid)
          .eq("is_current", true)
          .eq("is_finished", false)
          .limit(1)
          .maybeSingle(),
        sb
          .from("reading_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("occurred_on", today),
        sb
          .from("journal_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .gte("created_at", startTs)
          .lte("created_at", endTs),
      ]);

      const mpdLogData = mpdLogRow.data as { read_affirmation?: boolean } | null;
      const businessProfile = businessProfileRow.data as { status?: string } | null;
      return computeRitualStatus({
        hasMpd: !!mpdRow.data,
        affirmationRead: mpdLogData?.read_affirmation === true,
        moodLoggedToday: !!moodRow.data,
        gratitudeCountToday: gratitudeRows.count ?? 0,
        hasHabits: (habitsHead.count ?? 0) > 0,
        habitLogsToday: habitLogsToday.count ?? 0,
        txCountToday: txToday.count ?? 0,
        saleCountToday: salesToday.count ?? 0,
        hasBusiness:
          businessProfile?.status === "active" ||
          businessProfile?.status === "starting",
        businessTasksClosedToday: businessTasksClosedToday.count ?? 0,
        hasFitness: !!fitnessProfileRow.data,
        workoutsToday: workoutsToday.count ?? 0,
        setsToday: setsToday.count ?? 0,
        hasCurrentBook: !!currentBookRow.data,
        readingSessionsToday: readingSessionsToday.count ?? 0,
        journalEntriesToday: journalToday.count ?? 0,
      });
    },
    staleTime: 1000 * 60, // 1 min
  });
}

/**
 * Calcula la racha del ritual mirando los últimos 60 días.
 * Una vuelta de DB pesada, así que se usa con staleTime alto.
 */
export function useRitualStreak() {
  return useQuery<number>({
    queryKey: ["hoy", "ritual-streak"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return 0;
      const uid = user.id;

      // Construye un set de "días con al menos N actividades distintas"
      // Activity tables: mood, gratitude, habit_logs, tx, sales, workouts,
      // sets, reading_sessions, journal.
      // Para racha: cualquier día con >= 4 categorías distintas con
      // actividad cuenta.
      const today = getTodayStr();
      const sixty = new Date();
      sixty.setDate(sixty.getDate() - 60);
      const from = sixty.toISOString().slice(0, 10);

      const [moods, grat, habits, txs, sales, workouts, sets, reads, journ] =
        await Promise.all([
          sb
            .from("mindset_mood_logs")
            .select("occurred_on")
            .eq("user_id", uid)
            .gte("occurred_on", from),
          sb
            .from("mindset_gratitude")
            .select("occurred_on")
            .eq("user_id", uid)
            .gte("occurred_on", from),
          sb
            .from("habit_logs")
            .select("completed_at")
            .eq("user_id", uid)
            .gte("completed_at", from),
          sb
            .from("finance_transactions")
            .select("occurred_on")
            .eq("user_id", uid)
            .gte("occurred_on", from),
          sb
            .from("business_sales")
            .select("occurred_on")
            .eq("user_id", uid)
            .gte("occurred_on", from),
          sb
            .from("fitness_workouts")
            .select("performed_on")
            .eq("user_id", uid)
            .gte("performed_on", from),
          sb
            .from("fitness_workout_sets")
            .select("occurred_on")
            .eq("user_id", uid)
            .gte("occurred_on", from),
          sb
            .from("reading_sessions")
            .select("occurred_on")
            .eq("user_id", uid)
            .gte("occurred_on", from),
          sb
            .from("journal_entries")
            .select("created_at")
            .eq("user_id", uid)
            .gte("created_at", `${from}T00:00:00Z`),
        ]);

      // Para cada día, set de categorías
      const cats = new Map<string, Set<string>>();
      const add = (date: string, cat: string) => {
        if (!cats.has(date)) cats.set(date, new Set());
        cats.get(date)!.add(cat);
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arr = <T,>(d: any): T[] => (d ?? []) as T[];
      arr<{ occurred_on: string }>(moods.data).forEach((r) => add(r.occurred_on, "mood"));
      arr<{ occurred_on: string }>(grat.data).forEach((r) => add(r.occurred_on, "grat"));
      arr<{ completed_at: string }>(habits.data).forEach((r) => add(r.completed_at, "habits"));
      arr<{ occurred_on: string }>(txs.data).forEach((r) => add(r.occurred_on, "tx"));
      arr<{ occurred_on: string }>(sales.data).forEach((r) => add(r.occurred_on, "sale"));
      arr<{ performed_on: string }>(workouts.data).forEach((r) => add(r.performed_on, "workout"));
      arr<{ occurred_on: string }>(sets.data).forEach((r) => add(r.occurred_on, "set"));
      arr<{ occurred_on: string }>(reads.data).forEach((r) => add(r.occurred_on, "read"));
      arr<{ created_at: string }>(journ.data).forEach((r) =>
        add(r.created_at.slice(0, 10), "journal")
      );

      // Días con >= 4 categorías
      const ritualDates = new Set(
        Array.from(cats.entries())
          .filter(([, set]) => set.size >= 4)
          .map(([d]) => d)
      );

      // Streak hacia atrás desde hoy
      let streak = 0;
      const cur = new Date(today + "T00:00:00");
      // Si hoy no cuenta, empezamos desde ayer (no perder racha por
      // estar revisando temprano)
      if (!ritualDates.has(today)) {
        cur.setDate(cur.getDate() - 1);
      }
      while (true) {
        const iso = cur.toISOString().slice(0, 10);
        if (ritualDates.has(iso)) {
          streak += 1;
          cur.setDate(cur.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    },
    staleTime: 1000 * 60 * 10, // 10 min
  });
}
