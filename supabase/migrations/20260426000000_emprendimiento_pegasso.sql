-- ============================================================
-- EMPRENDIMIENTO · PEGASSO (chat IA)
-- ============================================================
--
-- DOS MÓDULOS NUEVOS:
--
-- A) EMPRENDIMIENTO — administrar un mini-negocio sin saturar:
--    * business_profile (uno por user)
--    * business_products (catálogo simple)
--    * business_clients (CRM ligero)
--    * business_tasks (todos del negocio)
--    * business_ideas (brainstorm guardado para los que aún no tienen)
--    * business_sales (registro de ventas, opcionalmente con cliente
--      y producto + auto-link a finance_transactions)
--
-- B) PEGASSO — chat con Claude:
--    * pegasso_conversations (1 user → N conversaciones)
--    * pegasso_messages (mensajes user / assistant)
--
-- Diseño:
--   - Mantener el costo bajo: el mini-negocio es para "alguien que vende
--     unas cosas o presta un servicio", no para PyMEs grandes. No hay
--     inventario, ni facturación, ni multi-cuenta.
--   - business_profile permite filosofía: el user decide si tiene
--     negocio activo, está en brainstorm, o es híbrido. La UI ramifica
--     según ese estado.
--   - Pegasso usa role en cada mensaje ('user' | 'assistant') igual
--     que el SDK de Anthropic — facilita persistencia/replay.
--   - RLS estándar manage-own en todas.
-- ============================================================

-- ============================================================
-- EMPRENDIMIENTO
-- ============================================================

-- Perfil del emprendimiento del usuario. Una fila por user (puede no
-- existir si nunca lo configuró). Campos opcionales para soportar
-- el flujo "todavía estoy explorando ideas".
CREATE TABLE public.business_profile (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  -- Estado del usuario respecto a su negocio. Drives la UI:
  --   "exploring"  → muestra brainstorm + sugerencias.
  --   "starting"   → ya eligió rubro, está armando.
  --   "active"     → el negocio está vivo, mostrar dashboard.
  --   "paused"     → en pausa pero no quiere borrarlo.
  status TEXT NOT NULL DEFAULT 'exploring'
    CHECK (status IN ('exploring','starting','active','paused')),
  name TEXT,
  description TEXT,
  -- Categoría libre — "digital", "físico", "servicios", "contenido", "otro".
  category TEXT,
  -- ¿Cuál de tus MPDs / propósitos persigue este negocio?
  -- Texto libre — el user puede escribir su propósito o referirse al
  -- MPD del módulo Mentalidad. No hacemos FK a mindset_mpd para no
  -- forzar dependencia circular en la UI.
  purpose_link TEXT,
  -- Fecha de inicio (real o estimada).
  started_on DATE,
  -- Moneda del negocio.
  currency TEXT NOT NULL DEFAULT 'MXN',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER business_profile_updated_at
  BEFORE UPDATE ON public.business_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Catálogo de productos / servicios del negocio.
CREATE TABLE public.business_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  -- Precio "lista" — el cliente puede pagar diferente, pero esto sirve
  -- de base.
  price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  -- Costo unitario aproximado (para margen mental sin obsesionarse).
  cost NUMERIC(14,2) DEFAULT 0 CHECK (cost IS NULL OR cost >= 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  -- "producto", "servicio", "digital", "membresia"... — texto libre,
  -- no enum.
  kind TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  position SMALLINT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX business_products_user_idx
  ON public.business_products (user_id, is_active, position);

CREATE TRIGGER business_products_updated_at
  BEFORE UPDATE ON public.business_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CRM ligero. Sin pipeline ni etapas — sólo gente con la que tratas.
CREATE TABLE public.business_clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  -- Cualquiera de estos puede estar vacío.
  email TEXT,
  phone TEXT,
  -- Ej: "Recurrente", "Lead frío", "Cliente VIP" — chip libre.
  tag TEXT,
  notes TEXT,
  -- Cliente activo o archivado.
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX business_clients_user_idx
  ON public.business_clients (user_id, is_archived);

CREATE TRIGGER business_clients_updated_at
  BEFORE UPDATE ON public.business_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tareas / objetivos del negocio.
CREATE TABLE public.business_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- low / medium / high. Sin urgent — eso fomenta corre-corre.
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high')),
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX business_tasks_user_idx
  ON public.business_tasks (user_id, is_completed, due_date NULLS LAST);

CREATE TRIGGER business_tasks_updated_at
  BEFORE UPDATE ON public.business_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ideas de negocio (brainstorm). Para los que aún no eligieron rubro.
CREATE TABLE public.business_ideas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  -- Score subjetivo 1-5 sobre cuánto te emociona la idea.
  excitement SMALLINT CHECK (excitement IS NULL OR (excitement >= 1 AND excitement <= 5)),
  -- Score subjetivo 1-5 sobre qué tan factible te parece.
  feasibility SMALLINT CHECK (feasibility IS NULL OR (feasibility >= 1 AND feasibility <= 5)),
  -- Costo estimado de empezar (rango libre como texto: "$5k MXN").
  startup_cost_text TEXT,
  -- Notas de validación: ¿quién pagaría? ¿hay competencia?
  validation_notes TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX business_ideas_user_idx
  ON public.business_ideas (user_id, is_favorite, position);

CREATE TRIGGER business_ideas_updated_at
  BEFORE UPDATE ON public.business_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ventas / movimientos del negocio. Una venta = "transaction de
-- negocio" simplificada. Si el user quiere que cuente como ingreso
-- en sus finanzas personales, la marca con auto_log y nosotros
-- creamos una finance_transaction enlazada.
CREATE TABLE public.business_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.business_products(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.business_clients(id) ON DELETE SET NULL,
  -- Cantidad vendida (1 por default).
  quantity SMALLINT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  -- Monto total cobrado (puede diferir del precio de lista × quantity).
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  -- Si el user pidió crear finance_transaction de tipo ingreso.
  transaction_id UUID REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX business_sales_user_date_idx
  ON public.business_sales (user_id, occurred_on DESC);

CREATE INDEX business_sales_product_idx
  ON public.business_sales (product_id);

CREATE INDEX business_sales_client_idx
  ON public.business_sales (client_id);

-- ============================================================
-- PEGASSO (chat IA)
-- ============================================================

-- Conversación = un hilo. El user puede tener varios hilos para
-- distintos temas (la idea es que no haya un único "muro" que se
-- contamine de contextos diferentes).
CREATE TABLE public.pegasso_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Título — el user lo escribe o lo deduce el primer mensaje.
  title TEXT NOT NULL DEFAULT 'Conversación con Pegasso',
  -- Última actividad para ordenar la lista en cliente.
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Archivado para limpiar UI sin borrar histórico.
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX pegasso_conversations_user_idx
  ON public.pegasso_conversations (user_id, is_archived, last_message_at DESC);

CREATE TRIGGER pegasso_conversations_updated_at
  BEFORE UPDATE ON public.pegasso_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mensaje individual. role coincide con el SDK de Anthropic
-- ("user" | "assistant") para facilitar serializar/replay sin
-- mapeo intermedio.
CREATE TABLE public.pegasso_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.pegasso_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  -- Modelo usado al generar este mensaje (sólo para assistant).
  -- Útil para auditar coste y comparar entre Haiku/Sonnet/Opus.
  model TEXT,
  -- Tokens consumidos (sólo assistant; null para user).
  input_tokens INTEGER,
  output_tokens INTEGER,
  -- Si la generación falló, guardamos el error para no bloquear UI.
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX pegasso_messages_conv_idx
  ON public.pegasso_messages (conversation_id, created_at);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.business_profile          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_ideas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_sales            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pegasso_conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pegasso_messages          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own business profile"
  ON public.business_profile FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own business products"
  ON public.business_products FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own business clients"
  ON public.business_clients FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own business tasks"
  ON public.business_tasks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own business ideas"
  ON public.business_ideas FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own business sales"
  ON public.business_sales FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own pegasso conversations"
  ON public.pegasso_conversations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own pegasso messages"
  ON public.pegasso_messages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
