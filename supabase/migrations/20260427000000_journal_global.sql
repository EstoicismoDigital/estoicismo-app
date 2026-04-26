-- ============================================================
-- JOURNAL GLOBAL — diario / notas libres del usuario
-- ============================================================
--
-- Hasta ahora, "notas" en la app eran exclusivamente texto adjunto
-- a habit_logs (cuando completas un hábito puedes anotar algo). Eso
-- queda intacto.
--
-- Esta tabla añade una capa NUEVA: entradas de diario libres que el
-- usuario puede asociar (opcionalmente) a cualquier área de la app
-- — fitness, finanzas, mentalidad, lectura, emprendimiento — o
-- dejarlas como "diario libre".
--
-- Diseño:
--   - Una tabla simple, no fragmentada por área.
--   - `area` es un text con check de valores válidos. Default "free".
--   - `ref_id` + `ref_type` permiten amarrar opcionalmente a una
--     entidad concreta (un habit, una transaction, un workout…) sin
--     forzar FK a 6 tablas distintas.
--   - `tags` text[] para chips libres del user.
--   - `occurred_on` separado de `created_at` permite escribir hoy
--     sobre un evento de ayer (o programar una entrada).
-- ============================================================

CREATE TABLE public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL CHECK (length(content) > 0),
  -- Estado de ánimo 1-5 (1=mal, 5=excelente). Opcional.
  mood SMALLINT CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5)),
  -- Área de la vida — drives filtros y color en la UI.
  area TEXT NOT NULL DEFAULT 'free' CHECK (area IN (
    'free','habits','fitness','lectura','finanzas','mentalidad','emprendimiento','pegasso'
  )),
  -- Referencia opcional a una entidad. Si ref_id existe, ref_type
  -- debe coincidir con uno de los conocidos por la UI ("habit",
  -- "transaction", "workout", "reading_session", "debt", "goal",
  -- "business_task", etc.).
  ref_id UUID,
  ref_type TEXT,
  -- Tags libres (chips). Normalizamos a minúsculas en cliente.
  tags TEXT[] NOT NULL DEFAULT '{}',
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX journal_entries_user_date_idx
  ON public.journal_entries (user_id, occurred_on DESC, created_at DESC);

CREATE INDEX journal_entries_user_area_idx
  ON public.journal_entries (user_id, area);

-- GIN para buscar por tags (ej. WHERE tags @> ARRAY['gratitud']).
CREATE INDEX journal_entries_tags_idx
  ON public.journal_entries USING GIN (tags);

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal entries"
  ON public.journal_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
