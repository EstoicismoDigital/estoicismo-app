-- ============================================================
-- NEGOCIO · competitor tracker (#98)
-- ============================================================
--
-- Lista simple de competidores que el user quiere vigilar — sin
-- pretender ser un CRM completo. Cada uno con notas + URL.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_competitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  -- Lo que destacan / hacen mejor.
  strengths TEXT,
  -- Lo que el user puede aprovechar / hacer diferente.
  weaknesses TEXT,
  -- Notas libres.
  notes TEXT,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS business_competitors_user_idx
  ON public.business_competitors (user_id, position);

CREATE TRIGGER business_competitors_updated_at
  BEFORE UPDATE ON public.business_competitors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.business_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own competitors"
  ON public.business_competitors FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
