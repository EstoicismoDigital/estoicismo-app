"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "../lib/supabase-client";

export type Pilar = "habits" | "finance" | "mindset" | "business";

export type WeeklyReview = {
  user_id: string;
  week_starting: string;
  pilar: Pilar;
  progress: string | null;
  blockers: string | null;
  commitment: string | null;
};

/**
 * Devuelve el lunes (ISO YYYY-MM-DD) de la semana de la fecha dada,
 * o de hoy si no se pasa fecha. Usa zona local del navegador.
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=domingo
  const diff = day === 0 ? -6 : 1 - day; // mover al lunes
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function useWeeklyReview(weekStart: string = getWeekStart()) {
  const qc = useQueryClient();

  const query = useQuery<Record<Pilar, WeeklyReview | null>>({
    queryKey: ["weekly_review", weekStart],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      const empty: Record<Pilar, WeeklyReview | null> = {
        habits: null,
        finance: null,
        mindset: null,
        business: null,
      };
      if (!user) return empty;
      const { data, error } = await sb
        .from("weekly_review")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_starting", weekStart);
      if (error && error.code !== "42P01") throw error;
      const map = { ...empty };
      (data ?? []).forEach((row: WeeklyReview) => {
        map[row.pilar] = row;
      });
      return map;
    },
    staleTime: 1000 * 30,
  });

  const mutation = useMutation({
    mutationFn: async (input: {
      pilar: Pilar;
      progress?: string | null;
      blockers?: string | null;
      commitment?: string | null;
    }) => {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error("not authed");
      const { error } = await sb.from("weekly_review").upsert(
        {
          user_id: user.id,
          week_starting: weekStart,
          pilar: input.pilar,
          progress: input.progress ?? null,
          blockers: input.blockers ?? null,
          commitment: input.commitment ?? null,
        },
        { onConflict: "user_id,week_starting,pilar" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly_review", weekStart] });
    },
  });

  return {
    ...query,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
