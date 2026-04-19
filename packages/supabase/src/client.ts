import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import type { Database } from "./types";

let _client: ReturnType<typeof createClient<Database>> | null = null;

// Singleton — credentials come from env vars and are constant per process.
// Options (e.g. custom auth.storage for React Native SecureStore) only apply on first call.
export function getSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options?: Pick<SupabaseClientOptions<"public">, "auth">
) {
  if (!_client) {
    _client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        ...options?.auth,
      },
    });
  }
  return _client;
}
