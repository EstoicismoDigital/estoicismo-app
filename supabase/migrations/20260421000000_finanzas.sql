-- ============================================================
-- FINANZAS — tablas base del módulo financiero
-- ============================================================
-- Tablas:
--   * finance_categories  — catálogo de categorías (ingresos/gastos).
--                           Filas "globales" con user_id IS NULL sirven como
--                           defaults compartidos + seed inicial en español.
--                           Cada usuario puede crear categorías propias
--                           (user_id = auth.uid()).
--   * finance_transactions — movimientos (ingreso o gasto) del usuario.
--   * finance_credit_cards — tarjetas de crédito registradas por el user
--                             (sin número completo — solo alias + last4).
--   * finance_debts        — deudas a pagar (préstamos, tarjetas, familia,
--                             etc). Apoya la estrategia avalanche/snowball.
--   * finance_quotes       — consejos financieros de libros clásicos, al
--                             estilo de stoic_quotes (lectura pública, RLS
--                             permisiva).
--
-- Diseño:
--   - Todos los montos usan NUMERIC(14,2) — suficiente para cifras
--     personales en MXN/USD y sin pérdida por double.
--   - Moneda se guarda como texto ISO-4217 (default "MXN", que se puede
--     sobreescribir desde la UI con un selector si el usuario viaja).
--   - RLS se respeta con auth.uid() = user_id en todas las tablas propias;
--     finance_categories tiene excepción para leer defaults (user_id
--     IS NULL).
-- ============================================================

-- CATEGORÍAS
CREATE TABLE public.finance_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT 'circle',
  color TEXT NOT NULL DEFAULT '#6B7280',
  -- Palabras clave para el detector de categoría por voz. Array de
  -- strings normalizados (minúsculas, sin acentos) que disparan el
  -- match cuando aparecen en el texto transcrito.
  keywords TEXT[] NOT NULL DEFAULT '{}',
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX finance_categories_user_idx
  ON public.finance_categories (user_id, kind, position);

-- MOVIMIENTOS
CREATE TABLE public.finance_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  credit_card_id UUID,  -- FK añadido después de crear finance_credit_cards
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','voice','import')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX finance_tx_user_date_idx
  ON public.finance_transactions (user_id, occurred_on DESC);

CREATE INDEX finance_tx_user_kind_idx
  ON public.finance_transactions (user_id, kind);

CREATE TRIGGER finance_transactions_updated_at
  BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TARJETAS DE CRÉDITO
CREATE TABLE public.finance_credit_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  last4 TEXT CHECK (last4 IS NULL OR last4 ~ '^[0-9]{4}$'),
  credit_limit NUMERIC(14,2) NOT NULL CHECK (credit_limit >= 0),
  current_balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  apr NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (apr >= 0 AND apr <= 200),
  cut_day SMALLINT CHECK (cut_day >= 1 AND cut_day <= 31),
  due_day SMALLINT CHECK (due_day >= 1 AND due_day <= 31),
  color TEXT NOT NULL DEFAULT '#22774E',
  currency TEXT NOT NULL DEFAULT 'MXN',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX finance_cards_user_idx
  ON public.finance_credit_cards (user_id, is_archived);

CREATE TRIGGER finance_credit_cards_updated_at
  BEFORE UPDATE ON public.finance_credit_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.finance_transactions
  ADD CONSTRAINT finance_tx_card_fk
  FOREIGN KEY (credit_card_id)
  REFERENCES public.finance_credit_cards(id)
  ON DELETE SET NULL;

-- DEUDAS
CREATE TABLE public.finance_debts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'other' CHECK (kind IN ('credit_card','personal_loan','mortgage','auto','student','family','other')),
  -- Si la deuda corresponde a una tarjeta registrada, podemos enlazarlas
  -- para que el tablero muestre el dato unificado.
  credit_card_id UUID REFERENCES public.finance_credit_cards(id) ON DELETE SET NULL,
  balance NUMERIC(14,2) NOT NULL CHECK (balance >= 0),
  minimum_payment NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (minimum_payment >= 0),
  apr NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (apr >= 0 AND apr <= 200),
  due_day SMALLINT CHECK (due_day >= 1 AND due_day <= 31),
  currency TEXT NOT NULL DEFAULT 'MXN',
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX finance_debts_user_idx
  ON public.finance_debts (user_id, is_paid);

CREATE TRIGGER finance_debts_updated_at
  BEFORE UPDATE ON public.finance_debts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FRASES FINANCIERAS (consejos de libros clásicos)
CREATE TABLE public.finance_quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  source TEXT,
  lang TEXT NOT NULL DEFAULT 'es',
  tag TEXT NOT NULL DEFAULT 'general' CHECK (tag IN ('general','savings','debt','invest','mindset','budget'))
);

-- ROW LEVEL SECURITY
ALTER TABLE public.finance_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_credit_cards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_debts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_quotes        ENABLE ROW LEVEL SECURITY;

-- POLICIES: finance_categories (lectura compartida de defaults + escritura propia)
CREATE POLICY "Users can read own or default categories"
  ON public.finance_categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON public.finance_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON public.finance_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON public.finance_categories FOR DELETE
  USING (auth.uid() = user_id);

-- POLICIES: finance_transactions
CREATE POLICY "Users can manage own transactions"
  ON public.finance_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLICIES: finance_credit_cards
CREATE POLICY "Users can manage own credit cards"
  ON public.finance_credit_cards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLICIES: finance_debts
CREATE POLICY "Users can manage own debts"
  ON public.finance_debts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLICIES: finance_quotes (lectura pública)
CREATE POLICY "Anyone can read finance quotes"
  ON public.finance_quotes FOR SELECT
  USING (TRUE);

-- SEED: categorías por defecto (user_id IS NULL ⇒ visibles a todos)
-- Ingresos
INSERT INTO public.finance_categories (user_id, name, kind, icon, color, keywords, position) VALUES
  (NULL, 'Salario',      'income',  'briefcase', '#22774E', ARRAY['salario','sueldo','quincena','nomina','nómina','pago'], 1),
  (NULL, 'Freelance',    'income',  'zap',       '#15803D', ARRAY['freelance','proyecto','cliente','consultoria','consultoría','factura'], 2),
  (NULL, 'Inversiones',  'income',  'trending-up','#047857', ARRAY['dividendo','dividendos','rendimiento','cripto','bolsa','acciones','interes','interés'], 3),
  (NULL, 'Ventas',       'income',  'shopping-bag','#059669', ARRAY['venta','vendi','vendí','negocio','tienda'], 4),
  (NULL, 'Regalo',       'income',  'gift',      '#34D399', ARRAY['regalo','prestado','me prestaron','aguinaldo','bono'], 5),
  (NULL, 'Otros ingresos','income', 'plus-circle','#10B981', ARRAY['otro','ingreso extra','extra'], 99);

-- Gastos
INSERT INTO public.finance_categories (user_id, name, kind, icon, color, keywords, position) VALUES
  (NULL, 'Comida',        'expense', 'utensils',    '#E11D48', ARRAY['comida','restaurante','almuerzo','desayuno','cena','taco','pizza','mercado','super','supermercado','despensa','grocery'], 1),
  (NULL, 'Transporte',    'expense', 'car',         '#F97316', ARRAY['uber','didi','taxi','gasolina','gas','metro','camion','camión','bus','transporte','estacionamiento'], 2),
  (NULL, 'Vivienda',      'expense', 'home',        '#D97706', ARRAY['renta','hipoteca','mantenimiento','predial'], 3),
  (NULL, 'Servicios',     'expense', 'zap',         '#CA8A04', ARRAY['luz','agua','gas','internet','telefono','teléfono','celular','cable','streaming','netflix','spotify','prime','youtube','hbo'], 4),
  (NULL, 'Salud',         'expense', 'heart-pulse', '#DC2626', ARRAY['doctor','medico','médico','medicina','farmacia','hospital','consulta','dentista','gym','gimnasio'], 5),
  (NULL, 'Educación',     'expense', 'book-open',   '#7C3AED', ARRAY['curso','libro','colegiatura','escuela','universidad','clase','udemy'], 6),
  (NULL, 'Ocio',          'expense', 'film',        '#EC4899', ARRAY['cine','fiesta','bar','cerveza','vino','salida','concierto','evento','juego','videojuego'], 7),
  (NULL, 'Ropa',          'expense', 'shirt',       '#BE185D', ARRAY['ropa','zapato','zapatos','camisa','pantalon','pantalón','tenis','sneaker'], 8),
  (NULL, 'Mascotas',      'expense', 'paw-print',   '#B45309', ARRAY['perro','gato','mascota','veterinario','croqueta','croquetas'], 9),
  (NULL, 'Regalos',       'expense', 'gift',        '#DB2777', ARRAY['regalo','cumpleanos','cumpleaños','boda','baby shower'], 10),
  (NULL, 'Impuestos',     'expense', 'landmark',    '#64748B', ARRAY['sat','impuesto','impuestos','iva','isr'], 11),
  (NULL, 'Deuda',         'expense', 'credit-card', '#991B1B', ARRAY['tarjeta','pago tarjeta','deuda','prestamo','préstamo','abono'], 12),
  (NULL, 'Ahorro',        'expense', 'piggy-bank',  '#0D9488', ARRAY['ahorro','meta','inversión','inversion','fondo'], 13),
  (NULL, 'Otros gastos',  'expense', 'more-horizontal','#6B7280', ARRAY['otro','varios','misc','otros'], 99);

-- SEED: frases financieras clásicas (libros / autores mainstream)
INSERT INTO public.finance_quotes (text, author, source, tag) VALUES
  ('Págate a ti primero.', 'George S. Clason', 'El hombre más rico de Babilonia', 'savings'),
  ('Los ricos compran activos; los pobres y la clase media compran pasivos que creen son activos.', 'Robert Kiyosaki', 'Padre Rico, Padre Pobre', 'invest'),
  ('Si no puedes controlar tus emociones, no puedes controlar tu dinero.', 'Warren Buffett', NULL, 'mindset'),
  ('El interés compuesto es la octava maravilla del mundo. Quien lo entiende, lo gana; quien no, lo paga.', 'Albert Einstein', NULL, 'invest'),
  ('No ahorres lo que te queda al final del mes; gasta lo que te queda después de ahorrar.', 'Warren Buffett', NULL, 'savings'),
  ('La deuda es el arma más peligrosa jamás inventada por la humanidad.', 'Dave Ramsey', 'La Transformación Total de Su Dinero', 'debt'),
  ('La libertad financiera no se consigue por la cantidad de dinero que haces, sino por la cantidad que conservas.', 'Bodo Schäfer', 'El Camino hacia la Libertad Financiera', 'savings'),
  ('Págate primero el 10% de todo lo que ganas. Que ese sea tu primer ley sagrada.', 'George S. Clason', 'El hombre más rico de Babilonia', 'savings'),
  ('Lo que importa no es lo que ganas, sino lo que te queda.', 'Robert Kiyosaki', 'Padre Rico, Padre Pobre', 'mindset'),
  ('Un presupuesto le dice a tu dinero dónde ir, en vez de preguntarle a dónde se fue.', 'Dave Ramsey', 'La Transformación Total de Su Dinero', 'budget'),
  ('Construye primero un fondo de emergencia de 1.000 dólares. Es el primer paso.', 'Dave Ramsey', 'Baby Steps', 'savings'),
  ('El dinero no se hace tiempo. El tiempo sí puede hacer dinero.', 'David Bach', 'El Millonario Automático', 'invest'),
  ('Automatiza tus finanzas: paga tus metas antes de pagarlas a mano, todos los meses.', 'David Bach', 'El Millonario Automático', 'savings'),
  ('Cada peso que gastas hoy es un peso menos que trabajará para ti mañana.', 'Vicki Robin', 'Tu Dinero o Tu Vida', 'mindset'),
  ('Pregúntate: ¿esta compra me da más vida, o me toma vida?', 'Joe Dominguez', 'Tu Dinero o Tu Vida', 'mindset'),
  ('Los ricos duermen menos por miedo a perder lo que tienen, los pobres por miedo a no llegar al mes.', 'Bodo Schäfer', 'El Camino hacia la Libertad Financiera', 'mindset'),
  ('Los hábitos financieros son más importantes que tu ingreso.', 'Thomas J. Stanley', 'El Millonario de la Puerta de al Lado', 'mindset'),
  ('La riqueza es lo que no ves. Son los autos no comprados, las joyas no adquiridas.', 'Morgan Housel', 'La Psicología del Dinero', 'mindset'),
  ('Ahorrar es la brecha entre tu ego y tu ingreso.', 'Morgan Housel', 'La Psicología del Dinero', 'savings'),
  ('No gastes para impresionar a gente que no te importa.', 'Suze Orman', NULL, 'mindset'),
  ('El peor tipo de deuda es aquella que no te deja dormir.', 'Dave Ramsey', NULL, 'debt'),
  ('Paga primero la deuda con el interés más alto: es matemática pura, no opinión.', 'Anónimo', 'Estrategia Avalanche', 'debt'),
  ('Si la emoción te puede más, paga primero la deuda más pequeña: la victoria rápida construye el hábito.', 'Dave Ramsey', 'Estrategia Snowball', 'debt'),
  ('Un presupuesto es decirle "no" a lo que no quieres hoy para decirle "sí" a lo que sí quieres mañana.', 'Anónimo', NULL, 'budget'),
  ('La primera regla: nunca pierdas dinero. La segunda: nunca olvides la primera.', 'Warren Buffett', NULL, 'invest');
