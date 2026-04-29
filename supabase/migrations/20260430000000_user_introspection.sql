-- 20260430000000_user_introspection.sql
-- Tabla con la introspección/visualización de los 4 pilares que el
-- usuario llena al inicio (después de firmar el manifiesto y definir
-- su MPD). Replica la sección "Las 4 columnas vitales de tu Olimpo"
-- de la Agenda de Zeus física.

CREATE TABLE IF NOT EXISTS public.user_introspection (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Hábitos (Epicteto)
  habits_bad TEXT,
  habits_good TEXT,
  -- Finanzas (Marco Aurelio)
  finance_current TEXT,
  finance_current_income NUMERIC,
  finance_target TEXT,
  finance_target_income NUMERIC,
  -- Mentalidad (Porcia Catón)
  mindset_current TEXT,
  mindset_target TEXT,
  -- Emprendimiento (Séneca)
  business_current TEXT,
  business_current_revenue NUMERIC,
  business_target TEXT,
  business_target_revenue NUMERIC,
  --
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_introspection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_read_own_introspection"
  ON public.user_introspection FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_can_insert_own_introspection"
  ON public.user_introspection FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_can_update_own_introspection"
  ON public.user_introspection FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE TRIGGER set_user_introspection_updated_at
  BEFORE UPDATE ON public.user_introspection
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
