# Auth Setup — Estoicismo Digital

Guía paso a paso para activar **Email (Resend)**, **Google OAuth**, **Apple OAuth** y **Phone (SMS)** en producción.

> Proyecto Supabase: `tezcxsgpqcsuopyajptl` (estoicismo-digital)
> Dominio público: `https://app.estoicismodigital.com`

---

## 0. URLs canónicas que vas a necesitar

Memoriza estas dos URLs — las pegas en cada proveedor:

- **Site URL:** `https://app.estoicismodigital.com`
- **Redirect URL (la que esperan los proveedores OAuth):**
  `https://tezcxsgpqcsuopyajptl.supabase.co/auth/v1/callback`

> Supabase recibe el callback del proveedor, intercambia el code, y luego redirige a tu app a `https://app.estoicismodigital.com/auth/callback`, que es el route handler que ya creamos en [`apps/web/app/auth/callback/route.ts`](../apps/web/app/auth/callback/route.ts).

En el dashboard de Supabase → **Authentication → URL Configuration**, agrega:

```
Site URL:
  https://app.estoicismodigital.com

Redirect URLs (uno por línea):
  https://app.estoicismodigital.com/auth/callback
  http://localhost:3000/auth/callback
  http://127.0.0.1:3000/auth/callback
```

---

## 1. Resend (email transaccional)

Esto reemplaza el SMTP por defecto de Supabase (que tiene límite de 4 emails/hora) por Resend.

### 1.1 Verifica el dominio en Resend
1. Entra a [resend.com/domains](https://resend.com/domains).
2. **Add domain** → `estoicismodigital.com`.
3. Agrega los registros DNS que te muestre (SPF, DKIM, DMARC) en tu proveedor de DNS.
4. Espera a que el dominio quede `Verified` (suele ser 5–30 min).

### 1.2 Crea una API key con scope SMTP
1. [resend.com/api-keys](https://resend.com/api-keys) → **Create API key**.
2. Permission: **Sending access** → solo `estoicismodigital.com`.
3. **Copia la key una sola vez** (`re_...`).

> ⚠️ La key que pegaste en chat (`re_FzGp5ay3_...`) está comprometida. **Revócala** en `resend.com/api-keys` y genera una nueva.

### 1.3 Conecta Resend a Supabase Auth (SMTP)
Supabase Dashboard → **Project Settings → Authentication → SMTP Settings**:

| Campo | Valor |
|---|---|
| Enable Custom SMTP | ✅ |
| Sender email | `noreply@estoicismodigital.com` |
| Sender name | `Estoicismo Digital` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | tu API key `re_...` |
| Min. interval between emails | `60` (segundos) |

Guardar y enviar test email. Si llega, listo.

### 1.4 Personaliza los templates (opcional)
**Authentication → Email Templates** — edita "Confirm signup", "Reset password", "Magic Link" y "Change email". Asegúrate de que el `{{ .ConfirmationURL }}` apunte al callback correcto (Supabase lo arma solo).

---

## 2. Google OAuth

### 2.1 Google Cloud Console
1. Entra a [console.cloud.google.com](https://console.cloud.google.com/).
2. Crea proyecto: **Estoicismo Digital** (o reusa uno).
3. **APIs & Services → OAuth consent screen**:
   - User Type: **External**
   - App name: `Estoicismo Digital`
   - User support email: `contacto@estoicismodigital.com`
   - App domain: `estoicismodigital.com`
   - Authorized domains: `estoicismodigital.com` y `supabase.co`
   - Scopes: `email`, `profile`, `openid`
   - Test users: agrega tu email mientras esté en modo Testing
4. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `Supabase Auth`
   - Authorized JavaScript origins:
     - `https://app.estoicismodigital.com`
     - `https://tezcxsgpqcsuopyajptl.supabase.co`
   - Authorized redirect URIs:
     - `https://tezcxsgpqcsuopyajptl.supabase.co/auth/v1/callback`
5. **Crear** → copia **Client ID** y **Client secret**.

### 2.2 Pega en Supabase
Dashboard → **Authentication → Providers → Google**:
- Enabled: ✅
- Client ID for OAuth: pega
- Client Secret for OAuth: pega
- Skip nonce check: ❌
- Save.

### 2.3 Publica la OAuth consent screen
Cuando salgas de "Testing": **OAuth consent screen → Publish App**. Si pides scopes sensibles te toca verificación de Google (no es tu caso con `email`/`profile`).

---

## 3. Apple OAuth

> Requiere **Apple Developer Program** ($99 USD/año). Si todavía no lo tienes, salta a la sección 4 y vuelves después.

### 3.1 En el Apple Developer Portal
1. [developer.apple.com/account/resources/identifiers/list](https://developer.apple.com/account/resources/identifiers/list) → **+** → **App IDs** (o usa uno existente).
   - Description: `Estoicismo Digital`
   - Bundle ID: `com.estoicismodigital.app` (o el que uses en Expo)
   - Capabilities: marca **Sign In with Apple**.
2. **Identifiers → + → Services IDs**:
   - Description: `Estoicismo Digital Web`
   - Identifier: `com.estoicismodigital.web` (este es tu **Client ID**)
   - Marca **Sign In with Apple → Configure**:
     - Primary App ID: el del paso 1
     - Domains: `tezcxsgpqcsuopyajptl.supabase.co`
     - Return URLs: `https://tezcxsgpqcsuopyajptl.supabase.co/auth/v1/callback`
3. **Keys → + → Sign in with Apple**:
   - Key Name: `Supabase Auth Key`
   - Configure → Primary App ID
   - Continue → Register → **descarga el `.p8`** (solo se baja una vez).
   - Anota: **Key ID** (10 caracteres) y **Team ID** (arriba a la derecha).

### 3.2 Genera el Client Secret JWT
Apple no te da un client secret estable; tienes que firmar un JWT con la `.p8`. Dura máximo 6 meses.

Opción rápida (script Node):

```js
// scripts/apple-secret.mjs
import jwt from "jsonwebtoken";
import fs from "node:fs";

const TEAM_ID = "XXXXXXXXXX";
const KEY_ID = "YYYYYYYYYY";
const CLIENT_ID = "com.estoicismodigital.web";
const PRIVATE_KEY = fs.readFileSync("./AuthKey_YYYYYYYYYY.p8", "utf8");

const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180,
    aud: "https://appleid.apple.com",
    sub: CLIENT_ID,
  },
  PRIVATE_KEY,
  { algorithm: "ES256", keyid: KEY_ID }
);

console.log(token);
```

```bash
pnpm add -D jsonwebtoken
node scripts/apple-secret.mjs
```

### 3.3 Pega en Supabase
Dashboard → **Authentication → Providers → Apple**:
- Enabled: ✅
- Client ID: `com.estoicismodigital.web`
- Secret Key: el JWT generado
- Save.

> 📌 Recordatorio: vence cada 6 meses. Pon en el calendario regenerar el JWT.

---

## 4. Phone (SMS) — Twilio

Supabase no envía SMS por sí solo, necesita un proveedor. Twilio es el más estable.

### 4.1 Twilio
1. [console.twilio.com](https://console.twilio.com/) → cuenta nueva.
2. Compra un número (USA ~$1/mes) o crea un **Messaging Service**:
   - **Messaging → Services → Create Messaging Service** → asigna el número.
3. Anota: **Account SID**, **Auth Token**, **Messaging Service SID**.

### 4.2 Pega en Supabase
Dashboard → **Authentication → Providers → Phone**:
- Phone provider: ✅ Twilio
- Twilio Account SID
- Twilio Auth Token
- Twilio Message Service SID
- SMS template:
  ```
  Tu código de Estoicismo Digital es {{ .Code }}
  ```
- Save.

> 💸 Costo aproximado: $0.0075–$0.05 USD por SMS según país. Define rate limits (Auth → Rate Limits) para no quemar saldo.

### 4.3 Verifica
Pruébalo desde `app.estoicismodigital.com/sign-in` → tab **TELÉFONO** → tu número con código de país (`+57...`).

---

## 5. Variables de entorno en Vercel

Estas las pones en `vercel.com/<tu-proyecto>/settings/environment-variables`. **No** van en `.env.local` de producción.

| Variable | Scope | Valor |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | `https://tezcxsgpqcsuopyajptl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | (de Supabase → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | (de Supabase → API, **NUNCA** Public) |

> Las creds de Resend / Google / Apple / Twilio NO van en Vercel. Viven dentro de Supabase Auth porque Supabase es quien manda los emails y SMS.

---

## 6. Checklist final

Marca cada paso a medida que lo completas:

- [ ] Resend dominio verificado
- [ ] API key Resend (la nueva, no la del chat) pegada en Supabase SMTP
- [ ] Test email enviado y recibido
- [ ] Google Cloud OAuth client creado
- [ ] Google client ID + secret pegados en Supabase
- [ ] Apple Services ID + JWT pegados en Supabase (si aplica)
- [ ] Twilio cuenta + Messaging Service creados
- [ ] Twilio creds pegados en Supabase
- [ ] Vercel: env vars configuradas
- [ ] Probado: signup con email → llega correo de confirmación
- [ ] Probado: login con Google
- [ ] Probado: login con Apple
- [ ] Probado: login con SMS
- [ ] Site URL y Redirect URLs configurados en Supabase

---

## 7. Troubleshooting

**"redirect_uri_mismatch" en Google**
→ La URL en Google Cloud no coincide con la que Supabase envía. Asegúrate de que sea exactamente `https://tezcxsgpqcsuopyajptl.supabase.co/auth/v1/callback` (sin slash al final).

**"invalid_client" en Apple**
→ JWT vencido (>6 meses) o Key ID/Team ID mal escritos. Regenera el JWT.

**SMS no llega**
→ Revisa logs en Twilio Console → Messaging → Logs. Causas comunes: número sin código de país, Messaging Service sin número asignado, saldo insuficiente.

**Email no llega**
→ Revisa Supabase Dashboard → Logs → Auth Logs. Si dice "rate_limit_exceeded": Resend está activo pero sin verificar dominio. Si dice "smtp_send_failed": revisa credenciales SMTP.

**Usuario quedó "logueado" pero sin sesión**
→ Cookies del callback no se setearon. Verifica que `apps/web/middleware.ts` tenga `/auth/callback` en `PUBLIC_PATHS` (ya está) y que el dominio del cookie coincida con el del browser.
