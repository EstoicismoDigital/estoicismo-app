"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "../lib/supabase-client";
import type { Profile } from "@estoicismo/supabase";

export function useProfile() {
  return useQuery<Profile | null, Error>({
    queryKey: ["profile"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return null;
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    // Profile cambia poco: timezone, plan, display name. 5 min de
    // stale evita refetch en cada navegación. Las mutations invalidan
    // explícitamente con qc.invalidateQueries({queryKey:["profile"]}).
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}
