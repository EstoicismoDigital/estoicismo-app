-- 20260430200000_tour_seen_v2.sql
-- Flag para el tour interactivo v2 (post Sol/Luna). Se usa para
-- mostrar el tour solo la primera vez que el usuario llega a /hoy
-- después del onboarding wizard.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tour_seen_v2 BOOLEAN DEFAULT FALSE;
