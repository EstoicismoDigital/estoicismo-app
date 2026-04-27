-- ============================================================
-- NEGOCIO · OKRs trimestrales (#97)
-- ============================================================
--
-- Goal-setting lite — el user define 3 objetivos por trimestre con
-- progreso 0-100. Diferente de business_milestones (que son hitos
-- puntuales): los OKRs son ambición trimestral con review.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_okrs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Trimestre en formato "2026-Q1" / "2026-Q2" / "2026-Q3" / "2026-Q4"
  quarter TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- Progreso 0-100 — el user lo actualiza manualmente.
  progress SMALLINT NOT NULL DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100),
  -- Estado: active / done / dropped
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'done', 'dropped')),
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS business_okrs_user_quarter_idx
  ON public.business_okrs (user_id, quarter, position);

CREATE TRIGGER business_okrs_updated_at
  BEFORE UPDATE ON public.business_okrs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.business_okrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own OKRs"
  ON public.business_okrs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
