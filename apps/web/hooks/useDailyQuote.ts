"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "../lib/supabase-client";

const FALLBACK = { text: "El obstáculo es el camino.", author: "Marco Aurelio" };

export function useDailyQuote() {
  return useQuery<{ text: string; author: string }>({
    queryKey: ["daily-quote"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const { data, error } = await sb
        .from("stoic_quotes")
        .select("text, author")
        .eq("language", "es");
      if (error || !data?.length) return FALLBACK;
      const idx = new Date().getDate() % data.length;
      return data[idx] as { text: string; author: string };
    },
    staleTime: Infinity,
  });
}
