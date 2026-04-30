import { cache } from "react";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@estoicismo/supabase";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Crea un Supabase server client request-scoped. Envuelto en
 * React.cache para que múltiples RSC en el mismo request reusen la
 * misma instancia (y por extensión, los mismos cookies / token).
 *
 * Beneficio: si 5 server components llaman createSupabaseServer(),
 * solo se hace 1 round-trip a `cookies()` / construcción del client.
 */
export const createSupabaseServer = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );
});

/**
 * Devuelve el user autenticado en el request actual. Memoizado por
 * React.cache: si N server components lo llaman, solo se valida el
 * JWT 1 vez. Para validación local (sin round-trip a Supabase Auth),
 * supabase-ssr ≥0.5 expone getClaims().
 */
export const getServerUser = cache(async () => {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
