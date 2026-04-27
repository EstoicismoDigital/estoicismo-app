-- ============================================================
-- PROFILES · onboarding flag (#10)
-- ============================================================
--
-- Marca si el user completó el tour inicial. Si false, /hoy muestra
-- el OnboardingTour modal y le ayudamos a setear lo básico:
-- moneda, timezone, opcionalmente un primer hábito y MPD seed.
--
-- Default true para usuarios existentes (no queremos forzarles el
-- tour); el trigger de creación de profile pone false en nuevos.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT TRUE;

-- Para futuros profiles (nuevo signup) → false, para que vean el tour
ALTER TABLE public.profiles
  ALTER COLUMN onboarding_completed SET DEFAULT FALSE;

-- Pero los existentes ya están en TRUE por el primer ALTER. Nada que hacer.
