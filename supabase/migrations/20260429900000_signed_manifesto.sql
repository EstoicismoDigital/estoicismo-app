-- 20260429900000_signed_manifesto.sql
-- Tabla para registrar la firma del manifiesto/declaración estoica.
-- La firma es inmutable: una vez registrada, no se puede actualizar
-- ni borrar (no policies de UPDATE/DELETE). Si el manifiesto cambia,
-- se incrementa manifesto_version y se vuelve a firmar.

CREATE TABLE IF NOT EXISTS public.user_signed_manifesto (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  signed_name TEXT NOT NULL CHECK (length(trim(signed_name)) >= 2),
  signed_place TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  manifesto_version TEXT NOT NULL DEFAULT 'v1'
);

ALTER TABLE public.user_signed_manifesto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_read_own_signature"
  ON public.user_signed_manifesto FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_can_insert_own_signature"
  ON public.user_signed_manifesto FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Sin UPDATE ni DELETE: la firma es un compromiso, no se edita.
