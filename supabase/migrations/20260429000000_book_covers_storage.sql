-- ============================================================
-- STORAGE · book covers (#16)
-- ============================================================
--
-- Bucket público para portadas de libros. Cada user solo puede
-- subir/borrar sus propios archivos (folder = user_id).
--
-- Path convention: book-covers/<user_id>/<book_id>-<random>.<ext>
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  TRUE,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]::TEXT[]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policies: users manage objects in their own folder
DROP POLICY IF EXISTS "book covers public read" ON storage.objects;
CREATE POLICY "book covers public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "book covers user upload" ON storage.objects;
CREATE POLICY "book covers user upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'book-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "book covers user update" ON storage.objects;
CREATE POLICY "book covers user update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'book-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "book covers user delete" ON storage.objects;
CREATE POLICY "book covers user delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'book-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
