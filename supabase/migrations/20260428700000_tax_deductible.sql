-- ============================================================
-- FINANZAS · tax_deductible flag (#55)
-- ============================================================
--
-- Marca transacciones que cuentan para deducir impuestos. El user
-- las ve agrupadas en /finanzas/impuestos para preparar declaración.
-- ============================================================

ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS tax_deductible BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS finance_tx_tax_idx
  ON public.finance_transactions (user_id, occurred_on DESC)
  WHERE tax_deductible = TRUE;
