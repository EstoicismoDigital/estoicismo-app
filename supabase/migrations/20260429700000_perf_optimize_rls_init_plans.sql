-- ============================================================
-- PERFORMANCE · auth.uid() → (SELECT auth.uid()) en TODAS las policies
-- ============================================================
-- Las RLS policies que usan auth.uid() directamente lo evalúan POR
-- CADA FILA escaneada. A escala (1000+ filas) es 100-1000x más
-- lento. Wrapping en (SELECT auth.uid()) hace que Postgres lo
-- cachee como InitPlan — una sola evaluación por query.
--
-- Doc: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Aplicado dynamic — itera todas las policies en public que usen
-- auth.uid() o auth.jwt(), las dropea y las recrea con el wrap.
-- 66 policies actualizadas.
-- ============================================================

DO $$
DECLARE
  r RECORD;
  new_qual TEXT;
  new_with_check TEXT;
  using_clause TEXT;
  with_check_clause TEXT;
BEGIN
  FOR r IN (
    SELECT
      schemaname,
      tablename,
      policyname,
      cmd,
      roles,
      qual,
      with_check,
      permissive
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%'
        OR qual LIKE '%auth.jwt()%' OR with_check LIKE '%auth.jwt()%'
      )
  )
  LOOP
    new_qual := r.qual;
    new_with_check := r.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'auth.uid()', '(SELECT auth.uid())');
      new_qual := replace(new_qual, 'auth.jwt()', '(SELECT auth.jwt())');
    END IF;

    IF new_with_check IS NOT NULL THEN
      new_with_check := replace(new_with_check, 'auth.uid()', '(SELECT auth.uid())');
      new_with_check := replace(new_with_check, 'auth.jwt()', '(SELECT auth.jwt())');
    END IF;

    EXECUTE format('DROP POLICY %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);

    using_clause := CASE WHEN new_qual IS NOT NULL
      THEN ' USING (' || new_qual || ')' ELSE '' END;
    with_check_clause := CASE WHEN new_with_check IS NOT NULL
      THEN ' WITH CHECK (' || new_with_check || ')' ELSE '' END;

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s',
      r.policyname,
      r.schemaname,
      r.tablename,
      CASE WHEN r.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      r.cmd,
      array_to_string(r.roles, ', '),
      using_clause,
      with_check_clause
    );
  END LOOP;
END $$;
