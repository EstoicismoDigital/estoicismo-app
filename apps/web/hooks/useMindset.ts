"use client";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "../lib/supabase-client";
import {
  fetchMPD,
  upsertMPD,
  deleteMPD,
  fetchMPDLogs,
  fetchMPDLogForDate,
  upsertMPDLog,
  fetchMeditations,
  createMeditation,
  deleteMeditation,
  fetchFrequencyFavorites,
  toggleFrequencyFavorite,
  type MindsetMPD,
  type MindsetMPDLog,
  type MindsetMeditation,
  type MindsetFrequencyFavorite,
  type UpsertMPDInput,
  type UpsertMPDLogInput,
  type CreateMeditationInput,
} from "@estoicismo/supabase";

/**
 * Hooks del módulo Mentalidad (Napoleón Hill + Joe Dispenza + Aura).
 *
 * Convenciones:
 *  - Query keys prefijados con `["mindset", ...]` para invalidación selectiva.
 *  - `staleTime` generoso — datos cambian solo por escritura del usuario.
 *  - Errores en toast + re-throw para que el consumidor pueda reaccionar.
 */

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─────────────────────────────────────────────────────────────
// MPD — Propósito Mayor Definido
// ─────────────────────────────────────────────────────────────

export function useMPD(): UseQueryResult<MindsetMPD | null> {
  return useQuery<MindsetMPD | null>({
    queryKey: ["mindset", "mpd"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchMPD(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpsertMPD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertMPDInput) => {
      const sb = getSupabaseBrowserClient();
      return upsertMPD(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mindset", "mpd"] });
    },
    onError: (err) => {
      toast.error("No se pudo guardar tu MPD.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useDeleteMPD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const sb = getSupabaseBrowserClient();
      await deleteMPD(sb, await getUserId());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mindset", "mpd"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// MPD LOGS
// ─────────────────────────────────────────────────────────────

export function useMPDLogForDate(date: string): UseQueryResult<MindsetMPDLog | null> {
  return useQuery<MindsetMPDLog | null>({
    queryKey: ["mindset", "mpd-log", date],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchMPDLogForDate(sb, await getUserId(), date);
    },
    staleTime: 1000 * 30,
  });
}

export function useMPDLogs(limit = 30): UseQueryResult<MindsetMPDLog[]> {
  return useQuery<MindsetMPDLog[]>({
    queryKey: ["mindset", "mpd-logs", limit],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchMPDLogs(sb, await getUserId(), { limit });
    },
    staleTime: 1000 * 60,
  });
}

export function useUpsertMPDLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertMPDLogInput) => {
      const sb = getSupabaseBrowserClient();
      return upsertMPDLog(sb, await getUserId(), input);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["mindset", "mpd-log", variables.date] });
      qc.invalidateQueries({ queryKey: ["mindset", "mpd-logs"] });
    },
    onError: (err) => {
      toast.error("No se pudo guardar tu registro de hoy.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// MEDITATIONS
// ─────────────────────────────────────────────────────────────

export function useMeditations(limit = 30): UseQueryResult<MindsetMeditation[]> {
  return useQuery<MindsetMeditation[]>({
    queryKey: ["mindset", "meditations", limit],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchMeditations(sb, await getUserId(), { limit });
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateMeditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMeditationInput) => {
      const sb = getSupabaseBrowserClient();
      return createMeditation(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mindset", "meditations"] });
    },
    onError: (err) => {
      toast.error("No se pudo registrar la sesión.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useDeleteMeditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteMeditation(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mindset", "meditations"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// FREQUENCY FAVORITES
// ─────────────────────────────────────────────────────────────

export function useFrequencyFavorites(): UseQueryResult<MindsetFrequencyFavorite[]> {
  return useQuery<MindsetFrequencyFavorite[]>({
    queryKey: ["mindset", "frequency-favorites"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchFrequencyFavorites(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useToggleFrequencyFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      frequencyKey,
      isCurrentlyFavorite,
    }: {
      frequencyKey: string;
      isCurrentlyFavorite: boolean;
    }) => {
      const sb = getSupabaseBrowserClient();
      await toggleFrequencyFavorite(
        sb,
        await getUserId(),
        frequencyKey,
        isCurrentlyFavorite
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mindset", "frequency-favorites"] });
    },
    onError: (err) => {
      toast.error("No se pudo actualizar favorito.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}
