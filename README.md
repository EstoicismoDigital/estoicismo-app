<div align="center">

# Estoicismo Digital

**Tu sistema operativo personal, inspirado en los estoicos.**

Hábitos · Finanzas · Mentalidad · Negocio — todo conectado en un ritual diario.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000)](https://vercel.com/)

</div>

---

## Filosofía

Cuatro estoicos, cuatro pilares de la vida diaria:

| Estoico | Módulo | Disciplina |
|---|---|---|
| **Epicteto** | Hábitos | Lo que depende de ti |
| **Marco Aurelio** | Finanzas | Orden, deber, recursos bien dirigidos |
| **Séneca** | Emprendimiento | Negocio con virtud |
| **Porcia Catón** | Mentalidad | Coraje, fortaleza interior |

Más un ritual diario en `/hoy` que conecta los cuatro, un asistente conversacional (**Pegasso**), un módulo de lectura, y un diario integrado.

## Features principales

- 🌅 **Ritual diario** — afirmación, mood, gratitud, hábitos, lectura, fitness, reflexión
- 🎯 **Tracking de hábitos** con rachas, streak freezes, heatmap, anuario
- 💰 **Finanzas completas** — transacciones, presupuestos, deudas, ahorro, recurrentes, suscripciones, inversiones, FIRE calculator, net worth
- 🧠 **Mentalidad** — MPD (Hill), meditaciones (Dispenza), frecuencias Aura, vision board, gratitud, cartas al futuro
- 💼 **Negocio** — clientes con pipeline, productos, OKRs, time tracking, ideas
- 📖 **Lectura** — biblioteca, sesiones, highlights, retos anuales
- 📓 **Diario** transversal con prompts diarios y mood
- ✨ **Pegasso** — asistente AI con tool use (lee tu data) + WhatsApp opcional via Twilio
- 🔔 Alertas inteligentes en `/hoy` — bills del día, rachas en riesgo, presupuestos al límite
- 📊 **Insights semanales** comparativos
- 🌙 **Evening review** (Séneca) post-19h

## Stack

- **Next.js 15+** App Router · React 19 · TypeScript estricto
- **Supabase** Postgres + Auth + Storage + RLS por user
- **Tailwind CSS** con design tokens custom (4 paletas + dark/light)
- **React Query** + persistencia en IndexedDB (instant load)
- **Anthropic Claude SDK** para Pegasso (tool use streaming)
- **Twilio** opcional para WhatsApp
- **Stripe** opcional para premium
- **PWA** instalable + offline-first

## Quick start

```bash
# Clonar
git clone https://github.com/EstoicismoDigital/estoicismo-app
cd estoicismo-app

# Instalar
pnpm install

# Configurar env
cp .env.example apps/web/.env.local
# Editar apps/web/.env.local con tus credenciales (ver .env.example)

# Aplicar migraciones de Supabase
# (usa el dashboard o CLI según prefieras)

# Dev
pnpm dev:web
```

App en `http://localhost:3000`.

## Estructura

```
apps/
  web/        Next.js app (principal)
  mobile/     Expo app (en progreso)
packages/
  supabase/   Cliente Supabase compartido + tipos
  ui/         Componentes UI compartidos
  config/     Config compartida (tsconfig, etc.)
supabase/
  migrations/ SQL migrations versionadas
docs/
  PLAN_100_MEJORAS.md  Roadmap original
  WHATSAPP_SETUP.md    Setup de Twilio para WhatsApp
```

## Licencia

[MIT](./LICENSE) — el código es libre.

**Pero la marca no.** "Estoicismo Digital", los logos, la identidad visual y los retratos de los estoicos son trademarks. Si haces fork, rebrandéalo. Detalles en [LICENSE](./LICENSE).

## Contribuir

Pull requests son bienvenidos. Para cambios mayores, abre primero un issue describiendo qué quieres cambiar.

Lee [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles.

---

<div align="center">

**Hecho con disciplina por [Estoicismo Digital](https://github.com/EstoicismoDigital)**

*Memento mori. Memento vivere.*

</div>
