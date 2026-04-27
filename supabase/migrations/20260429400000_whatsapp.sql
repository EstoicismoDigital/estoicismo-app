-- ============================================================
-- WHATSAPP · phone + channel
-- ============================================================
--
-- Permite al user conectar su WhatsApp con Pegasso. Mensajes que
-- envíe a Twilio se enrutean a Pegasso → registro automático.
--
-- Modelo:
--   - profiles.phone_e164: el número del user en formato E.164
--     (ej. "+525512345678"). Único — no dos users con el mismo.
--   - profiles.whatsapp_enabled: bandera para activar/pausar sin
--     borrar el número.
--   - pegasso_conversations.channel: "web" (default) o "whatsapp".
--     Cada user tiene UNA conversación whatsapp activa que es donde
--     se acumulan los mensajes vienen del bot.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_e164_uq
  ON public.profiles (phone_e164)
  WHERE phone_e164 IS NOT NULL;

ALTER TABLE public.pegasso_conversations
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web';

ALTER TABLE public.pegasso_conversations
  DROP CONSTRAINT IF EXISTS pegasso_conv_channel_check;
ALTER TABLE public.pegasso_conversations
  ADD CONSTRAINT pegasso_conv_channel_check
  CHECK (channel IN ('web', 'whatsapp'));

CREATE INDEX IF NOT EXISTS pegasso_conv_channel_idx
  ON public.pegasso_conversations (user_id, channel);
