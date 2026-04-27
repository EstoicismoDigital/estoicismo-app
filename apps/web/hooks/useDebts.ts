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
  fetchDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  fetchDebtPayments,
  createDebtPayment,
  deleteDebtPayment,
  type FinanceDebt,
  type FinanceDebtPayment,
  type CreateDebtInput,
  type UpdateDebtInput,
  type CreateDebtPaymentInput,
} from "@estoicismo/supabase";

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function useDebts(opts: { include_paid?: boolean } = {}): UseQueryResult<FinanceDebt[]> {
  return useQuery<FinanceDebt[]>({
    queryKey: ["debts", opts.include_paid ?? false],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchDebts(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
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
      qc.invalidateQueries({ queryKey: ["debts"] });
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
    mutationFn: async ({ id, input }: { id: string; input: UpdateDebtInput }) => {
      const sb = getSupabaseBrowserClient();
      return updateDebt(sb, id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
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
      qc.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────

export function useDebtPayments(opts: { debt_id?: string; limit?: number } = {}): UseQueryResult<
  FinanceDebtPayment[]
> {
  return useQuery<FinanceDebtPayment[]>({
    queryKey: ["debts", "payments", opts.debt_id ?? null, opts.limit ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchDebtPayments(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateDebtPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDebtPaymentInput) => {
      const sb = getSupabaseBrowserClient();
      return createDebtPayment(sb, await getUserId(), input);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      if (data.debt.is_paid) {
        toast.success("¡Deuda liquidada!", {
          description: `${data.debt.name} está totalmente pagada.`,
        });
      }
    },
    onError: (err) => {
      toast.error("No se pudo registrar el pago.", {
        description: extractErrorMessage(err),
      });
    },
  });
}

export function useDeleteDebtPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteDebtPayment(sb, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts", "payments"] });
    },
  });
}
