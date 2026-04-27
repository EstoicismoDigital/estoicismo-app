-- ============================================================
-- FINANZAS · recurring + subscriptions + accounts + bill reminders
-- ============================================================
--
-- 4 features de finanzas en una sola migración:
--
-- 1. finance_accounts — cuentas (efectivo, banco, ahorros, etc).
--    Las transactions ya existentes pueden referenciar una cuenta.
-- 2. finance_recurring — plantilla de transacción recurrente
--    (renta, salario). El cliente computa próximas ocurrencias y
--    permite "materializar" como una transaction concreta.
-- 3. finance_subscriptions — caso especial: streaming, software,
--    membresías. Tiene renewal_day, monto, vendor, status.
-- 4. finance_debts.due_date — tabla existente ya tiene due_day,
--    sin cambios. Recordatorios se calculan en cliente.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- ACCOUNTS — cuentas del usuario
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.finance_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  -- "cash" | "checking" | "savings" | "investment" | "other"
  kind TEXT NOT NULL DEFAULT 'cash'
    CHECK (kind IN ('cash','checking','savings','investment','crypto','other')),
  -- Balance "manual" — el usuario lo edita; no se calcula auto desde
  -- transactions porque eso requeriría reconciliación que no queremos hacer.
  current_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MXN',
  color TEXT NOT NULL DEFAULT '#22774E',
  icon TEXT NOT NULL DEFAULT 'wallet',
  -- Si el balance cuenta para "net worth" (las inversiones sí, deudas no
  -- viven aquí — ya hay finance_debts).
  include_in_net_worth BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_accounts_user_idx
  ON public.finance_accounts (user_id, is_archived);

CREATE TRIGGER finance_accounts_updated_at
  BEFORE UPDATE ON public.finance_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own accounts"
  ON public.finance_accounts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Añade account_id a transactions (opcional). Sin FK estricta a la
-- account porque queremos permitir borrar cuentas sin cascadear.
ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.finance_accounts(id) ON DELETE SET NULL;

-- ──────────────────────────────────────────────────────────────
-- RECURRING TRANSACTIONS — plantilla recurrente
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.finance_recurring (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Mismos campos que una transaction normal
  name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.finance_accounts(id) ON DELETE SET NULL,
  -- Cadencia: 'weekly','biweekly','monthly','yearly'.
  cadence TEXT NOT NULL DEFAULT 'monthly'
    CHECK (cadence IN ('weekly','biweekly','monthly','yearly')),
  -- Día del mes (1-31) cuando cadence=monthly. Para weekly/biweekly,
  -- es el día de la semana (0=domingo, 6=sábado). Para yearly, es
  -- el día del año (1-365).
  day_of_period SMALLINT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  -- Si está activo (paused = no genera próximas).
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_recurring_user_idx
  ON public.finance_recurring (user_id, is_active);

CREATE TRIGGER finance_recurring_updated_at
  BEFORE UPDATE ON public.finance_recurring
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.finance_recurring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recurring"
  ON public.finance_recurring FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cuando una transaction se "materializa" desde un recurring, queda
-- linkeada para auditoría.
ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS recurring_id UUID REFERENCES public.finance_recurring(id) ON DELETE SET NULL;

-- ──────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS — caso especial de gastos recurrentes
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.finance_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  -- "Netflix", "Spotify", etc. NULL = ningún match conocido.
  vendor TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  cadence TEXT NOT NULL DEFAULT 'monthly'
    CHECK (cadence IN ('monthly','quarterly','yearly')),
  renewal_day SMALLINT NOT NULL CHECK (renewal_day >= 1 AND renewal_day <= 31),
  -- Categoría a aplicar cuando se materializa como tx.
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  -- Estado del usuario respecto al servicio.
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','cancelled','trial')),
  trial_ends_on DATE,
  -- Notas opcionales — qué cancelar, cómo cancelar.
  notes TEXT,
  -- URL del servicio para fácil acceso a cancelar.
  service_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_subscriptions_user_idx
  ON public.finance_subscriptions (user_id, status);

CREATE TRIGGER finance_subscriptions_updated_at
  BEFORE UPDATE ON public.finance_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.finance_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions"
  ON public.finance_subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
