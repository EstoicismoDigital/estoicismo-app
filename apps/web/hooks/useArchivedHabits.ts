"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "../lib/supabase-client";
import {
  fetchArchivedHabits,
  unarchiveHabit,
  deleteHabit,
} from "@estoicismo/supabase";
import type { Habit } from "@estoicismo/supabase";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useArchivedHabits() {
  return useQuery<Habit[]>({
    queryKey: ["archived-habits"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchArchivedHabits(sb, await getUserId());
    },
  });
}

export function useUnarchiveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      return unarchiveHabit(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["archived-habits"] });
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito restaurado");
    },
    onError: (err: unknown) => {
      // Surface free-tier cap violations nicely.
      const msg = (err as { message?: string })?.message ?? "";
      if (msg.includes("HABIT_LIMIT_REACHED")) {
        toast.error(
          "Alcanzaste el límite gratuito. Actualiza a Premium para restaurar."
        );
      } else {
        toast.error("No se pudo restaurar el hábito.");
      }
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      return deleteHabit(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["archived-habits"] });
      qc.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito eliminado permanentemente");
    },
    onError: () => toast.error("No se pudo eliminar el hábito."),
  });
}
