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
  fetchFinanceCategories,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchCreditCards,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  fetchDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  fetchFinanceQuotes,
  createFinanceCategory,
  deleteFinanceCategory,
  type FinanceCategory,
  type FinanceTransaction,
  type FinanceCreditCard,
  type FinanceDebt,
  type FinanceQuote,
  type FinanceQuoteTag,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type CreateCreditCardInput,
  type UpdateCreditCardInput,
  type CreateDebtInput,
  type UpdateDebtInput,
  type CreateCategoryInput,
} from "@estoicismo/supabase";

/**
 * Hooks para el módulo Finanzas.
 *
 * Convenciones:
 *  - Todas las queries usan un `staleTime` cómodo (1 min) — los datos
 *    cambian por escritura del propio usuario, así que la mayoría de
 *    invalidaciones suceden por mutación, no por refetch espontáneo.
 *  - Las mutaciones invalidan los query keys afectados. Usamos prefijos
 *    (`["finance", "tx"]`) para invalidación granular.
 *  - Los errores caen en toast rojo y re-throw para que los consumidores
 *    puedan reaccionar si lo necesitan.
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
// CATEGORIES
// ─────────────────────────────────────────────────────────────

export function useFinanceCategories(): UseQueryResult<FinanceCategory[]> {
  return useQuery<FinanceCategory[]>({
    queryKey: ["finance", "categories"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      // La RLS de finance_categories ya filtra por user_id IS NULL OR
      // auth.uid() = user_id, así que fetchFinanceCategories no necesita
      // el userId explícito.
      return fetchFinanceCategories(sb);
    },
    staleTime: 1000 * 60 * 10, // 10 min — las categorías casi no cambian
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const sb = getSupabaseBrowserClient();
      return createFinanceCategory(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "categories"] });
    },
    onError: (err) => {
      toast.error("No se pudo crear la categoría.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteFinanceCategory(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "categories"] });
    },
    onError: (err) => {
      toast.error("No se pudo borrar la categoría.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────────────────────

/** Movimientos para un rango arbitrario (ISO YYYY-MM-DD). */
export function useTransactions(range: { from: string; to: string }) {
  return useQuery<FinanceTransaction[]>({
    queryKey: ["finance", "tx", range.from, range.to],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchTransactions(sb, await getUserId(), {
        from: range.from,
        to: range.to,
      });
    },
    staleTime: 1000 * 60,
  });
}

/** Últimos N movimientos — útil para la home del módulo. */
export function useRecentTransactions(limit = 20) {
  return useQuery<FinanceTransaction[]>({
    queryKey: ["finance", "tx", "recent", limit],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchTransactions(sb, await getUserId(), { limit });
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const sb = getSupabaseBrowserClient();
      return createTransaction(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "tx"] });
    },
    onError: (err) => {
      toast.error("No se pudo guardar el movimiento.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateTransactionInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      return updateTransaction(sb, id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "tx"] });
    },
    onError: (err) => {
      toast.error("No se pudo actualizar el movimiento.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteTransaction(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "tx"] });
    },
    onError: (err) => {
      toast.error("No se pudo borrar el movimiento.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// CREDIT CARDS
// ─────────────────────────────────────────────────────────────

export function useCreditCards(): UseQueryResult<FinanceCreditCard[]> {
  return useQuery<FinanceCreditCard[]>({
    queryKey: ["finance", "cards"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchCreditCards(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCreditCardInput) => {
      const sb = getSupabaseBrowserClient();
      return createCreditCard(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "cards"] });
    },
    onError: (err) => {
      toast.error("No se pudo crear la tarjeta.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateCreditCardInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      return updateCreditCard(sb, id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "cards"] });
    },
    onError: (err) => {
      toast.error("No se pudo actualizar la tarjeta.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteCreditCard(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "cards"] });
    },
    onError: (err) => {
      toast.error("No se pudo archivar la tarjeta.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// DEBTS
// ─────────────────────────────────────────────────────────────

export function useDebts(): UseQueryResult<FinanceDebt[]> {
  return useQuery<FinanceDebt[]>({
    queryKey: ["finance", "debts"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchDebts(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDebtInput) => {
      const sb = getSupabaseBrowserClient();
      return createDebt(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "debts"] });
    },
    onError: (err) => {
      toast.error("No se pudo crear la deuda.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateDebtInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      return updateDebt(sb, id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "debts"] });
    },
    onError: (err) => {
      toast.error("No se pudo actualizar la deuda.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteDebt(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance", "debts"] });
    },
    onError: (err) => {
      toast.error("No se pudo borrar la deuda.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// QUOTES
// ─────────────────────────────────────────────────────────────

export function useFinanceQuotes(
  tag?: FinanceQuoteTag
): UseQueryResult<FinanceQuote[]> {
  return useQuery<FinanceQuote[]>({
    queryKey: ["finance", "quotes", tag ?? "all"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchFinanceQuotes(sb, tag);
    },
    staleTime: 1000 * 60 * 60, // 1h — son datos casi estáticos
  });
}
