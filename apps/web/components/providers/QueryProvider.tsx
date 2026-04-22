"use client";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { useState } from "react";

/**
 * React Query provider con persistencia en IndexedDB.
 *
 * Patrón: stale-while-revalidate con persistencia ("Notion / Linear / Cron").
 *  - Primera visita: fetch de red → guarda en IndexedDB
 *  - Visitas siguientes: lee de IndexedDB en <10ms (datos aparecen al instante)
 *    y refetchea en background si el staleTime ya pasó
 *  - Incluso después de recargar (Cmd+R), los datos siguen ahí
 *
 * Decisiones:
 *  - `gcTime: 24h` — sin esto, React Query descartaría las queries del cache
 *    en memoria antes de que el persister las pueda serializar. El persister
 *    solo guarda lo que React Query tiene cacheado.
 *  - `maxAge: 24h` — datos persistidos más viejos de un día se descartan.
 *    Balance entre "aparece instantáneo" y "no muestres nada muy rancio".
 *  - `buster` = `CACHE_VERSION` — si cambio el shape de algún query result,
 *    incremento esta constante y los caches viejos se invalidan para todos.
 *  - IndexedDB vs localStorage: IndexedDB soporta valores grandes y no
 *    bloquea el main thread. Con idb-keyval obtienes una API tipo
 *    localStorage sobre IDB.
 *
 * Seguridad multi-usuario:
 *  - Las queryKeys que dependen del usuario ya incluyen userId en el hook,
 *    así que no hay riesgo de mezclar datos entre cuentas en el mismo
 *    dispositivo. Pero al hacer sign-out, limpiamos el cache persistente
 *    vía `clearPersistedCache()` (exportado abajo) — ver SignOutButton.
 */
const CACHE_KEY = "estoicismo-rq-cache";

// Subir este número invalida caches viejos tras un deploy que cambia schemas.
const CACHE_VERSION = "v1";

/**
 * Borra el cache persistente. Llamar al sign-out para que la siguiente
 * cuenta en el mismo dispositivo no vea residuos de la anterior.
 */
export async function clearPersistedCache() {
  try {
    await del(CACHE_KEY);
  } catch {
    /* ignore — private mode, quota exceeded, etc. */
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 60 * 24, // 24h — requerido para que el persister funcione
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: {
        getItem: async (key) => (await get<string>(key)) ?? null,
        setItem: async (key, value) => {
          await set(key, value);
        },
        removeItem: async (key) => {
          await del(key);
        },
      },
      key: CACHE_KEY,
      throttleTime: 1000, // agrupa escrituras en intervalos de 1s
    })
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24h
        buster: CACHE_VERSION,
        // Solo persiste queries exitosas — errores y loading no valen
        // la pena cachear porque cada refresh los resetea igualmente.
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
