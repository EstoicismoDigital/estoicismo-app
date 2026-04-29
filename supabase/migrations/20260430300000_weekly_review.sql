-- 20260430300000_weekly_review.sql
-- Cierre semanal por pilar — replica las páginas "Progreso /
-- Bloqueos / Compromiso" de la Agenda de Zeus física, una por
-- cada uno de los 4 pilares (hábitos, finanzas, mentalidad,
-- emprendimiento). Una fila por (user, semana, pilar).

CREATE TABLE IF NOT EXISTS public.weekly_review (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_starting DATE NOT NULL,  -- lunes de la semana
  pilar TEXT NOT NULL CHECK (pilar IN ('habits','finance','mindset','business')),
  progress TEXT,                 -- "¿Qué hice esta semana que me acercó a mi MPD?"
  blockers TEXT,                 -- "¿Qué excusas/decisiones impulsivas saboteé?"
  commitment TEXT,               -- "¿Qué acción concreta voy a cumplir los próximos 7 días?"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_starting, pilar)
);

ALTER TABLE public.weekly_review ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select"
  ON public.weekly_review FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "owner_insert"
  ON public.weekly_review FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "owner_update"
  ON public.weekly_review FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "owner_delete"
  ON public.weekly_review FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER set_weekly_review_updated_at
  BEFORE UPDATE ON public.weekly_review
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_weekly_review_user_week
  ON public.weekly_review (user_id, week_starting DESC);
