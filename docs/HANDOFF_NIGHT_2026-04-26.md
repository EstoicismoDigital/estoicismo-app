# Handoff — Sesión nocturna 2026-04-26

## TL;DR

2 módulos nuevos: **Emprendimiento** y **Pegasso** (chat IA estoica). 11 archivos nuevos, 1 migración SQL, 195/195 tests pasan, 21 rutas HTTP 200.

```
EMPRENDIMIENTO  → /emprendimiento (brainstorm + negocio activo en una sola página)
PEGASSO         → /pegasso (chat con Claude vía Anthropic API)
```

## Acción REQUERIDA antes de probar

### 1. Aplicar migración SQL nueva

```bash
cd "APP ESTOICISMO/estoicismo-app"
supabase db push
# O pegar manualmente:
# supabase/migrations/20260426000000_emprendimiento_pegasso.sql
```

8 tablas nuevas: business_profile, business_products, business_clients, business_tasks, business_ideas, business_sales, pegasso_conversations, pegasso_messages.

### 2. Configurar la API key de Anthropic para Pegasso

**Sin esta key, /pegasso te muestra un error claro y no envía mensajes.**

```bash
# En apps/web/.env.local (nuevo archivo o existente):
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." >> apps/web/.env.local
```

Obtén la key en https://console.anthropic.com/settings/keys (cuenta personal o de equipo). Con el plan free de Anthropic tienes ~$5 USD de crédito; cada mensaje consume ~500-2,000 tokens dependiendo del largo. Sonnet 4.5 cuesta ~$3 por millón de input tokens.

**Reinicia el dev server después de añadir la key**:

```bash
# Mata si está corriendo
lsof -i :3000 | awk 'NR>1{print $2}' | xargs kill 2>/dev/null
# Relanza
pnpm dev:web
```

## Lo que entregué

### Módulo Emprendimiento (`/emprendimiento`)

Una sola página ramificada según `business_profile.status`:

| Status | Qué muestra |
|---|---|
| `exploring` | Wizard de brainstorm (4 pasos) + ideas guardadas |
| `starting` | Brainstorm + dashboard activo (transición) |
| `active` | Productos · Clientes · Tareas · Ventas + KPIs del mes |
| `paused` | Card simple invitando a reactivar |

**Brainstorm wizard**: 4 preguntas cortas (pasiones → habilidades → presupuesto → tiempo) → top 6 ideas matchadas. 17 ideas curadas con score, "por qué fácil" y "riesgos". Cada idea guardable con un click en `business_ideas`.

**Dashboard activo**:
- KPIs: total mes, # ventas, ticket promedio
- CRUD inline súper rápido para productos, clientes, tareas
- Modal de venta con auto-link a `finance_transactions` ingreso (sin doble entrada)
- Lista de últimas 8 ventas con producto + cliente

**ProfileCard**: editable, incluye campo `purpose_link` para amarrar el negocio al MPD del módulo Mentalidad — texto libre, no FK, para que el user pueda copiarlo o referenciarlo.

### Módulo Pegasso (`/pegasso`)

Chat con Claude (`@anthropic-ai/sdk`).

**Backend**: `app/api/pegasso/chat/route.ts`
- POST con `{ conversation_id, model? }`
- Carga historial de la conversación (RLS aplica)
- Llama `client.messages.stream(...)` con system prompt estoico
- Responde con SSE: eventos `text` / `done` / `error`
- Persiste el assistant message con tokens al terminar
- Si la API falla, persiste mensaje con campo `error` para que el histórico quede consistente
- Auth vía Supabase server client → 401 si no hay sesión

**Frontend**: `app/(dashboard)/pegasso/PegassoClient.tsx`
- Sidebar con conversaciones (auto-titulación al primer mensaje)
- Mensajes en bubbles con cursor parpadeante mientras streamea
- 6 starter prompts en el onboarding ("Tengo miedo al futuro", "Llevo días sin energía"...)
- Disclaimer al pie del input: "Pegasso no es terapeuta — si necesitas ayuda profesional, búscala"

**System prompt** (en `lib/pegasso/system-prompt.ts`):
- Identidad: consejero estoico amigable + sabiduría moderna (Dispenza, Hill, Schäfer, Housel)
- Tono: español neutro, frases cortas, sin emojis ni jerga corporativa
- Reglas claras de qué NO hace: no diagnostica, no da consejos legales/financieros específicos, no moraliza
- Conoce los módulos de la app pero no es un FAQ
- 80+ líneas calibradas — léelo si quieres ajustar el tono

**Modelo default**: `claude-sonnet-4-5`. Configurable a Haiku (más barato, más rápido) o Opus (más caro, más profundo) por mensaje desde el frontend.

### Acceso global a Pegasso

Botón flotante con icono ✨ en la barra superior (desktop y mobile), siempre visible. No vive dentro de un módulo específico — es un asistente que te acompaña en toda la app.

## Commits del trabajo (sobre `main`)

```
a40ab9b feat(nav+tests): AppShell con Negocio + acceso global a Pegasso
ed1f0e7 feat(pegasso): chat con consejero estoico (Claude vía Anthropic SDK)
ad2f9d8 feat(emprendimiento): mini-negocio + brainstorm wizard
6cb6049 feat(libs): hooks + brainstorm engine + Pegasso system prompt
4f3418f feat(db): schema para Emprendimiento y Pegasso
```

(commits de la sesión anterior siguen ahí — Fitness, Lectura, Ahorro, etc.)

## Tests

195/195 pasan, incluyendo 11 nuevos para `business/brainstorm`:

```bash
cd apps/web && pnpm test
```

## Rutas verificadas (HTTP 200)

`/sign-in /  /habitos/fitness  /habitos/lectura  /finanzas  /finanzas/ahorro  /finanzas/presupuestos  /finanzas/deudas  /finanzas/tarjetas  /finanzas/calendario  /reflexiones  /reflexiones/meditacion  /reflexiones/aura  /emprendimiento  /pegasso  /progreso  /calendario  /historial  /notas  /revision  /ajustes`

## Decisiones de diseño

1. **Emprendimiento sin saturar**: cero tablas de inventario, cero facturación electrónica, cero pipeline de ventas. Es para alguien que vende cosas o presta un servicio — no para PyMEs.

2. **Brainstorm con ideas curadas, no IA**: 17 templates con tags semánticos. El motor matchea por score (pasión + skill + budget + tiempo). Razones humanas explican el match. Ventaja vs IA: cero costo, instantáneo, los riesgos y consejos vienen revisados por mí.

3. **Pegasso como módulo top-level + acceso global**: cualquier persona en cualquier pantalla puede pulsar el icono ✨ y abrir un chat. La conversación se persiste sin TTL (rotaciones futuras requieren job manual).

4. **System prompt importable**: no está hardcodeado en el endpoint sino en `lib/pegasso/system-prompt.ts`. Edítalo cuando quieras ajustar el tono — el siguiente mensaje ya usa la nueva versión sin redeploy.

5. **Streaming SSE en vez de WebSocket**: SSE es one-way, suficiente para chat (el user no manda data mientras Pegasso responde). Reduce complejidad de infra.

6. **Modelo default Sonnet 4.5**: balance calidad/precio. Si quieres reducir gasto, cambia `PEGASSO_DEFAULT_MODEL` a `"haiku"` en `lib/pegasso/system-prompt.ts`.

7. **No hay rate limit en Pegasso**: confiamos en RLS + cuota de Anthropic. Si más de un user abusa, hay que añadir middleware con cuota por user-id.

## Lo que NO se hizo (pendiente para otra sesión)

- **Edición / regeneración de mensajes**: actualmente se mandan y se quedan. Para editar tu pregunta y re-generar, necesitas borrar y reescribir.
- **Búsqueda en conversaciones**: si llegas a tener 100 hilos no hay buscador.
- **Accent color custom para "emprendimiento"**: hereda del default. Si quieres un color propio (ej. amarillo o naranja), añade `[data-module="emprendimiento"] { --color-accent: #...; }` en `globals.css`.
- **Mobile sub-nav** para Negocio / Pegasso: no agregué sub-navegación móvil porque ambos módulos son páginas únicas. El bottom-nav está limitado a las 3 pestañas originales.
- **Upload de archivos en Pegasso**: por ahora sólo texto. Imágenes/PDFs son futuro.
- **Voz en Pegasso**: dictar preguntas usando Web Speech API — patrón ya está en TransactionModal.
- **Métricas de uso de Pegasso**: cuántos tokens lleva el user este mes, costo estimado, etc.
- **Tests E2E del chat**: probé manualmente que la API responde 503 sin key (lo cual es correcto). El flujo end-to-end requiere mocks complejos del SDK.

## Si Pegasso no responde

1. ¿`ANTHROPIC_API_KEY` en `apps/web/.env.local`? Sin eso → 503 con mensaje claro.
2. ¿Reiniciaste el dev server después de añadir la key? Variables de entorno se cachean al arranque.
3. ¿Tienes saldo en tu cuenta Anthropic? Mira https://console.anthropic.com/settings/billing
4. Mira los logs en `/tmp/estoicismo/dev_web2.log` — los errores del API route aparecen ahí.

## Stats

| Métrica | Valor |
|---|---|
| Archivos creados | 13 |
| Líneas añadidas | ~3,200 |
| Tablas nuevas | 8 |
| Tests añadidos | 11 |
| Tests pasando | 195/195 |
| Rutas HTTP 200 | 21/21 |

Buenos días.
