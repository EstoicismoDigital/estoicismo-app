-- ============================================================
-- HABITS · graduate (#40)
-- ============================================================
--
-- Distinción semántica entre "archivar" (lo escondo) y "graduar"
-- (lo dominé — lo retiro porque ya es parte de mí).
--
-- graduated_at no-null ⇒ el hábito fue graduado. is_archived sigue
-- siendo true para mantener compatibilidad con el filtro existente
-- ("activos" excluye archivados Y graduados).
-- ============================================================

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS graduated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS habits_graduated_idx
  ON public.habits (user_id, graduated_at DESC)
  WHERE graduated_at IS NOT NULL;
