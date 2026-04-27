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
