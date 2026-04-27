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
        description: extractErrorMessage(err),
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
      description: extractErrorMessage(err),
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
      description: extractErrorMessage(err),
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
      description: extractErrorMessage(err),
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

// ─────────────────────────────────────────────────────────────
// MILESTONES
// ─────────────────────────────────────────────────────────────

export function useMilestones(opts: {
  status?: import("@estoicismo/supabase").BusinessMilestoneStatus;
} = {}): UseQueryResult<import("@estoicismo/supabase").BusinessMilestone[]> {
  return useQuery({
    queryKey: ["business", "milestones", opts.status ?? "all"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchMilestones } = await import("@estoicismo/supabase");
      return fetchMilestones(sb, await getUserId(), opts);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: import("@estoicismo/supabase").CreateMilestoneInput
    ) => {
      const sb = getSupabaseBrowserClient();
      const { createMilestone } = await import("@estoicismo/supabase");
      return createMilestone(sb, await getUserId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business", "milestones"] });
      toast.success("Hito creado");
    },
    onError: (err) =>
      toast.error("No se pudo crear el hito.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: import("@estoicismo/supabase").UpdateMilestoneInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      const { updateMilestone } = await import("@estoicismo/supabase");
      return updateMilestone(sb, id, input);
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["business", "milestones"] });
      if (variables.input.status === "achieved") {
        toast.success("¡Hito alcanzado! 🏆", { description: data.title });
      }
    },
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteMilestone } = await import("@estoicismo/supabase");
      await deleteMilestone(sb, id);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["business", "milestones"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// OKRs trimestrales
// ─────────────────────────────────────────────────────────────

export function useOkrs(quarter?: string): UseQueryResult<
  import("@estoicismo/supabase").BusinessOkr[]
> {
  return useQuery({
    queryKey: ["business", "okrs", quarter ?? "all"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchOkrs } = await import("@estoicismo/supabase");
      return fetchOkrs(sb, await getUserId(), quarter);
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateOkr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: import("@estoicismo/supabase").CreateOkrInput
    ) => {
      const sb = getSupabaseBrowserClient();
      const { createOkr } = await import("@estoicismo/supabase");
      return createOkr(sb, await getUserId(), input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "okrs"] }),
    onError: (err) =>
      toast.error("No se pudo crear el OKR.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useUpdateOkr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: import("@estoicismo/supabase").UpdateOkrInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      const { updateOkr } = await import("@estoicismo/supabase");
      return updateOkr(sb, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "okrs"] }),
  });
}

export function useDeleteOkr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteOkr } = await import("@estoicismo/supabase");
      await deleteOkr(sb, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business", "okrs"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// COMPETITORS (#98)
// ─────────────────────────────────────────────────────────────

export function useCompetitors(): UseQueryResult<
  import("@estoicismo/supabase").BusinessCompetitor[]
> {
  return useQuery({
    queryKey: ["business", "competitors"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { fetchCompetitors } = await import("@estoicismo/supabase");
      return fetchCompetitors(sb, await getUserId());
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: import("@estoicismo/supabase").CreateCompetitorInput
    ) => {
      const sb = getSupabaseBrowserClient();
      const { createCompetitor } = await import("@estoicismo/supabase");
      return createCompetitor(sb, await getUserId(), input);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["business", "competitors"] }),
    onError: (err) =>
      toast.error("No se pudo guardar.", {
        description: extractErrorMessage(err),
      }),
  });
}

export function useUpdateCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: import("@estoicismo/supabase").UpdateCompetitorInput;
    }) => {
      const sb = getSupabaseBrowserClient();
      const { updateCompetitor } = await import("@estoicismo/supabase");
      return updateCompetitor(sb, id, input);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["business", "competitors"] }),
  });
}

export function useDeleteCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient();
      const { deleteCompetitor } = await import("@estoicismo/supabase");
      await deleteCompetitor(sb, id);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["business", "competitors"] }),
  });
}
