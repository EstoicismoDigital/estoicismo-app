-- ============================================================
-- MENTALIDAD · vision board + mood + future-self letters
-- ============================================================

-- 1. VISION BOARD ITEMS
-- Imagenes/textos en un grid que el user ve cuando entra a /reflexiones.
-- Visualizacion estilo "vision board" — manifesta-lo-que-quieres.
CREATE TABLE IF NOT EXISTS public.mindset_vision_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Tipo: imagen (URL externa o subida), texto plano, o mix.
  kind TEXT NOT NULL DEFAULT 'image' CHECK (kind IN ('image','text','quote')),
  image_url TEXT,
  caption TEXT,
  -- Categoria opcional: "fitness","financial","love","carrera","viaje", etc
  category TEXT,
  position SMALLINT NOT NULL DEFAULT 0,
  -- Anhelo: 1-5 que tan urgente es para ti hoy
  weight SMALLINT CHECK (weight IS NULL OR (weight >= 1 AND weight <= 5)),
  achieved BOOLEAN NOT NULL DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mindset_vision_items_user_idx
  ON public.mindset_vision_items (user_id, achieved, position);

CREATE TRIGGER mindset_vision_items_updated_at
  BEFORE UPDATE ON public.mindset_vision_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mindset_vision_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vision items"
  ON public.mindset_vision_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. MOOD LOGS
-- Mood tracker first-class (no atado a habit logs ni meditation).
-- Una fila por user por dia. Incluye energia opcional + nota libre.
CREATE TABLE IF NOT EXISTS public.mindset_mood_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Mood 1-5: 1=mal, 5=excelente.
  mood SMALLINT NOT NULL CHECK (mood >= 1 AND mood <= 5),
  -- Energia 1-5 separada del mood (puedes estar feliz pero cansado).
  energy SMALLINT CHECK (energy IS NULL OR (energy >= 1 AND energy <= 5)),
  -- Tags: emociones especificas — "ansiedad","gratitud","ira","paz", etc.
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, occurred_on)
);

CREATE INDEX IF NOT EXISTS mindset_mood_logs_user_date_idx
  ON public.mindset_mood_logs (user_id, occurred_on DESC);

CREATE TRIGGER mindset_mood_logs_updated_at
  BEFORE UPDATE ON public.mindset_mood_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mindset_mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mood logs"
  ON public.mindset_mood_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. FUTURE SELF LETTERS
-- Carta a tu yo del futuro. Se "abre" en la fecha definida.
CREATE TABLE IF NOT EXISTS public.mindset_future_letters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Cuando puede leerse. Antes de esa fecha, la UI la oculta detras de un seal.
  open_on DATE NOT NULL,
  -- Titulo opcional ("A mi yo de 30 anhos", etc).
  title TEXT,
  content TEXT NOT NULL CHECK (length(content) > 0),
  -- Estado: sealed (no abrible aun) | opened (ya se leyo)
  is_opened BOOLEAN NOT NULL DEFAULT FALSE,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mindset_future_letters_user_idx
  ON public.mindset_future_letters (user_id, open_on);

CREATE TRIGGER mindset_future_letters_updated_at
  BEFORE UPDATE ON public.mindset_future_letters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mindset_future_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own future letters"
  ON public.mindset_future_letters FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
