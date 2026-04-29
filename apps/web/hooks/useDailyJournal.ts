"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "../lib/supabase-client";

export type StoicState =
  | "eudaimonia"
  | "sophrosyne"
  | "agon"
  | "thymos"
  | "ekpyrosis";

export type DailyTask = {
  text: string;
  time_from: string;
  time_to: string;
  done: boolean;
};

export type DailyJournal = {
  user_id: string;
  occurred_on: string;
  // SOL
  day_started_at: string | null;
  morning_intent: string | null;
  morning_gratitude: string | null;
  morning_attitude: string | null;
  morning_small_action: string | null;
  tasks: DailyTask[];
  // LUNA
  day_ended_at: string | null;
  evening_reflection: string | null;
  vital_eter: boolean;
  vital_forja: boolean;
  vital_nectar: boolean;
  vital_kleos: boolean;
  state: StoicState | null;
  income_today: number | null;
  expense_today: number | null;
  tomorrow_objectives: string | null;
};

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Daily journal "Sol/Luna" — replica la página diaria de la agenda física.
 * Carga la fila para el día indicado y expone un `save(patch)` que upsert.
 *
 * Si la tabla no existe (porque la migración no se aplicó todavía),
 * el query devuelve null silenciosamente y el save lanza error
 * mostrando un mensaje al user. Esto permite deploy progresivo.
 */
export function useDailyJournal(date: string = todayISO()) {
  const qc = useQueryClient();

  const query = useQuery<DailyJournal | null>({
    queryKey: ["daily_journal", date],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return null;
      const { data, error } = await sb
        .from("daily_journal")
        .select("*")
        .eq("user_id", user.id)
        .eq("occurred_on", date)
        .maybeSingle();
      // 42P01 = relation does not exist (tabla no creada todavía)
      if (error && error.code !== "42P01") throw error;
      return (data ?? null) as DailyJournal | null;
    },
    staleTime: 1000 * 30,
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<Omit<DailyJournal, "user_id" | "occurred_on">>) => {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error("not authed");
      const { error } = await sb
        .from("daily_journal")
        .upsert(
          { user_id: user.id, occurred_on: date, ...patch },
          { onConflict: "user_id,occurred_on" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily_journal", date] });
    },
  });

  return {
    ...query,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
}
