-- ============================================================
-- FINANZAS · investments (#54)
-- ============================================================
--
-- Portafolio manual de inversiones — el user registra holdings
-- (stocks, crypto, fondos, real estate, otros) con valor actual.
-- Sin precios live, sin APIs externas — el user actualiza el
-- valor cuando quiera. La idea es que cuente en Net Worth.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.finance_investments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  -- Tipo del activo. Sin enum estricto para permitir nuevos tipos
  -- sin migración (ej. "nft", "p2p", "metales").
  kind TEXT NOT NULL DEFAULT 'stock'
    CHECK (kind IN ('stock', 'etf', 'crypto', 'real_estate', 'fund', 'other')),
  -- Símbolo opcional (ticker / coin name). Ej "AAPL", "BTC", "VTI".
  symbol TEXT,
  -- Cantidad de unidades (acciones, monedas, etc). Decimal para
  -- soportar fractional shares + crypto.
  quantity NUMERIC(20, 8),
  -- Precio promedio de compra (cost basis por unidad). Opcional.
  avg_buy_price NUMERIC(20, 8),
  -- Valor actual TOTAL del holding. Snapshot manual — el user lo
  -- actualiza cuando quiera. Si quantity + price están, este puede
  -- inferirse, pero permitimos override manual (ej. real estate).
  current_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MXN',
  -- ¿Cuenta en Net Worth? Default true.
  include_in_net_worth BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  -- Última actualización del valor (manual). Diferente de updated_at
  -- que cambia con cualquier edit.
  last_priced_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_investments_user_idx
  ON public.finance_investments (user_id, is_archived, position);

CREATE TRIGGER finance_investments_updated_at
  BEFORE UPDATE ON public.finance_investments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.finance_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own investments"
  ON public.finance_investments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
