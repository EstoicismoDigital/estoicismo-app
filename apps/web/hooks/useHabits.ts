"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "../lib/supabase-client";
import {
  fetchHabits,
  fetchHabitLogs,
  createHabit,
  updateHabit,
  archiveHabit,
  insertHabitLog,
  deleteHabitLog,
  type CreateHabitInput,
} from "@estoicismo/supabase";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import { getCurrentWeekDays, getTodayStr } from "../lib/dateUtils";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useHabits() {
  const week = getCurrentWeekDays();
  const from = week[0].date,
    to = week[6].date;

  const habitsQ = useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchHabits(sb, await getUserId());
    },
  });

  const logsQ = useQuery<HabitLog[]>({
    queryKey: ["habit-logs", from, to],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchHabitLogs(sb, await getUserId(), from, to);
    },
  });

  return {
    habits: habitsQ.data ?? [],
    logs: logsQ.data ?? [],
    isLoading: habitsQ.isLoading || logsQ.isLoading,
    error: habitsQ.error ?? logsQ.error,
  };
}

export function useAllHabitLogs(monthFrom: string, monthTo: string) {
  return useQuery<HabitLog[]>({
    queryKey: ["habit-logs", monthFrom, monthTo],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchHabitLogs(sb, await getUserId(), monthFrom, monthTo);
    },
  });
}

export function useToggleHabit() {
  const qc = useQueryClient();
  const week = getCurrentWeekDays();
  const logsKey = ["habit-logs", week[0].date, week[6].date];

  return useMutation({
    mutationFn: async ({
      habitId,
      isCompleted,
    }: {
      habitId: string;
      isCompleted: boolean;
    }) => {
      const sb = getSupabaseBrowserClient();
      const today = getTodayStr();
      if (isCompleted) {
        await deleteHabitLog(sb, habitId, today);
      } else {
        const uid = await getUserId();
        await insertHabitLog(sb, habitId, uid, today);
      }
    },
    onMutate: async ({ habitId, isCompleted }) => {
      const today = getTodayStr();
      await qc.cancelQueries({ queryKey: logsKey });
      const prev = qc.getQueryData<HabitLog[]>(logsKey);
      qc.setQueryData<HabitLog[]>(logsKey, (old = []) => {
        if (isCompleted)
          return old.filter((l) => !(l.habit_id === habitId && l.completed_at === today));
        return [
          ...old,
          {
            id: `opt-${habitId}-${today}`,
            habit_id: habitId,
            user_id: "",
            completed_at: today,
            note: null,
          },
        ];
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(logsKey, ctx.prev);
      toast.error("No se pudo guardar. Intenta de nuevo.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: logsKey });
    },
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      const sb = getSupabaseBrowserClient();
      return createHabit(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito creado");
    },
    onError: () => toast.error("No se pudo crear el hábito."),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateHabitInput>;
    }) => {
      const sb = getSupabaseBrowserClient();
      return updateHabit(sb, id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito actualizado");
    },
    onError: () => toast.error("No se pudo actualizar el hábito."),
  });
}

export function useArchiveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      return archiveHabit(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito archivado");
    },
    onError: () => toast.error("No se pudo archivar."),
  });
}
