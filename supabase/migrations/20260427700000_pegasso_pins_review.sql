-- ============================================================
-- PEGASSO · pinned insights + weekly review state
-- ============================================================
--
-- 1) Permite que el user "fije" un mensaje del assistant como un
--    insight reusable. UI muestra una página /pegasso/insights con
--    la lista, y botón pin en cada bubble.
--
-- 2) Marca conversaciones de tipo "weekly_review" para distinguirlas
--    en la UI (badge, no eliminables sin confirmacion).
-- ============================================================

ALTER TABLE public.pegasso_messages
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- Index para "todos los pinned del user", evita scan completo.
CREATE INDEX IF NOT EXISTS pegasso_messages_pinned_idx
  ON public.pegasso_messages (user_id, pinned_at DESC)
  WHERE is_pinned = TRUE;

ALTER TABLE public.pegasso_conversations
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'standard'
    CHECK (kind IN ('standard','weekly_review','onboarding'));
