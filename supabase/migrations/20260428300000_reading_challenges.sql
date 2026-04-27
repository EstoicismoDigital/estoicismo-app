-- ============================================================
-- LECTURA · reading challenges (#70)
-- ============================================================
--
-- Metas categorizadas anuales — además del total de libros, el user
-- puede definir desafíos como "5 estoicos", "3 ficción", "2 negocios".
-- El progreso se calcula client-side filtrando reading_books por
-- category + finished_at en el año.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reading_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  year SMALLINT NOT NULL CHECK (year >= 2000 AND year <= 2100),
  -- Categoría de libro (matching libre con reading_books.category).
  -- Ej: "estoicismo", "ficcion", "negocios", "biografia".
  category TEXT NOT NULL,
  -- Etiqueta visible (puede diferir del slug). Ej: "Estoicismo".
  label TEXT NOT NULL,
  target SMALLINT NOT NULL CHECK (target > 0 AND target <= 100),
  emoji TEXT NOT NULL DEFAULT '📖',
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reading_challenges_user_year_idx
  ON public.reading_challenges (user_id, year, position);

CREATE TRIGGER reading_challenges_updated_at
  BEFORE UPDATE ON public.reading_challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reading_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reading challenges"
  ON public.reading_challenges FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
