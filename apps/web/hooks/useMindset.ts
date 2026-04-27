"use client";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "../lib/errors";
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// VISION ITEMS · MOOD LOGS · FUTURE LETTERS
// ─────────────────────────────────────────────────────────────

export function useVisionItems(opts: { include_achieved?: boolean } = {}): UseQueryResult<
  import("@estoicismo/supabase").MindsetVisionItem[]
> {
  return useQuery({
    queryKey: ["mindset", "vision", opts.include_achieved ?? true],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchVisionItems } = await import("@estoicismo/supabase");
      return fetchVisionItems(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateVisionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: import("@estoicismo/supabase").CreateVisionItemInput) => {
      const sb = getSupabaseBrowserClient();
      const { createVisionItem } = await import("@estoicismo/supabase");
      return createVisionItem(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mindset", "vision"] }),
    onError: (err) => toast.error("No se pudo agregar el item.", {
      description: extractErrorMessage(err),
    }),
  });
}

export function useUpdateVisionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: import("@estoicismo/supabase").UpdateVisionItemInput }) => {
      const sb = getSupabaseBrowserClient();
      const { updateVisionItem } = await import("@estoicismo/supabase");
      return updateVisionItem(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mindset", "vision"] }),
  });
}

export function useDeleteVisionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteVisionItem } = await import("@estoicismo/supabase");
      await deleteVisionItem(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mindset", "vision"] }),
  });
}

// MOOD

export function useMoodLogs(opts: { limit?: number; from?: string; to?: string } = {}): UseQueryResult<
  import("@estoicismo/supabase").MindsetMoodLog[]
> {
  return useQuery({
    queryKey: ["mindset", "mood-logs", opts.from ?? null, opts.to ?? null, opts.limit ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchMoodLogs } = await import("@estoicismo/supabase");
      return fetchMoodLogs(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useMoodLogForDate(date: string): UseQueryResult<
  import("@estoicismo/supabase").MindsetMoodLog | null
> {
  return useQuery({
    queryKey: ["mindset", "mood-log", date],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchMoodLogForDate } = await import("@estoicismo/supabase");
      return fetchMoodLogForDate(sb, await getUserId(), date);
    },
    staleTime: 1000 * 30,
  });
}

export function useUpsertMoodLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: import("@estoicismo/supabase").UpsertMoodLogInput) => {
      const sb = getSupabaseBrowserClient();
      const { upsertMoodLog } = await import("@estoicismo/supabase");
      return upsertMoodLog(sb, await getUserId(), input);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["mindset", "mood-log", variables.occurred_on] });
      qc.invalidateQueries({ queryKey: ["mindset", "mood-logs"] });
    },
    onError: (err) => toast.error("No se pudo guardar tu estado.", {
      description: extractErrorMessage(err),
    }),
  });
}

// FUTURE LETTERS

export function useFutureLetters(): UseQueryResult<
  import("@estoicismo/supabase").MindsetFutureLetter[]
> {
  return useQuery({
    queryKey: ["mindset", "future-letters"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchFutureLetters } = await import("@estoicismo/supabase");
      return fetchFutureLetters(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateFutureLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: import("@estoicismo/supabase").CreateFutureLetterInput) => {
      const sb = getSupabaseBrowserClient();
      const { createFutureLetter } = await import("@estoicismo/supabase");
      return createFutureLetter(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mindset", "future-letters"] });
      toast.success("Carta sellada", { description: "Te llegará el día indicado." });
    },
    onError: (err) => toast.error("No se pudo guardar la carta.", {
      description: extractErrorMessage(err),
    }),
  });
}

export function useOpenFutureLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { openFutureLetter } = await import("@estoicismo/supabase");
      return openFutureLetter(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mindset", "future-letters"] }),
  });
}

export function useDeleteFutureLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteFutureLetter } = await import("@estoicismo/supabase");
      await deleteFutureLetter(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mindset", "future-letters"] }),
  });
}
