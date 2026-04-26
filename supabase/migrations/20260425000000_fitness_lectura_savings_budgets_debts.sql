-- ============================================================
-- FITNESS · LECTURA · AHORRO · PRESUPUESTOS · DEUDAS (rebuild)
-- ============================================================
-- Esta migración añade cinco módulos / extensiones grandes:
--
--   1. FITNESS  — métricas diarias (sueño, calorías, peso),
--                 ejercicios, workouts y sets. Sirve para el
--                 sistema de niveles griegos (Perseo → Zeus → Olimpo)
--                 que se computa en cliente sobre 1RM estimado.
--
--   2. LECTURA  — libros y sesiones cronometradas con resumen
--                 propio. Mismo patrón de Meditación pero para
--                 lectura.
--
--   3. AHORRO   — metas de ahorro (un sueño que estás abonando)
--                 + tabla de aportes con enlace opcional a
--                 finance_transactions (si el usuario quiere que
--                 cada abono también cuente como gasto en
--                 categoría "Ahorro").
--
--   4. PRESUPUESTOS — un tope de gasto por categoría/mes con
--                 threshold de alerta. El gasto "actual" se
--                 calcula del lado cliente sumando
--                 finance_transactions del mes en curso.
--
--   5. DEUDAS (rebuild) — la tabla finance_debts gana columnas
--                 para auditar progreso (original_balance,
--                 start_date, notes). Nueva tabla
--                 finance_debt_payments lleva el log de pagos
--                 con split capital/interés calculado en cliente.
--                 La estrategia (avalancha / snowball / custom)
--                 vive en el perfil del usuario porque es global,
--                 no por deuda.
--
-- Diseño general:
--   - NUMERIC(14,2) para todo monto monetario (igual que finanzas).
--   - Fechas DATE en YYYY-MM-DD.
--   - Todas las tablas con RLS y policy "Users can manage own X".
--   - updated_at trigger en las que mutan más allá de inserts.
--   - Niveles de fitness NO viven en DB — se derivan en cliente
--     sobre los datos brutos de workout_sets, así puedo iterar
--     las thresholds sin tocar schema.
-- ============================================================

-- ============================================================
-- FITNESS
-- ============================================================

-- Perfil de fitness — datos personales necesarios para calcular
-- niveles relativos al peso corporal. Vive separado de profiles
-- porque no todo usuario habilitará el módulo de fitness.
CREATE TABLE public.fitness_user_profile (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  -- Peso corporal actual en kg. Usa numérico para soportar 0.5 kg.
  bodyweight_kg NUMERIC(5,2) CHECK (bodyweight_kg IS NULL OR bodyweight_kg > 0),
  -- Objetivo de carga: hipertrofia, fuerza, resistencia, salud.
  goal TEXT NOT NULL DEFAULT 'fuerza' CHECK (goal IN ('fuerza','hipertrofia','resistencia','salud')),
  -- Sistema de unidades para mostrar peso (kg / lbs).
  unit_system TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric','imperial')),
  -- Sexo biológico — requerido sólo para ajustar thresholds del
  -- nivel-dios (los hombres y mujeres pueden tener thresholds
  -- diferentes; en MVP usamos los mismos pero dejamos el dato).
  sex TEXT CHECK (sex IS NULL OR sex IN ('male','female','other')),
  -- Año de nacimiento — sólo para tips contextuales.
  birth_year SMALLINT CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= 2100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER fitness_user_profile_updated_at
  BEFORE UPDATE ON public.fitness_user_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Métricas diarias — sueño / calorías / peso / pasos.
-- Una fila por usuario por día. UPSERT por (user_id, occurred_on).
CREATE TABLE public.fitness_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours NUMERIC(4,2) CHECK (sleep_hours IS NULL OR (sleep_hours >= 0 AND sleep_hours <= 24)),
  calories_intake INTEGER CHECK (calories_intake IS NULL OR calories_intake >= 0),
  weight_kg NUMERIC(5,2) CHECK (weight_kg IS NULL OR weight_kg > 0),
  steps INTEGER CHECK (steps IS NULL OR steps >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, occurred_on)
);

CREATE INDEX fitness_metrics_user_date_idx
  ON public.fitness_metrics (user_id, occurred_on DESC);

CREATE TRIGGER fitness_metrics_updated_at
  BEFORE UPDATE ON public.fitness_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Catálogo de ejercicios. user_id NULL = ejercicio "global" del seed
-- (squat, bench, deadlift, OHP, pull-ups). user_id no nulo = custom
-- del usuario.
CREATE TABLE public.fitness_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Slug estable para identificarlo desde el seed (e.g. "squat",
  -- "bench-press"). Permite computar niveles sin depender del id.
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  -- Grupo muscular principal — para listado/filtro.
  muscle_group TEXT NOT NULL DEFAULT 'general'
    CHECK (muscle_group IN (
      'pierna','pecho','espalda','hombro','brazo','core','cuerpo-completo','cardio','general'
    )),
  -- Tipo de medición que tiene sentido en este ejercicio:
  --   "weight_reps"  → squat, bench, etc. — sets con peso × reps
  --   "reps_only"    → pull-ups, push-ups, dips — reps sin peso
  --   "duration"     → planchas, cardio — duración en segundos
  measurement TEXT NOT NULL DEFAULT 'weight_reps'
    CHECK (measurement IN ('weight_reps','reps_only','duration')),
  -- Si el slug coincide con uno de los lifts principales que la
  -- librería de niveles conoce, se usa para el cálculo de "nivel
  -- griego" de cuerpo completo. Marcado true en el seed.
  is_main_lift BOOLEAN NOT NULL DEFAULT FALSE,
  icon TEXT NOT NULL DEFAULT 'dumbbell',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Único por slug dentro del scope (user o global).
  UNIQUE (user_id, slug)
);

CREATE INDEX fitness_exercises_user_idx
  ON public.fitness_exercises (user_id, muscle_group);

-- Workouts (sesiones de entrenamiento).
CREATE TABLE public.fitness_workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Hora exacta opcional para feed.
  started_at TIMESTAMPTZ,
  -- Etiqueta libre del workout — "Empuje", "Pierna", "Full body".
  name TEXT NOT NULL DEFAULT 'Sesión',
  -- Duración total estimada en minutos (entrada manual del user).
  duration_minutes SMALLINT CHECK (duration_minutes IS NULL OR (duration_minutes >= 0 AND duration_minutes <= 600)),
  -- Estado de ánimo post-sesión 1-5 (1=mal, 5=excelente).
  mood SMALLINT CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5)),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX fitness_workouts_user_date_idx
  ON public.fitness_workouts (user_id, occurred_on DESC);

CREATE TRIGGER fitness_workouts_updated_at
  BEFORE UPDATE ON public.fitness_workouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sets dentro de un workout (una fila por set).
CREATE TABLE public.fitness_workout_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES public.fitness_workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.fitness_exercises(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Orden del set dentro del workout (1, 2, 3...).
  set_index SMALLINT NOT NULL CHECK (set_index >= 1 AND set_index <= 99),
  -- Peso en kg. NULL para reps_only o duration.
  weight_kg NUMERIC(6,2) CHECK (weight_kg IS NULL OR weight_kg >= 0),
  -- Reps. NULL para duration.
  reps SMALLINT CHECK (reps IS NULL OR (reps >= 0 AND reps <= 999)),
  -- Duración del set en segundos (planchas, cardio).
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  -- RPE (esfuerzo percibido) 1-10, opcional.
  rpe SMALLINT CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX fitness_sets_workout_idx
  ON public.fitness_workout_sets (workout_id, set_index);

CREATE INDEX fitness_sets_user_exercise_idx
  ON public.fitness_workout_sets (user_id, exercise_id, created_at DESC);

-- ============================================================
-- LECTURA
-- ============================================================

CREATE TABLE public.reading_books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  total_pages INTEGER CHECK (total_pages IS NULL OR total_pages > 0),
  current_page INTEGER NOT NULL DEFAULT 0 CHECK (current_page >= 0),
  cover_url TEXT,
  -- Categoría libre — "filosofía", "novela", "ensayo"...
  category TEXT,
  -- Marca el libro como "el actual". Sólo uno debería estar activo
  -- por user a la vez; lo enforzamos en cliente para no rebotar
  -- migración por un caso uncommon (algunos lectores tienen 2 a la vez).
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_finished BOOLEAN NOT NULL DEFAULT FALSE,
  -- Score 1-5 cuando lo terminas — opcional.
  rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  notes TEXT,
  started_at DATE,
  finished_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reading_books_user_idx
  ON public.reading_books (user_id, is_finished, is_current);

CREATE TRIGGER reading_books_updated_at
  BEFORE UPDATE ON public.reading_books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.reading_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- book_id es opcional para soportar "lectura libre" (algún PDF
  -- aleatorio sin ficha).
  book_id UUID REFERENCES public.reading_books(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
  pages_from INTEGER CHECK (pages_from IS NULL OR pages_from >= 0),
  pages_to INTEGER CHECK (pages_to IS NULL OR pages_to >= 0),
  -- Resumen "con tus propias palabras" — llave del módulo.
  summary TEXT,
  -- Highlight / cita preferida de la sesión.
  highlight TEXT,
  mood SMALLINT CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5)),
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reading_sessions_user_date_idx
  ON public.reading_sessions (user_id, occurred_on DESC);

CREATE INDEX reading_sessions_book_idx
  ON public.reading_sessions (book_id, started_at DESC);

-- ============================================================
-- AHORRO
-- ============================================================

CREATE TABLE public.savings_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  deadline DATE,
  image_url TEXT,
  icon TEXT NOT NULL DEFAULT 'piggy-bank',
  color TEXT NOT NULL DEFAULT '#22774E',
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  -- Posición manual del usuario en el grid.
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX savings_goals_user_idx
  ON public.savings_goals (user_id, is_completed, position);

CREATE TRIGGER savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.savings_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES public.savings_goals(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount <> 0),
  -- Si el aporte se registró además como un gasto (categoría
  -- "Ahorro" en finance_transactions), guardamos la referencia
  -- para no duplicar al exportar.
  transaction_id UUID REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX savings_contributions_goal_idx
  ON public.savings_contributions (goal_id, occurred_on DESC);

CREATE INDEX savings_contributions_user_date_idx
  ON public.savings_contributions (user_id, occurred_on DESC);

-- ============================================================
-- PRESUPUESTOS
-- ============================================================

CREATE TABLE public.budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE CASCADE NOT NULL,
  -- Periodo: monthly (default) o yearly.
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly','yearly')),
  -- period_start es el primer día del periodo. NULL = "actual",
  -- recurrente. Cuando el usuario quiere fijar un presupuesto
  -- histórico (ej. cerrar abril) lo guardamos con su DATE.
  -- Para MVP siempre usamos NULL (presupuesto vigente, recurrente).
  period_start DATE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  -- Threshold de alerta como porcentaje del amount (0-100).
  -- Default 80 — la mayoría de apps avisa al 80% del consumo.
  alert_threshold SMALLINT NOT NULL DEFAULT 80
    CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Un sólo presupuesto activo por (user, category, period_start).
  -- period_start NULL se trata como un valor único en el constraint
  -- via partial index (UNIQUE NULLS NOT DISTINCT no es portable).
  UNIQUE (user_id, category_id, period, period_start)
);

CREATE INDEX budgets_user_idx
  ON public.budgets (user_id, is_active);

CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- DEUDAS — extensión de finance_debts + tabla de pagos
-- ============================================================

-- Columnas nuevas en la tabla existente.
ALTER TABLE public.finance_debts
  -- Saldo original (snapshot al inicio); permite mostrar
  -- "% pagado" del principal.
  ADD COLUMN IF NOT EXISTS original_balance NUMERIC(14,2),
  -- Fecha de inicio de la deuda (para cálculos de interés
  -- acumulado y para mostrar en histórico).
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Si original_balance está NULL al migrar, lo inicializamos al
-- balance actual — preserva la realidad histórica del usuario.
UPDATE public.finance_debts
  SET original_balance = balance
  WHERE original_balance IS NULL;

ALTER TABLE public.finance_debts
  ALTER COLUMN original_balance SET NOT NULL,
  ALTER COLUMN original_balance SET DEFAULT 0,
  ADD CONSTRAINT finance_debts_original_balance_check
    CHECK (original_balance >= 0);

-- Tabla de pagos por deuda. El cliente calcula el split principal/
-- interest sobre el balance vigente al momento del pago, y escribe
-- los tres números — guardar el split desnormalizado nos permite
-- mostrar histórico exacto sin recomputar.
CREATE TABLE public.finance_debt_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  debt_id UUID REFERENCES public.finance_debts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  -- Split capital / interés. Pueden ser negativos si el balance
  -- subió (interés acumulado mayor al pago) — por eso no checked.
  principal_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  interest_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- Si se registró además como gasto en finance_transactions.
  transaction_id UUID REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX finance_debt_payments_debt_idx
  ON public.finance_debt_payments (debt_id, occurred_on DESC);

CREATE INDEX finance_debt_payments_user_date_idx
  ON public.finance_debt_payments (user_id, occurred_on DESC);

-- Estrategia de payoff a nivel perfil — global del usuario.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payoff_strategy TEXT NOT NULL DEFAULT 'avalanche'
    CHECK (payoff_strategy IN ('avalanche','snowball','custom'));

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.fitness_user_profile      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_metrics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_exercises         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_workouts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_workout_sets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_books             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_debt_payments     ENABLE ROW LEVEL SECURITY;

-- Policies — patrón estándar "manage own".
CREATE POLICY "Users can manage own fitness profile"
  ON public.fitness_user_profile FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own fitness metrics"
  ON public.fitness_metrics FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fitness_exercises: lectura compartida de defaults + escritura propia.
CREATE POLICY "Users read own or default exercises"
  ON public.fitness_exercises FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises"
  ON public.fitness_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
  ON public.fitness_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises"
  ON public.fitness_exercises FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workouts"
  ON public.fitness_workouts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own workout sets"
  ON public.fitness_workout_sets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own books"
  ON public.reading_books FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading sessions"
  ON public.reading_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own savings goals"
  ON public.savings_goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own savings contributions"
  ON public.savings_contributions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own debt payments"
  ON public.finance_debt_payments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEED — ejercicios principales (lifts conocidos por la lib de niveles)
-- ============================================================

INSERT INTO public.fitness_exercises (user_id, slug, name, muscle_group, measurement, is_main_lift, icon) VALUES
  (NULL, 'squat',         'Sentadilla',           'pierna',         'weight_reps', TRUE,  'dumbbell'),
  (NULL, 'bench-press',   'Press de banca',       'pecho',          'weight_reps', TRUE,  'dumbbell'),
  (NULL, 'deadlift',      'Peso muerto',          'espalda',        'weight_reps', TRUE,  'dumbbell'),
  (NULL, 'overhead-press','Press militar',        'hombro',         'weight_reps', TRUE,  'dumbbell'),
  (NULL, 'pull-ups',      'Dominadas',            'espalda',        'reps_only',   TRUE,  'arrow-up'),
  -- Accesorios populares — útiles aunque no entren en el cómputo de nivel global.
  (NULL, 'barbell-row',   'Remo con barra',       'espalda',        'weight_reps', FALSE, 'dumbbell'),
  (NULL, 'incline-bench', 'Press inclinado',      'pecho',          'weight_reps', FALSE, 'dumbbell'),
  (NULL, 'romanian-dl',   'Peso muerto rumano',   'pierna',         'weight_reps', FALSE, 'dumbbell'),
  (NULL, 'front-squat',   'Sentadilla frontal',   'pierna',         'weight_reps', FALSE, 'dumbbell'),
  (NULL, 'dips',          'Fondos',               'pecho',          'reps_only',   FALSE, 'arrow-down'),
  (NULL, 'push-ups',      'Lagartijas',           'pecho',          'reps_only',   FALSE, 'arrow-down'),
  (NULL, 'plank',         'Plancha',              'core',           'duration',    FALSE, 'timer'),
  (NULL, 'curl',          'Curl de bíceps',       'brazo',          'weight_reps', FALSE, 'dumbbell'),
  (NULL, 'tricep-ext',    'Extensión de tríceps', 'brazo',          'weight_reps', FALSE, 'dumbbell'),
  (NULL, 'lateral-raise', 'Elevación lateral',    'hombro',         'weight_reps', FALSE, 'dumbbell'),
  (NULL, 'leg-press',     'Prensa de pierna',     'pierna',         'weight_reps', FALSE, 'dumbbell'),
  (NULL, 'calf-raise',    'Gemelos',              'pierna',         'weight_reps', FALSE, 'dumbbell'),
  (NULL, 'cardio-run',    'Cardio (correr)',      'cardio',         'duration',    FALSE, 'activity');
