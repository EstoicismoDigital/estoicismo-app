-- ============================================================
-- NEGOCIO · time tracking lite (#95)
-- ============================================================
--
-- Permite al user registrar bloques de tiempo trabajados en su
-- negocio. Útil para clientes facturados por hora, o sólo para
-- saber cuánto tiempo dedicas realmente al proyecto.
--
-- Modelo simple:
--   * started_at / ended_at (NULL = todavía corriendo)
--   * label (qué estaba haciendo)
--   * project (texto libre — sin FK por ahora, simple)
--
-- Solo puede haber una entrada activa (ended_at IS NULL) por user.
-- Esto se enforza con un partial unique index, no con un trigger
-- (porque la app cierra antes de iniciar otra).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  project TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT business_time_valid_range CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS business_time_user_idx
  ON public.business_time_entries (user_id, started_at DESC);

-- Solo una entrada activa por user
CREATE UNIQUE INDEX IF NOT EXISTS business_time_active_uq
  ON public.business_time_entries (user_id)
  WHERE ended_at IS NULL;

ALTER TABLE public.business_time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manage own time entries" ON public.business_time_entries;
CREATE POLICY "manage own time entries"
  ON public.business_time_entries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS business_time_set_updated_at ON public.business_time_entries;
CREATE TRIGGER business_time_set_updated_at
  BEFORE UPDATE ON public.business_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
