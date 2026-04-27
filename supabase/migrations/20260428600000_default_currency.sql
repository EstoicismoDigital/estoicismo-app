-- ============================================================
-- PROFILES · default currency
-- ============================================================
--
-- Selector de moneda global. Cada user tiene una moneda preferida
-- que se usa como default al crear cuentas, transacciones, ventas,
-- inversiones, etc. Si no se setea, fallback a "MXN".
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_currency TEXT NOT NULL DEFAULT 'MXN';
