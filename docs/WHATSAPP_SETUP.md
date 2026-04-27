# Setup · Pegasso por WhatsApp (Twilio)

Pegasso puede recibir mensajes por WhatsApp y responderlos como en
la app web. Tiene acceso a tus datos (gastos, hábitos, MPD, etc.) y
puede proponer acciones que confirmas en la app.

Esta guía conecta tu app con **Twilio Sandbox** (gratis para
pruebas). Para producción reemplazas el sandbox con un número
WhatsApp Business aprobado por Meta.

---

## 1. Crear cuenta en Twilio

1. Ve a [twilio.com/try-twilio](https://www.twilio.com/try-twilio) y
   crea una cuenta. El trial te da $15 USD de crédito.
2. Verifica tu número de teléfono real (recibirás un SMS de
   verificación). Este es el número desde el que vas a probar.

## 2. Activar WhatsApp Sandbox

1. Ve al [WhatsApp Sandbox de Twilio](https://www.twilio.com/console/sms/whatsapp/sandbox).
2. Verás:
   - Un número de Twilio: ej. `+1 415 523 8886`
   - Un código secreto: ej. `join cosmos-orange`
3. Manda un WhatsApp **desde tu teléfono real** al número de Twilio,
   con el contenido del código secreto. Esto te une al sandbox.

## 3. Obtener credenciales

1. Ve a [twilio.com/console](https://www.twilio.com/console).
2. Copia:
   - **Account SID** (empieza con `AC...`)
   - **Auth Token**

## 4. Variables de entorno

Agrega a `apps/web/.env.local`:

```bash
# Twilio · WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Service role para que el webhook pueda resolver users por phone
# (sin esto el webhook no funciona — RLS bloquea el lookup)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Reinicia el dev server para que las variables se carguen.

## 5. Exponer el webhook (desarrollo)

Twilio necesita una URL pública para mandar los mensajes entrantes.
En desarrollo, usa **ngrok** o el túnel de Vercel CLI:

```bash
# Opción A · ngrok
ngrok http 3000
# Te da una URL como https://abc123.ngrok-free.app

# Opción B · vercel dev (si despliegas en Vercel)
vercel dev
```

## 6. Configurar webhook en Twilio

1. Vuelve al [WhatsApp Sandbox](https://www.twilio.com/console/sms/whatsapp/sandbox).
2. En **"When a message comes in"** pega:
   ```
   https://TU-URL-NGROK/api/whatsapp/webhook
   ```
3. Método: `HTTP POST`
4. Save.

## 7. Conectar tu número en la app

1. Abre la app → **/ajustes** → sección **Pegasso · WhatsApp**.
2. Pega tu número en E.164 (ej. `+525512345678`).
3. Activa la integración.

## 8. Probar

Manda al número de Twilio (`+1 415 523 8886`) un mensaje como:

> pagué 350 en sushi

Pegasso debería:
1. Crear/usar tu conversación WhatsApp en la app.
2. Responder por WhatsApp confirmando que entendió.
3. Dejar una "suggested action" pendiente en la conversación que
   verás en `/pegasso` → conversación "WhatsApp".
4. Confirmar la acción desde la app la registra como gasto real.

---

## Producción

El sandbox solo funciona con números pre-aprobados. Para producción:

1. Aplica a [WhatsApp Business API en Twilio](https://www.twilio.com/whatsapp).
2. Aprobar tu número con Meta (Business verification).
3. Cambia `TWILIO_WHATSAPP_FROM` a tu número de producción.
4. Configura el webhook al endpoint de producción
   (`https://tu-app.com/api/whatsapp/webhook`).

## Troubleshooting

**No me responde Pegasso** → Verifica:
- Variables `TWILIO_*` en `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` configurada
- Tu phone en `/ajustes` está en E.164 con `+`
- `whatsapp_enabled = true`
- Webhook URL en Twilio Console responde 200 al hacer POST

**Logs del webhook**:
- En desarrollo: terminal de `pnpm dev:web`
- En producción Vercel: Functions logs en el dashboard

**Mensajes no se guardan** → Probablemente service role key falta.
Sin ella, RLS bloquea las INSERTs porque el webhook no tiene
session de auth.
