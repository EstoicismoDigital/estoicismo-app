"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "../lib/supabase-client";

/**
 * Devuelve la fecha (YYYY-MM-DD) de la última actividad del user
 * (último journal entry, mood log, gratitude, transaction, habit log).
 *
 * Se usa para detectar ausencia ≥ N días y mostrar:
 *   - RecoveryBanner sin guilt si hay 3+ días de ausencia
 *   - Mensaje de bienvenida normal si <3 días
 *
 * Optimización: una sola query con UNION via RPC podría ser más
 * rápida, pero por ahora hacemos cuatro selects en paralelo (RLS
 * filtra por user). Como solo trae 1 row por tabla con LIMIT 1
 * ORDER BY desc, el costo es bajo.
 */
export function useLastActiveDay() {
  return useQuery<{ lastDate: string | null; daysSince: number | null }>({
    queryKey: ["last-active-day"],
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return { lastDate: null, daysSince: null };

      // Cuatro queries baratas en paralelo. Cada una solo trae el
      // most-recent row's date. Si la tabla está vacía, devuelve null.
      const [journals, moods, gratitude, txs] = await Promise.all([
        sb
          .from("journal_entries")
          .select("occurred_on")
          .eq("user_id", user.id)
          .order("occurred_on", { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb
          .from("mindset_mood_logs")
          .select("occurred_on")
          .eq("user_id", user.id)
          .order("occurred_on", { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb
          .from("mindset_gratitude")
          .select("occurred_on")
          .eq("user_id", user.id)
          .order("occurred_on", { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb
          .from("finance_transactions")
          .select("occurred_on")
          .eq("user_id", user.id)
          .order("occurred_on", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const dates: string[] = [];
      const pushIf = (
        r: { data: { occurred_on?: string | null } | null; error?: unknown } | null
      ) => {
        const d = r?.data?.occurred_on;
        if (d) dates.push(d);
      };
      pushIf(journals);
      pushIf(moods);
      pushIf(gratitude);
      pushIf(txs);

      if (dates.length === 0) {
        return { lastDate: null, daysSince: null };
      }

      const lastDate = dates.sort().reverse()[0];
      const last = new Date(lastDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffMs = today.getTime() - last.getTime();
      const daysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      return { lastDate, daysSince };
    },
    staleTime: 1000 * 60 * 10, // 10 min: cambia max una vez al día
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
}
