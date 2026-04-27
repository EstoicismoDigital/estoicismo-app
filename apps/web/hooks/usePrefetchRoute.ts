"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchHabits,
  fetchHabitLogs,
  fetchFinanceCategories,
  fetchTransactions,
  fetchMPD,
  fetchMPDLogForDate,
  fetchMPDLogs,
} from "@estoicismo/supabase";
import { getSupabaseBrowserClient } from "../lib/supabase-client";
import { getCurrentWeekDays, getTodayStr } from "../lib/dateUtils";
import { monthBounds } from "../lib/finance";

/**
 * Prefetch on hover — dispara las queries de una ruta ANTES de que
 * el usuario haga click. Resultado: cuando efectivamente navega, los
 * datos ya están en el cache de React Query (o persistidos en IDB) y
 * el render es instantáneo.
 *
 * Patrón:
 *   <Link href="/finanzas" onMouseEnter={() => prefetch("finanzas")} />
 *
 * `prefetchQuery` es no-op si la query ya está fresh (dentro del
 * staleTime), así que disparar en cada hover no es caro — React Query
 * hace el dedup por sí solo.
 *
 * Las queryKeys de aquí DEBEN coincidir con las del hook consumidor
 * (ReflexionesClient, FinanzasClient, HabitsDashboard) para que el
 * mount del componente encuentre el resultado en cache. Si cambias
 * uno, cambia el otro.
 */

async function getUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export type PrefetchTarget =
  | "hoy"
  | "habits"
  | "finanzas"
  | "reflexiones"
  | "emprendimiento"
  | "pegasso"
  | "ajustes";

export function usePrefetchRoute() {
  const qc = useQueryClient();

  return useCallback(
    (target: PrefetchTarget) => {
      // fire-and-forget — el return no se await-ea. Si hay error de red
      // el usuario nunca lo ve; el click real dispara la query de nuevo
      // y ahí sí se maneja el estado de error.
      switch (target) {
        case "habits": {
          // Coincide con useHabits() en HabitsDashboard
          qc.prefetchQuery({
            queryKey: ["habits"],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchHabits(sb, await getUserId());
            },
          });
          const week = getCurrentWeekDays();
          const from = week[0]?.date;
          const to = week[6]?.date;
          if (from && to) {
            qc.prefetchQuery({
              queryKey: ["habit-logs", from, to],
              queryFn: async () => {
                const sb = getSupabaseBrowserClient();
                return fetchHabitLogs(sb, await getUserId(), from, to);
              },
            });
          }
          break;
        }
        case "finanzas": {
          // Coincide con useFinanceCategories + useTransactions(mes) +
          // useRecentTransactions(20) en FinanzasClient
          qc.prefetchQuery({
            queryKey: ["finance", "categories"],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              // fetchFinanceCategories no recibe userId — RLS filtra por él,
              // y además incluye los defaults (user_id IS NULL) en la misma query.
              return fetchFinanceCategories(sb);
            },
          });
          const { from, to } = monthBounds();
          qc.prefetchQuery({
            queryKey: ["finance", "tx", from, to],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchTransactions(sb, await getUserId(), { from, to });
            },
          });
          qc.prefetchQuery({
            queryKey: ["finance", "tx", "recent", 20],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchTransactions(sb, await getUserId(), { limit: 20 });
            },
          });
          break;
        }
        case "reflexiones": {
          // Coincide con useMPD + useMPDLogForDate(hoy) + useMPDLogs(30)
          // en ReflexionesClient
          qc.prefetchQuery({
            queryKey: ["mindset", "mpd"],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchMPD(sb, await getUserId());
            },
          });
          const today = getTodayStr();
          qc.prefetchQuery({
            queryKey: ["mindset", "mpd-log", today],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchMPDLogForDate(sb, await getUserId(), today);
            },
          });
          qc.prefetchQuery({
            queryKey: ["mindset", "mpd-logs", 30],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchMPDLogs(sb, await getUserId(), { limit: 30 });
            },
          });
          break;
        }
        case "ajustes": {
          // Ajustes consume useProfile, que ya está montado a nivel
          // shell (PlanPill lo usa). Nada extra que prefetchear.
          break;
        }
      }
    },
    [qc]
  );
}
