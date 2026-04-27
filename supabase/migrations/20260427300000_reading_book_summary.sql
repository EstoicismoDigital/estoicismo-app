-- ============================================================
-- LECTURA · my_summary en reading_books
-- ============================================================
--
-- El campo `notes` existente queda para quotes y scratch.
-- `my_summary` es específicamente la VISIÓN GLOBAL del usuario
-- sobre el libro entero — su take, lo que se lleva del libro.
--
-- Diferencia clave con reading_sessions.summary:
--   - reading_sessions.summary = resumen DE UNA SESIÓN
--   - reading_books.my_summary = resumen DEL LIBRO COMPLETO
-- ============================================================

ALTER TABLE public.reading_books
  ADD COLUMN IF NOT EXISTS my_summary TEXT;
