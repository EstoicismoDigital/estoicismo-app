-- ============================================================
-- STORAGE · stoic-portraits bucket
-- ============================================================
--
-- Bucket público para los retratos de los estoicos que aparecen
-- en el ModuleGridNav de /hoy. NO es por-user (el contenido es
-- compartido); cualquier authenticated puede subir, pero por
-- convención solo el admin sube las 4 imágenes.
--
-- Files esperados (slug fijo):
--   - epicteto.jpg
--   - marco-aurelio.jpg
--   - seneca.jpg
--   - porcia.jpg
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stoic-portraits',
  'stoic-portraits',
  TRUE,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "stoic portraits public read" ON storage.objects;
CREATE POLICY "stoic portraits public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stoic-portraits');

DROP POLICY IF EXISTS "stoic portraits authenticated upsert" ON storage.objects;
CREATE POLICY "stoic portraits authenticated upsert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'stoic-portraits');

DROP POLICY IF EXISTS "stoic portraits authenticated update" ON storage.objects;
CREATE POLICY "stoic portraits authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'stoic-portraits');

DROP POLICY IF EXISTS "stoic portraits authenticated delete" ON storage.objects;
CREATE POLICY "stoic portraits authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'stoic-portraits');
