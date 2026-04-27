-- ============================================================
-- PEGASSO · suggested actions metadata
-- ============================================================
--
-- Cada mensaje del assistant puede llevar acciones sugeridas
-- (ej. "crear transacción de $50 en café") que el user confirma
-- o descarta con un click. La metadata se guarda en JSONB.
--
-- Forma esperada:
-- metadata = {
--   "suggested_actions": [
--     {
--       "id": "uuid",
--       "kind": "create_transaction" | "create_habit" | "create_journal_entry" | "create_business_idea",
--       "payload": { ... datos del nuevo registro ... },
--       "summary": "string corto para mostrar en la card",
--       "status": "pending" | "confirmed" | "cancelled",
--       "result_id": "uuid del registro creado (solo si confirmed)",
--       "result_at": "timestamp"
--     }
--   ]
-- }
-- ============================================================

ALTER TABLE public.pegasso_messages
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS pegasso_messages_actions_idx
  ON public.pegasso_messages USING GIN (metadata)
  WHERE metadata IS NOT NULL;
