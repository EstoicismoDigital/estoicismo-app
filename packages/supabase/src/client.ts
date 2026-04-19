import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _client: ReturnType<typeof createClient<Database>> | null = null;

// Singleton — credentials come from env vars and are constant per process.
// Call once at app startup; subsequent calls return the same instance.
export function getSupabaseClient(supabaseUrl: string, supabaseAnonKey: string) {
  if (!_client) {
    _client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}
