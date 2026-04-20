"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "../lib/supabase-client";

const FALLBACK = { text: "El obstáculo es el camino.", author: "Marco Aurelio" };

type QuoteRow = { text: string; author: string };

export function useDailyQuote() {
  return useQuery<QuoteRow>({
    queryKey: ["daily-quote"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      // The project's local `Database` type doesn't declare RPCs, so the
      // generic `rpc` overload would resolve without args. We narrow to a
      // locally-typed view of `sb.rpc` to safely pass `p_language`.
      type RpcFn = (
        fn: "get_daily_quote",
        args: { p_language: string }
      ) => Promise<{ data: QuoteRow[] | null; error: unknown }>;
      const rpc = sb.rpc as unknown as RpcFn;
      const { data, error } = await rpc("get_daily_quote", { p_language: "es" });
      if (error) return FALLBACK;
      const row = Array.isArray(data) ? data[0] : null;
      if (!row?.text || !row?.author) return FALLBACK;
      return { text: row.text, author: row.author };
    },
    staleTime: Infinity,
  });
}
