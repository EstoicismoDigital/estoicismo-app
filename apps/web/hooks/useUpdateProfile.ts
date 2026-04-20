"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "../lib/supabase-client";

export type UpdateProfileInput = {
  username?: string | null;
  timezone?: string;
};

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await sb
        .from("profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(input as any)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Cambios guardados");
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? "";
      if (msg.includes("duplicate key")) {
        toast.error("Ese nombre ya está en uso.");
      } else {
        toast.error("No se pudieron guardar los cambios.");
      }
    },
  });
}

/**
 * Curated list of timezones relevant to Spanish-speaking users.
 * Ordered by rough user base size; alphabetical within each region.
 */
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/Mexico_City", label: "México (CDMX)" },
  { value: "America/Monterrey", label: "México (Monterrey)" },
  { value: "America/Tijuana", label: "México (Tijuana)" },
  { value: "America/Cancun", label: "México (Cancún)" },
  { value: "America/Bogota", label: "Colombia (Bogotá)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
  { value: "America/Argentina/Cordoba", label: "Argentina (Córdoba)" },
  { value: "America/Santiago", label: "Chile (Santiago)" },
  { value: "America/Lima", label: "Perú (Lima)" },
  { value: "America/Caracas", label: "Venezuela (Caracas)" },
  { value: "America/Guayaquil", label: "Ecuador (Guayaquil)" },
  { value: "America/La_Paz", label: "Bolivia (La Paz)" },
  { value: "America/Asuncion", label: "Paraguay (Asunción)" },
  { value: "America/Montevideo", label: "Uruguay (Montevideo)" },
  { value: "America/Panama", label: "Panamá" },
  { value: "America/Costa_Rica", label: "Costa Rica" },
  { value: "America/El_Salvador", label: "El Salvador" },
  { value: "America/Guatemala", label: "Guatemala" },
  { value: "America/Tegucigalpa", label: "Honduras" },
  { value: "America/Managua", label: "Nicaragua" },
  { value: "America/Santo_Domingo", label: "República Dominicana" },
  { value: "America/Havana", label: "Cuba (La Habana)" },
  { value: "America/Puerto_Rico", label: "Puerto Rico" },
  { value: "Europe/Madrid", label: "España (Madrid)" },
  { value: "Atlantic/Canary", label: "España (Canarias)" },
  { value: "America/New_York", label: "EE. UU. (Nueva York)" },
  { value: "America/Los_Angeles", label: "EE. UU. (Los Ángeles)" },
  { value: "America/Chicago", label: "EE. UU. (Chicago)" },
  { value: "America/Denver", label: "EE. UU. (Denver)" },
  { value: "UTC", label: "UTC" },
];
