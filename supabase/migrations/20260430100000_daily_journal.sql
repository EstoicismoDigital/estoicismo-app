-- 20260430100000_daily_journal.sql
-- Daily journal "Sol/Luna" — replica la página diaria de la Agenda
-- de Zeus física. Una fila por (user, día). El upsert con conflict
-- (user_id, occurred_on) permite escribir mañana y noche por separado.

CREATE TABLE IF NOT EXISTS public.daily_journal (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occurred_on DATE NOT NULL,
  --
  -- ☀ SOL — el día empieza
  --
  day_started_at TIME,
  morning_intent TEXT,             -- "¿Cómo quiero vivir este día?"
  morning_gratitude TEXT,          -- "qué agradeces"
  morning_attitude TEXT,           -- "actitud con la que enfrentas el día"
  morning_small_action TEXT,       -- "pequeña acción si hoy te cuesta"
  tasks JSONB DEFAULT '[]'::jsonb, -- [{ text, time_from, time_to, done }, ...] hasta 7
  --
  -- 🌙 LUNA — el día termina
  --
  day_ended_at TIME,
  evening_reflection TEXT,         -- "¿Cómo viví este día?"
  vital_eter BOOLEAN DEFAULT FALSE,    -- meditación
  vital_forja BOOLEAN DEFAULT FALSE,   -- ejercicio
  vital_nectar BOOLEAN DEFAULT FALSE,  -- hidratación
  vital_kleos BOOLEAN DEFAULT FALSE,   -- lectura
  state TEXT CHECK (state IN ('eudaimonia','sophrosyne','agon','thymos','ekpyrosis')),
  income_today NUMERIC,
  expense_today NUMERIC,
  tomorrow_objectives TEXT,
  --
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, occurred_on)
);

ALTER TABLE public.daily_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select"
  ON public.daily_journal FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "owner_insert"
  ON public.daily_journal FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "owner_update"
  ON public.daily_journal FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "owner_delete"
  ON public.daily_journal FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER set_daily_journal_updated_at
  BEFORE UPDATE ON public.daily_journal
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_daily_journal_user_date
  ON public.daily_journal (user_id, occurred_on DESC);
