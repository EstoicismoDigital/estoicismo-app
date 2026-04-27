-- ============================================================
-- HÁBITOS · streak freezes (sick day pass)
-- ============================================================
--
-- Permite "congelar" un día específico de un hábito para que NO
-- rompa la racha. Pensado para días de enfermedad, viajes, días
-- excepcionales — no para skipping casual.
--
-- Diseño:
--   - Una fila por (user_id, habit_id, frozen_on)
--   - El cómputo de racha en cliente considera los días frozen
--     como "completed" para no romper el chain
--   - No hay quota a nivel DB — la UI puede limitar (ej. 1 por
--     hábito por mes en free, 5 en premium) pero por simplicidad
--     en MVP no enforzamos. Auditable vía esta tabla.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.habit_streak_freezes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  frozen_on DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (habit_id, frozen_on)
);

CREATE INDEX IF NOT EXISTS habit_streak_freezes_user_idx
  ON public.habit_streak_freezes (user_id, habit_id, frozen_on DESC);

ALTER TABLE public.habit_streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own freezes"
  ON public.habit_streak_freezes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
