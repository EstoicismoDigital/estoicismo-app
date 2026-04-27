-- ============================================================
-- LECTURA · annual goal
-- NEGOCIO · milestones
-- ============================================================

-- 1. READING GOALS
-- Una fila por (user, year) — cuántos libros quiere leer este año.
-- Progreso se calcula client-side contra reading_books.is_finished
-- en el rango finished_at del año.
CREATE TABLE IF NOT EXISTS public.reading_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  year SMALLINT NOT NULL CHECK (year >= 2000 AND year <= 2100),
  books_target SMALLINT NOT NULL CHECK (books_target > 0 AND books_target <= 999),
  -- Opcional: páginas / minutos. Mantenemos solo books_target en v1
  -- para no diluir la métrica.
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year)
);

CREATE INDEX IF NOT EXISTS reading_goals_user_year_idx
  ON public.reading_goals (user_id, year DESC);

CREATE TRIGGER reading_goals_updated_at
  BEFORE UPDATE ON public.reading_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reading goals"
  ON public.reading_goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. BUSINESS MILESTONES
-- Hitos del negocio: "primer venta", "$10k MXN totales", "10 clientes",
-- "lanzar producto X". Marcables manualmente o auto-derivables (no en v1).
CREATE TABLE IF NOT EXISTS public.business_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- Tipos de milestone para que la UI sepa qué mostrar.
  --   sales_total: alcanzar X en ventas acumuladas.
  --   sales_count: alcanzar X numero de ventas.
  --   clients_count: alcanzar X clientes.
  --   product_launch: lanzar un producto nuevo.
  --   custom: cualquier otro hito definido por el user.
  kind TEXT NOT NULL DEFAULT 'custom'
    CHECK (kind IN ('sales_total','sales_count','clients_count','product_launch','custom')),
  -- Para tipos numéricos, target_amount es la meta (cantidad o suma).
  target_amount NUMERIC(14,2),
  -- Fecha objetivo opcional (no hard deadline; sólo ancla mental).
  target_date DATE,
  -- Estado: open / achieved / abandoned.
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','achieved','abandoned')),
  achieved_at TIMESTAMPTZ,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS business_milestones_user_idx
  ON public.business_milestones (user_id, status, position);

CREATE TRIGGER business_milestones_updated_at
  BEFORE UPDATE ON public.business_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.business_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own business milestones"
  ON public.business_milestones FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
