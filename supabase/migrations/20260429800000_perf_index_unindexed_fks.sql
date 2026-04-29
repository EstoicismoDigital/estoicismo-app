-- ============================================================
-- PERFORMANCE · índices para FKs sin cobertura
-- ============================================================
-- Cada FK sin índice causa que JOINs y CASCADE deletes hagan
-- full table scan en la tabla referenciante. Los índices son
-- trade-off entre velocidad de read (mejor) y velocidad de
-- write (peor por overhead), pero para FKs casi siempre vale
-- la pena.
--
-- 14 índices creados — uno por cada FK detectada por el
-- Supabase advisor.
-- ============================================================

CREATE INDEX IF NOT EXISTS budgets_category_idx
  ON public.budgets (category_id);

CREATE INDEX IF NOT EXISTS business_sales_transaction_idx
  ON public.business_sales (transaction_id);

CREATE INDEX IF NOT EXISTS finance_debt_payments_transaction_idx
  ON public.finance_debt_payments (transaction_id);

CREATE INDEX IF NOT EXISTS finance_debts_credit_card_idx
  ON public.finance_debts (credit_card_id);

CREATE INDEX IF NOT EXISTS finance_recurring_account_idx
  ON public.finance_recurring (account_id);

CREATE INDEX IF NOT EXISTS finance_recurring_category_idx
  ON public.finance_recurring (category_id);

CREATE INDEX IF NOT EXISTS finance_subscriptions_category_idx
  ON public.finance_subscriptions (category_id);

CREATE INDEX IF NOT EXISTS finance_transactions_account_idx
  ON public.finance_transactions (account_id);

CREATE INDEX IF NOT EXISTS finance_transactions_category_idx
  ON public.finance_transactions (category_id);

CREATE INDEX IF NOT EXISTS finance_transactions_recurring_idx
  ON public.finance_transactions (recurring_id);

CREATE INDEX IF NOT EXISTS finance_transactions_credit_card_idx
  ON public.finance_transactions (credit_card_id);

CREATE INDEX IF NOT EXISTS fitness_workout_sets_exercise_idx
  ON public.fitness_workout_sets (exercise_id);

CREATE INDEX IF NOT EXISTS habit_logs_user_idx
  ON public.habit_logs (user_id);

CREATE INDEX IF NOT EXISTS savings_contributions_transaction_idx
  ON public.savings_contributions (transaction_id);
