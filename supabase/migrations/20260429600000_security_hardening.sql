-- ============================================================
-- SECURITY HARDENING — fix de warnings del Supabase advisor
-- ============================================================
--
-- Aplica los 3 grupos de fixes recomendados por el linter de
-- Supabase (audit 2026-04-29). Ninguno es crítico pero todos
-- son best practice y eliminan vectores de ataque conocidos.
-- ============================================================

-- ─── 1. Search path mutable ─────────────────────────────────
-- Una función SECURITY DEFINER sin search_path explícito puede
-- ser hijackeada si un atacante crea una función con el mismo
-- nombre en otro schema. Lo prevenimos seteando search_path
-- vacío y calificando los nombres de objetos con su schema.
-- ============================================================

ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.set_mindset_updated_at() SET search_path = '';

-- ─── 2. Storage buckets públicos: quitar LISTING ────────────
-- Las policies SELECT en buckets PÚBLICOS son redundantes —
-- cualquiera con la URL pública puede leer el archivo sin
-- necesidad de policy. Pero las policies SELECT amplias
-- permiten LISTAR el contenido del bucket (storage.objects.list),
-- lo cual leakea metadata (nombres de archivos = nombres de
-- libros, fotos del vision board, etc.).
--
-- Las dropeo. Los archivos siguen accesibles por URL directo
-- (lo único que la app necesita).
-- ============================================================

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "book covers public read" ON storage.objects;
DROP POLICY IF EXISTS "savings-goals public read" ON storage.objects;
DROP POLICY IF EXISTS "stoic portraits public read" ON storage.objects;
DROP POLICY IF EXISTS "vision-board public read" ON storage.objects;

-- ─── 3. SECURITY DEFINER expuesta a REST API ────────────────
-- handle_new_user y enforce_free_tier_habit_cap son TRIGGERS
-- (auth.users.AFTER INSERT y habits.BEFORE INSERT). No deben
-- ser callables como RPC desde el cliente. PostgREST expone
-- por default todas las funciones públicas; revocamos EXECUTE
-- a anon y authenticated para que no aparezcan como /rpc/...
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_free_tier_habit_cap() FROM anon, authenticated;

-- Solo postgres y service_role siguen pudiendo ejecutarlas
-- (lo cual es lo correcto porque son llamadas internas por
-- los triggers, que corren con privilegios elevados).
