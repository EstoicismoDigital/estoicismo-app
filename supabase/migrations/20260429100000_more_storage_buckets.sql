-- ============================================================
-- STORAGE · más buckets para reducir fricción de URLs (#16)
-- ============================================================
--
-- Cada bucket es público, con RLS que solo permite al user CRUD en
-- su propio folder (folder = user_id). Mismo patrón que book-covers.
-- ============================================================

-- 1. Avatares (foto de perfil del user)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Vision board (imágenes de metas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vision-board',
  'vision-board',
  TRUE,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Savings goals (foto motivacional de meta de ahorro)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'savings-goals',
  'savings-goals',
  TRUE,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policies — mismo patrón para los 3 buckets
DO $$
DECLARE
  bucket_id TEXT;
BEGIN
  FOREACH bucket_id IN ARRAY ARRAY['avatars', 'vision-board', 'savings-goals']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', bucket_id || ' public read');
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)',
      bucket_id || ' public read',
      bucket_id
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', bucket_id || ' user upload');
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)',
      bucket_id || ' user upload',
      bucket_id
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', bucket_id || ' user update');
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)',
      bucket_id || ' user update',
      bucket_id
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', bucket_id || ' user delete');
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)',
      bucket_id || ' user delete',
      bucket_id
    );
  END LOOP;
END $$;
