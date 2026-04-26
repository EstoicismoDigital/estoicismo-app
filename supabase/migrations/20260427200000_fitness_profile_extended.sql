-- ============================================================
-- FITNESS · perfil extendido + body metrics
-- ============================================================
--
-- El perfil original era mínimo (peso, goal, sex, año). Para hacer
-- recomendaciones de verdad necesitamos:
--   - altura (BMI, BMR, TDEE)
--   - frecuencia semanal objetivo (split sugerido)
--   - nivel de experiencia (principiante/intermedio/avanzado —
--     define rep ranges, intensidad)
--   - peso meta opcional (para perder/ganar)
--   - meta en palabras del user (como el MPD de Mentalidad)
--   - ejercicios preferidos (slugs del catálogo, opcional)
--
-- Body metrics: medidas corporales más allá del peso (cintura,
-- pecho, brazos). Tabla aparte porque la mayoría de users no las
-- llena, no quiero contaminar fitness_metrics que es diaria.
-- ============================================================

ALTER TABLE public.fitness_user_profile
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1)
    CHECK (height_cm IS NULL OR (height_cm > 50 AND height_cm < 250)),
  ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC(5,2)
    CHECK (target_weight_kg IS NULL OR target_weight_kg > 0),
  ADD COLUMN IF NOT EXISTS weekly_target_days SMALLINT
    CHECK (weekly_target_days IS NULL OR (weekly_target_days >= 1 AND weekly_target_days <= 7)),
  ADD COLUMN IF NOT EXISTS experience_level TEXT
    CHECK (experience_level IS NULL OR experience_level IN ('principiante','intermedio','avanzado')),
  ADD COLUMN IF NOT EXISTS goal_text TEXT,
  ADD COLUMN IF NOT EXISTS preferred_exercises TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Body metrics — medidas corporales en el tiempo. Una fila por
-- usuario por fecha. Todos los campos opcionales — el user mide
-- lo que quiera medir.
CREATE TABLE IF NOT EXISTS public.fitness_body_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Todas las medidas en cm.
  chest_cm NUMERIC(5,1) CHECK (chest_cm IS NULL OR chest_cm > 0),
  waist_cm NUMERIC(5,1) CHECK (waist_cm IS NULL OR waist_cm > 0),
  hips_cm NUMERIC(5,1) CHECK (hips_cm IS NULL OR hips_cm > 0),
  arm_cm NUMERIC(5,1) CHECK (arm_cm IS NULL OR arm_cm > 0),
  thigh_cm NUMERIC(5,1) CHECK (thigh_cm IS NULL OR thigh_cm > 0),
  -- Body fat % opcional (impedancia o calíper).
  body_fat_pct NUMERIC(4,1) CHECK (body_fat_pct IS NULL OR (body_fat_pct >= 0 AND body_fat_pct <= 80)),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, occurred_on)
);

CREATE INDEX IF NOT EXISTS fitness_body_metrics_user_date_idx
  ON public.fitness_body_metrics (user_id, occurred_on DESC);

CREATE TRIGGER fitness_body_metrics_updated_at
  BEFORE UPDATE ON public.fitness_body_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.fitness_body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own body metrics"
  ON public.fitness_body_metrics FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
