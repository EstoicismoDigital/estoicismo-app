-- ============================================================
-- NEGOCIO · client pipeline status (#93)
-- ============================================================
--
-- Convierte business_clients en mini-CRM agregando un status:
--   lead → contactado → cliente → recurrente / perdido
--
-- El user los ve agrupados como kanban simple en /emprendimiento.
-- ============================================================

ALTER TABLE public.business_clients
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'cliente';

-- Constraint chequeada en SQL para evitar typos
ALTER TABLE public.business_clients
  DROP CONSTRAINT IF EXISTS business_clients_status_check;
ALTER TABLE public.business_clients
  ADD CONSTRAINT business_clients_status_check
  CHECK (status IN ('lead', 'contactado', 'cliente', 'recurrente', 'perdido'));

CREATE INDEX IF NOT EXISTS business_clients_status_idx
  ON public.business_clients (user_id, status);
