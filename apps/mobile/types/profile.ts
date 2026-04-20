// Profile type read from Supabase profiles table.
// stripe_customer_id is not exposed to the mobile client — it lives only on the server.
export interface Profile {
  id: string;
  plan: 'free' | 'premium';
  plan_expires_at: string | null;
  streak_freeze_count: number;
}
