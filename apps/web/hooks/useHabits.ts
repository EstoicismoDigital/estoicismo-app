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
  upsertHabitLogNote,
  reorderHabits,
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

/**
 * Toggle a habit's completion for a given date (defaults to today when
 * `date` is omitted). Used by:
 *   - HabitRow's row-tap + WeekStrip's today button (date = today)
 *   - WeekStrip's past-day buttons (date = that past day — retroactive
 *     completion for days in the current week the user forgot to log)
 *
 * We do NOT accept arbitrary dates from the future. Callers are
 * responsible for disabling the UI for future dates; this hook trusts
 * whatever it's given to keep the API minimal.
 */
export function useToggleHabit() {
  const qc = useQueryClient();
  const week = getCurrentWeekDays();
  const logsKey = ["habit-logs", week[0].date, week[6].date];

  return useMutation({
    mutationFn: async ({
      habitId,
      isCompleted,
      date,
    }: {
      habitId: string;
      isCompleted: boolean;
      date?: string;
    }) => {
      const sb = getSupabaseBrowserClient();
      const target = date ?? getTodayStr();
      if (isCompleted) {
        await deleteHabitLog(sb, habitId, target);
      } else {
        const uid = await getUserId();
        await insertHabitLog(sb, habitId, uid, target);
      }
    },
    onMutate: async ({ habitId, isCompleted, date }) => {
      const target = date ?? getTodayStr();
      await qc.cancelQueries({ queryKey: logsKey });
      const prev = qc.getQueryData<HabitLog[]>(logsKey);
      qc.setQueryData<HabitLog[]>(logsKey, (old = []) => {
        if (isCompleted)
          return old.filter((l) => !(l.habit_id === habitId && l.completed_at === target));
        return [
          ...old,
          {
            id: `opt-${habitId}-${target}`,
            habit_id: habitId,
            user_id: "",
            completed_at: target,
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

export function useUpsertHabitLogNote() {
  const qc = useQueryClient();
  const week = getCurrentWeekDays();
  const logsKey = ["habit-logs", week[0].date, week[6].date];

  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      note,
    }: {
      habitId: string;
      date: string;
      note: string | null;
    }) => {
      const sb = getSupabaseBrowserClient();
      await upsertHabitLogNote(sb, habitId, date, note);
    },
    onMutate: async ({ habitId, date, note }) => {
      await qc.cancelQueries({ queryKey: logsKey });
      const prev = qc.getQueryData<HabitLog[]>(logsKey);
      const normalized = note && note.trim().length > 0 ? note.trim() : null;
      qc.setQueryData<HabitLog[]>(logsKey, (old = []) =>
        old.map((l) =>
          l.habit_id === habitId && l.completed_at === date
            ? { ...l, note: normalized }
            : l
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(logsKey, ctx.prev);
      toast.error("No se pudo guardar la nota.");
    },
    onSuccess: (_data, vars) => {
      toast.success(
        vars.note && vars.note.trim().length > 0
          ? "Nota guardada"
          : "Nota eliminada"
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: logsKey });
    },
  });
}

/**
 * Reorder the active habit list. Accepts the new id sequence and:
 *   1. Optimistically reorders the ["habits"] cache so the UI snaps
 *      into place before the network roundtrip completes.
 *   2. Writes position 0..N-1 to Supabase via reorderHabits().
 *   3. On error, rolls back the cache and toasts.
 * We deliberately DON'T invalidate on settle — the optimistic update IS
 * the truth once the server accepts it, and invalidating would cause a
 * brief flicker as the list re-sorts from the response.
 */
export function useReorderHabits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const sb = getSupabaseBrowserClient();
      await reorderHabits(sb, orderedIds);
    },
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: ["habits"] });
      const prev = qc.getQueryData<Habit[]>(["habits"]);
      if (prev) {
        const byId = new Map(prev.map((h) => [h.id, h]));
        // Rebuild the array in the new order; keep any habits not in the
        // list (shouldn't happen, but defensive) at the tail.
        const reordered: Habit[] = [];
        for (const id of orderedIds) {
          const h = byId.get(id);
          if (h) {
            reordered.push({ ...h, position: reordered.length });
            byId.delete(id);
          }
        }
        for (const h of byId.values()) reordered.push(h);
        qc.setQueryData<Habit[]>(["habits"], reordered);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["habits"], ctx.prev);
      toast.error("No se pudo reordenar. Intenta de nuevo.");
    },
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
