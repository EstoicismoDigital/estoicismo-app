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
  fetchBusinessProfile,
  upsertBusinessProfile,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  fetchIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  fetchSales,
  createSale,
  deleteSale,
  type BusinessProfile,
  type BusinessProduct,
  type BusinessClient,
  type BusinessTask,
  type BusinessIdea,
  type BusinessSale,
  type UpsertBusinessProfileInput,
  type CreateProductInput,
  type CreateClientInput,
  type CreateTaskInput,
  type UpdateTaskInput,
  type CreateIdeaInput,
  type UpdateIdeaInput,
  type CreateSaleInput,
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
// PROFILE
// ─────────────────────────────────────────────────────────────

export function useBusinessProfile(): UseQueryResult<BusinessProfile | null> {
  return useQuery<BusinessProfile | null>({
    queryKey: ["business", "profile"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchBusinessProfile(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpsertBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertBusinessProfileInput) => {
      const sb = getSupabaseBrowserClient();
      return upsertBusinessProfile(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business", "profile"] });
    },
    onError: (err) => {
      toast.error("No se pudo guardar tu perfil de negocio.", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────

export function useProducts(opts: { include_inactive?: boolean } = {}): UseQueryResult<
  BusinessProduct[]
> {
  return useQuery<BusinessProduct[]>({
    queryKey: ["business", "products", opts.include_inactive ?? false],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchProducts(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const sb = getSupabaseBrowserClient();
      return createProduct(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "products"] }),
    onError: (err) => toast.error("No se pudo crear el producto.", {
      description: err instanceof Error ? err.message : undefined,
    }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateProductInput> & { is_active?: boolean } }) => {
      const sb = getSupabaseBrowserClient();
      return updateProduct(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteProduct(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "products"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────

export function useClients(opts: { include_archived?: boolean } = {}): UseQueryResult<
  BusinessClient[]
> {
  return useQuery<BusinessClient[]>({
    queryKey: ["business", "clients", opts.include_archived ?? false],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchClients(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClientInput) => {
      const sb = getSupabaseBrowserClient();
      return createClient(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "clients"] }),
    onError: (err) => toast.error("No se pudo crear el cliente.", {
      description: err instanceof Error ? err.message : undefined,
    }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateClientInput> & { is_archived?: boolean } }) => {
      const sb = getSupabaseBrowserClient();
      return updateClient(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteClient(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "clients"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────

export function useBusinessTasks(opts: { include_completed?: boolean } = {}): UseQueryResult<
  BusinessTask[]
> {
  return useQuery<BusinessTask[]>({
    queryKey: ["business", "tasks", opts.include_completed ?? false],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchTasks(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 30,
  });
}

export function useCreateBusinessTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const sb = getSupabaseBrowserClient();
      return createTask(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "tasks"] }),
  });
}

export function useUpdateBusinessTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTaskInput }) => {
      const sb = getSupabaseBrowserClient();
      return updateTask(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "tasks"] }),
  });
}

export function useDeleteBusinessTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteTask(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "tasks"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// IDEAS
// ─────────────────────────────────────────────────────────────

export function useIdeas(): UseQueryResult<BusinessIdea[]> {
  return useQuery<BusinessIdea[]>({
    queryKey: ["business", "ideas"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchIdeas(sb, await getUserId());
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIdeaInput) => {
      const sb = getSupabaseBrowserClient();
      return createIdea(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "ideas"] }),
  });
}

export function useUpdateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateIdeaInput }) => {
      const sb = getSupabaseBrowserClient();
      return updateIdea(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "ideas"] }),
  });
}

export function useDeleteIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteIdea(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "ideas"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────────────────────

export function useBusinessSales(opts: { from?: string; to?: string; limit?: number } = {}): UseQueryResult<
  BusinessSale[]
> {
  return useQuery<BusinessSale[]>({
    queryKey: ["business", "sales", opts.from ?? null, opts.to ?? null, opts.limit ?? null],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      return fetchSales(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const sb = getSupabaseBrowserClient();
      return createSale(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "sales"] }),
    onError: (err) => toast.error("No se pudo registrar la venta.", {
      description: err instanceof Error ? err.message : undefined,
    }),
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      await deleteSale(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "sales"] }),
  });
}
