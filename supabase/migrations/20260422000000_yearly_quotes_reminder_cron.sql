-- yearly_quotes_reminder_cron
--
-- Programa un recordatorio anual al 30 de diciembre que invoca la edge
-- function `yearly-quotes-reminder`. La función envía un correo a
-- contacto@estoicismodigital.com avisando que hay que actualizar los
-- 365 × 3 catálogos de frases antes del 31 de diciembre.
--
-- Dependencias:
--   · pg_cron  — scheduler dentro de Postgres. Supabase lo expone desde
--                el schema `cron`. Habilita desde Dashboard → Database
--                → Extensions si no está activo.
--   · pg_net   — HTTP client desde SQL. Requerido para disparar la
--                edge function (que vive fuera del DB).
--
-- Secrets requeridos (NO en este archivo, se configuran en Vault):
--   · app.settings.project_url      — https://<ref>.supabase.co
--   · app.settings.service_role_key — service_role JWT del proyecto
--
-- Para configurar los secrets desde psql / SQL Editor:
--   SELECT vault.create_secret('<service_role_jwt>', 'service_role_key');
--   SELECT vault.create_secret('https://<ref>.supabase.co', 'project_url');
--
-- Alternativa sin Vault (si el proyecto no tiene Vault habilitado):
--   reemplaza las llamadas a `vault.secrets` por literales directos
--   abajo — pero entonces MUEVE ESTA MIGRACIÓN a un archivo .local.sql
--   que NO se commitee al repo (el service_role_key no debe vivir en git).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Si ya existe un job con el mismo nombre, lo desprogramamos antes de
-- volver a crearlo — hace la migración idempotente.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'yearly-quotes-reminder') then
    perform cron.unschedule('yearly-quotes-reminder');
  end if;
end
$$;

-- Cron expression: `0 9 30 12 *` = 09:00 UTC del 30 de diciembre, todos los años.
-- (Ajusta la hora si prefieres hora local — Supabase corre en UTC.)
select cron.schedule(
  'yearly-quotes-reminder',
  '0 9 30 12 *',
  $cmd$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/yearly-quotes-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := jsonb_build_object('source', 'pg_cron', 'scheduled', 'yearly')
    );
  $cmd$
);

-- Verificación: lista los jobs programados.
-- Ejecútalo manualmente después del deploy para confirmar:
--   select * from cron.job where jobname = 'yearly-quotes-reminder';
--
-- Para probar manualmente sin esperar al 30-dic:
--   select net.http_post(
--     url := 'https://<ref>.supabase.co/functions/v1/yearly-quotes-reminder',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <service_role_key>'
--     )
--   );
