# Contribuir a Estoicismo Digital

Bienvenido. Este documento explica cómo contribuir.

## Antes de empezar

1. **Abre un issue** describiendo qué quieres cambiar antes de escribir código
   serio. Esto evita que pierdas horas en algo que no encaja con el rumbo del
   proyecto.
2. **Fork** el repo, crea una rama desde `main`, trabaja ahí.
3. **Lee la marca**: el código es MIT pero "Estoicismo Digital" + logos +
   retratos son trademarks. Tu fork debe usar otro nombre si lo despliegas.

## Setup local

```bash
pnpm install
cp .env.example apps/web/.env.local
# Edita .env.local con tus propias credenciales de Supabase, Anthropic, etc.
pnpm dev:web
```

## Reglas

### Código
- **TypeScript estricto** — sin `any` salvo casos muy puntuales.
- **No comentarios obvios** — el código debe explicarse solo. Reserva comentarios
  para el porqué (no el qué).
- **Sin librerías nuevas sin discusión** — cada dependencia agrega peso al bundle.
- **Mobile-first** — diseña para teléfono, expande a desktop.

### Commits
- Idioma: español o inglés, consistente en cada commit.
- Formato: `tipo(área): qué hace`
  - `feat(finanzas): agregar X`
  - `fix(nav): corregir Y`
  - `docs: actualizar Z`
- Co-author tag al final si trabajaste con AI.

### PRs
- 1 PR = 1 propósito. No mezcles refactor + feature en el mismo PR.
- Si tocas DB, incluye la migration en `supabase/migrations/`.
- Build debe pasar limpio (`pnpm build`).
- Typecheck debe pasar (`pnpm typecheck`).

## Estructura

```
apps/web/        → Next.js app principal
apps/mobile/     → Expo app
packages/        → Código compartido
supabase/        → Migrations + types
```

## Reportar bugs

Issue con:
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshot si es visual
- Browser + OS

## Filosofía del código

> "Make it work, make it right, make it fast — in that order."
> — Kent Beck

Y antes de pedir un PR pregúntate: *¿simplifica o agrega complejidad?*

---

Gracias por contribuir.
