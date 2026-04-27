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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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
        description: extractErrorMessage(err),
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

// ─────────────────────────────────────────────────────────────
// ACCOUNTS
// ─────────────────────────────────────────────────────────────

export function useAccounts(opts: { include_archived?: boolean } = {}): UseQueryResult<
  import("@estoicismo/supabase").FinanceAccount[]
> {
  return useQuery({
    queryKey: ["finance", "accounts", opts.include_archived ?? false],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchAccounts } = await import("@estoicismo/supabase");
      return fetchAccounts(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: import("@estoicismo/supabase").CreateAccountInput) => {
      const sb = getSupabaseBrowserClient();
      const { createAccount } = await import("@estoicismo/supabase");
      return createAccount(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "accounts"] }),
    onError: (err) =>
      toast.error("No se pudo crear la cuenta.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: import("@estoicismo/supabase").UpdateAccountInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      const { updateAccount } = await import("@estoicismo/supabase");
      return updateAccount(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "accounts"] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteAccount } = await import("@estoicismo/supabase");
      await deleteAccount(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "accounts"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// RECURRING
// ─────────────────────────────────────────────────────────────

export function useRecurring(opts: { only_active?: boolean } = {}): UseQueryResult<
  import("@estoicismo/supabase").FinanceRecurring[]
> {
  return useQuery({
    queryKey: ["finance", "recurring", opts.only_active ?? true],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchRecurring } = await import("@estoicismo/supabase");
      return fetchRecurring(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: import("@estoicismo/supabase").CreateRecurringInput) => {
      const sb = getSupabaseBrowserClient();
      const { createRecurring } = await import("@estoicismo/supabase");
      return createRecurring(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "recurring"] }),
    onError: (err) =>
      toast.error("No se pudo crear la recurrencia.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: import("@estoicismo/supabase").UpdateRecurringInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      const { updateRecurring } = await import("@estoicismo/supabase");
      return updateRecurring(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "recurring"] }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteRecurring } = await import("@estoicismo/supabase");
      await deleteRecurring(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "recurring"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────

export function useSubscriptions(opts: {
  status?: import("@estoicismo/supabase").SubscriptionStatus[];
} = {}): UseQueryResult<import("@estoicismo/supabase").FinanceSubscription[]> {
  return useQuery({
    queryKey: ["finance", "subscriptions", opts.status?.join(",") ?? "all"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchSubscriptions } = await import("@estoicismo/supabase");
      return fetchSubscriptions(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: import("@estoicismo/supabase").CreateSubscriptionInput) => {
      const sb = getSupabaseBrowserClient();
      const { createSubscription } = await import("@estoicismo/supabase");
      return createSubscription(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "subscriptions"] }),
    onError: (err) =>
      toast.error("No se pudo guardar la suscripción.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: import("@estoicismo/supabase").UpdateSubscriptionInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      const { updateSubscription } = await import("@estoicismo/supabase");
      return updateSubscription(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "subscriptions"] }),
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteSubscription } = await import("@estoicismo/supabase");
      await deleteSubscription(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", "subscriptions"] }),
  });
}
