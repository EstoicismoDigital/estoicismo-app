-- supabase/migrations/20260420100000_enforce_free_tier_cap.sql
-- Enforce the 3-habit cap for free-tier users at the DB level.
-- Free plan: max 3 non-archived habits per user.
-- Premium plan: unlimited (no-op).

CREATE OR REPLACE FUNCTION public.enforce_free_tier_habit_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_count INTEGER;
BEGIN
  -- Look up the owner's plan. SECURITY DEFINER + explicit search_path
  -- lets us bypass RLS safely for this single lookup.
  SELECT plan INTO v_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- If profile is missing (shouldn't happen thanks to handle_new_user),
  -- default to the stricter free-tier behavior.
  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  IF v_plan = 'free' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.habits
    WHERE user_id = NEW.user_id
      AND is_archived = FALSE;

    IF v_count >= 3 THEN
      RAISE EXCEPTION 'HABIT_LIMIT_REACHED: Has alcanzado el límite de 3 hábitos del plan gratuito. Actualiza a Premium para crear hábitos ilimitados.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Lock the function down: only the role that owns it can execute by default,
-- but it is invoked by the trigger regardless of caller privileges.
REVOKE ALL ON FUNCTION public.enforce_free_tier_habit_cap() FROM PUBLIC;

DROP TRIGGER IF EXISTS habits_enforce_free_tier_cap ON public.habits;
CREATE TRIGGER habits_enforce_free_tier_cap
  BEFORE INSERT ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_free_tier_habit_cap();

-- DOWN migration (for manual revert):
--   DROP TRIGGER IF EXISTS habits_enforce_free_tier_cap ON public.habits;
--   DROP FUNCTION IF EXISTS public.enforce_free_tier_habit_cap();
