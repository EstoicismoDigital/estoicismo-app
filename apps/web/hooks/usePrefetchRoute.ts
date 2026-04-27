"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchHabits,
  fetchHabitLogs,
  fetchFinanceCategories,
  fetchTransactions,
  fetchAccounts,
  fetchCreditCards,
  fetchRecurring,
  fetchSubscriptions,
  fetchDebts,
  fetchMPD,
  fetchMPDLogForDate,
  fetchMPDLogs,
} from "@estoicismo/supabase";
import { fetchGoals as fetchSavingsGoals } from "@estoicismo/supabase";
import { fetchBudgets } from "@estoicismo/supabase";
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

/**
 * Sub-rutas con datos específicos que se pueden prefetchear cuando
 * el user pasa el ratón sobre una sub-nav tab. Las query keys deben
 * coincidir con las usadas por los hooks de cada página.
 */
export type SubPrefetchTarget =
  | "fin-cuentas"
  | "fin-tarjetas"
  | "fin-recurrentes"
  | "fin-ahorro"
  | "fin-presupuestos"
  | "fin-deudas";

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

/**
 * Prefetch para sub-rutas específicas — se llama on-hover de cada
 * tab del sub-nav. Trae los datos antes del click para que cuando
 * el user efectivamente navegue, el render sea instantáneo.
 *
 * staleTime corto en las queries de origen → ideal de prefetch que
 * dedupe automáticamente. No es caro disparar en cada hover.
 */
export function usePrefetchSubRoute() {
  const qc = useQueryClient();

  return useCallback(
    (target: SubPrefetchTarget) => {
      switch (target) {
        case "fin-cuentas": {
          qc.prefetchQuery({
            queryKey: ["finance", "accounts", false],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchAccounts(sb, await getUserId(), {
                include_archived: false,
              });
            },
          });
          break;
        }
        case "fin-tarjetas": {
          qc.prefetchQuery({
            queryKey: ["finance", "cards"],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchCreditCards(sb, await getUserId());
            },
          });
          break;
        }
        case "fin-recurrentes": {
          qc.prefetchQuery({
            queryKey: ["finance", "recurring", true],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchRecurring(sb, await getUserId(), {
                only_active: true,
              });
            },
          });
          qc.prefetchQuery({
            queryKey: ["finance", "subscriptions", "all"],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchSubscriptions(sb, await getUserId(), {});
            },
          });
          break;
        }
        case "fin-ahorro": {
          qc.prefetchQuery({
            queryKey: ["savings", "goals", false],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchSavingsGoals(sb, await getUserId(), {
                include_completed: false,
              });
            },
          });
          break;
        }
        case "fin-presupuestos": {
          qc.prefetchQuery({
            queryKey: ["budgets", true],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchBudgets(sb, await getUserId(), {
                only_active: true,
              });
            },
          });
          // Transactions del mes ya las debería tener prefetched el
          // hover de "finanzas", pero por si acaso.
          const { from, to } = monthBounds();
          qc.prefetchQuery({
            queryKey: ["finance", "tx", from, to],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchTransactions(sb, await getUserId(), { from, to });
            },
          });
          break;
        }
        case "fin-deudas": {
          qc.prefetchQuery({
            queryKey: ["finance", "debts"],
            queryFn: async () => {
              const sb = getSupabaseBrowserClient();
              return fetchDebts(sb, await getUserId(), {});
            },
          });
          break;
        }
      }
    },
    [qc]
  );
}

/** Mapping helper — cada SubnavItem.href tiene su SubPrefetchTarget. */
export function subPrefetchForHref(href: string): SubPrefetchTarget | null {
  if (href === "/finanzas/cuentas") return "fin-cuentas";
  if (href === "/finanzas/tarjetas") return "fin-tarjetas";
  if (href === "/finanzas/recurrentes") return "fin-recurrentes";
  if (href === "/finanzas/ahorro") return "fin-ahorro";
  if (href === "/finanzas/presupuestos") return "fin-presupuestos";
  if (href === "/finanzas/deudas") return "fin-deudas";
  return null;
}
