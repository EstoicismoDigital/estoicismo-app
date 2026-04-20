-- supabase/migrations/20260420000000_add_stripe_customer_id.sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
