-- ============================================================
-- MENTALIDAD · gratitude entries
-- ============================================================
--
-- Práctica diaria simple: 3 cosas por las que estás agradecido hoy.
-- Una fila por (user, occurred_on, slot 1-3). UI permite escribir
-- las 3 en una sola card; cada slot puede estar vacío.
--
-- Decisión: tabla propia (no abrazar journal_entries) porque la UX
-- lo amerita — racha de gratitud, retrieval rápido, y el campo es
-- estructurado (no texto libre largo).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mindset_gratitude (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Slot 1-3 — cada uno una "cosa" por la que estás agradecido.
  slot SMALLINT NOT NULL CHECK (slot >= 1 AND slot <= 3),
  content TEXT NOT NULL CHECK (length(content) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Una fila por user/dia/slot. Permite reescribir cada uno con upsert.
  UNIQUE (user_id, occurred_on, slot)
);

CREATE INDEX IF NOT EXISTS mindset_gratitude_user_date_idx
  ON public.mindset_gratitude (user_id, occurred_on DESC);

CREATE TRIGGER mindset_gratitude_updated_at
  BEFORE UPDATE ON public.mindset_gratitude
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mindset_gratitude ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own gratitude"
  ON public.mindset_gratitude FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
