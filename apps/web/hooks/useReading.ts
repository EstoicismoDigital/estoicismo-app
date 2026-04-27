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
  fetchBooks,
  fetchCurrentBook,
  createBook,
  updateBook,
  deleteBook,
  fetchSessions,
  createSession,
  deleteSession,
  type ReadingBook,
  type ReadingSession,
  type CreateBookInput,
  type UpdateBookInput,
  type CreateSessionInput,
} from "@estoicismo/supabase";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─────────────────────────────────────────────────────────────
// BOOKS
// ─────────────────────────────────────────────────────────────

export function useBooks(opts: { is_finished?: boolean } = {}): UseQueryResult<ReadingBook[]> {
  return useQuery<ReadingBook[]>({
    queryKey: ["reading", "books", opts.is_finished ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchBooks(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCurrentBook(): UseQueryResult<ReadingBook | null> {
  return useQuery<ReadingBook | null>({
    queryKey: ["reading", "current-book"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchCurrentBook(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookInput) => {
      const sb = getSupabaseBrowserClient();
      return createBook(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading"] });
    },
    onError: (err) => {
      toast.error("No se pudo crear el libro.", {
        description: extractErrorMessage(err),
      });
    },
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateBookInput }) => {
      const sb = getSupabaseBrowserClient();
      return updateBook(sb, id, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading"] });
    },
    onError: (err) => {
      toast.error("No se pudo actualizar el libro.", {
        description: extractErrorMessage(err),
      });
    },
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteBook(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────

export function useReadingSessions(opts: { book_id?: string; limit?: number } = {}): UseQueryResult<
  ReadingSession[]
> {
  return useQuery<ReadingSession[]>({
    queryKey: ["reading", "sessions", opts.book_id ?? null, opts.limit ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchSessions(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateReadingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const sb = getSupabaseBrowserClient();
      return createSession(sb, await getUserId(), input);
    },
    onSuccess: () => {
      // Invalidamos sesiones, books (current_page actualizado) y currentBook.
      qc.invalidateQueries({ queryKey: ["reading"] });
    },
    onError: (err) => {
      toast.error("No se pudo registrar la sesión.", {
        description: extractErrorMessage(err),
      });
    },
  });
}

export function useDeleteReadingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteSession(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading", "sessions"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// READING GOAL — meta anual
// ─────────────────────────────────────────────────────────────

export function useReadingGoal(year: number): UseQueryResult<
  import("@estoicismo/supabase").ReadingGoal | null
> {
  return useQuery({
    queryKey: ["reading", "goal", year],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchReadingGoal } = await import("@estoicismo/supabase");
      return fetchReadingGoal(sb, await getUserId(), year);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpsertReadingGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: import("@estoicismo/supabase").UpsertReadingGoalInput
    ) => {
      const sb = getSupabaseBrowserClient();
      const { upsertReadingGoal } = await import("@estoicismo/supabase");
      return upsertReadingGoal(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading", "goal"] });
      toast.success("Meta guardada");
    },
    onError: (err) =>
      toast.error("No se pudo guardar la meta.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useDeleteReadingGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (year: number) => {
      const sb = getSupabaseBrowserClient();
      const { deleteReadingGoal } = await import("@estoicismo/supabase");
      await deleteReadingGoal(sb, await getUserId(), year);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading", "goal"] }),
  });
}

/**
 * Cantidad de libros que el user terminó en `year` (basado en
 * reading_books.is_finished y reading_books.finished_at).
 */
export function useBooksFinishedInYear(year: number): UseQueryResult<number> {
  return useQuery({
    queryKey: ["reading", "books", "finished-in-year", year],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const userId = await getUserId();
      const { count, error } = await sb
        .from("reading_books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_finished", true)
        .gte("finished_at", `${year}-01-01`)
        .lte("finished_at", `${year}-12-31`);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ─────────────────────────────────────────────────────────────
// READING CHALLENGES — metas categorizadas anuales (#70)
// ─────────────────────────────────────────────────────────────

export function useReadingChallenges(year: number): UseQueryResult<
  import("@estoicismo/supabase").ReadingChallenge[]
> {
  return useQuery({
    queryKey: ["reading", "challenges", year],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchReadingChallenges } = await import("@estoicismo/supabase");
      return fetchReadingChallenges(sb, await getUserId(), year);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateReadingChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: import("@estoicismo/supabase").CreateReadingChallengeInput
    ) => {
      const sb = getSupabaseBrowserClient();
      const { createReadingChallenge } = await import("@estoicismo/supabase");
      return createReadingChallenge(sb, await getUserId(), input);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["reading", "challenges"] }),
    onError: (err) =>
      toast.error("No se pudo crear el desafío.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useUpdateReadingChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: import("@estoicismo/supabase").UpdateReadingChallengeInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      const { updateReadingChallenge } = await import("@estoicismo/supabase");
      return updateReadingChallenge(sb, id, input);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["reading", "challenges"] }),
  });
}

export function useDeleteReadingChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteReadingChallenge } = await import("@estoicismo/supabase");
      await deleteReadingChallenge(sb, id);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["reading", "challenges"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// READING HIGHLIGHTS — citas y notas por libro (#68)
// ─────────────────────────────────────────────────────────────

export function useHighlightsByBook(bookId: string | null): UseQueryResult<
  import("@estoicismo/supabase").ReadingHighlight[]
> {
  return useQuery({
    queryKey: ["reading", "highlights", "book", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const sb = getSupabaseBrowserClient();
      const { fetchHighlightsByBook } = await import("@estoicismo/supabase");
      return fetchHighlightsByBook(sb, bookId);
    },
    enabled: !!bookId,
    staleTime: 1000 * 60,
  });
}

export function useFavoriteHighlights(): UseQueryResult<
  import("@estoicismo/supabase").ReadingHighlight[]
> {
  return useQuery({
    queryKey: ["reading", "highlights", "favorites"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchFavoriteHighlights } = await import("@estoicismo/supabase");
      return fetchFavoriteHighlights(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: import("@estoicismo/supabase").CreateHighlightInput
    ) => {
      const sb = getSupabaseBrowserClient();
      const { createHighlight } = await import("@estoicismo/supabase");
      return createHighlight(sb, await getUserId(), input);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["reading", "highlights"] }),
    onError: (err) =>
      toast.error("No se pudo guardar la cita.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useUpdateHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: import("@estoicismo/supabase").UpdateHighlightInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      const { updateHighlight } = await import("@estoicismo/supabase");
      return updateHighlight(sb, id, input);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["reading", "highlights"] }),
  });
}

export function useDeleteHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteHighlight } = await import("@estoicismo/supabase");
      await deleteHighlight(sb, id);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["reading", "highlights"] }),
  });
}
