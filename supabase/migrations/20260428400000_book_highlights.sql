-- ============================================================
-- LECTURA · book highlights / quotes (#68)
-- ============================================================
--
-- Cada highlight es una cita o nota guardada de un libro.
-- Pensado para subrayados estilo Kindle — el user los escribe
-- a mano (sin import del Kindle export en v1).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reading_highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.reading_books(id) ON DELETE CASCADE NOT NULL,
  -- Texto de la cita (no el libro entero — solo el fragmento).
  content TEXT NOT NULL CHECK (length(content) > 0),
  -- Página opcional para referencia.
  page SMALLINT,
  -- Reflexión personal del user sobre la cita.
  note TEXT,
  -- Marcado como favorito para revisión rápida.
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reading_highlights_book_idx
  ON public.reading_highlights (book_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reading_highlights_user_fav_idx
  ON public.reading_highlights (user_id, is_favorite, created_at DESC)
  WHERE is_favorite = TRUE;

CREATE TRIGGER reading_highlights_updated_at
  BEFORE UPDATE ON public.reading_highlights
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reading_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own highlights"
  ON public.reading_highlights FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
