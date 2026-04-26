# Handoff — Sesión nocturna 2026-04-25 → 26

## TL;DR

5 módulos nuevos + rebuild de Deudas. Todo funcional, 184 tests pasan, dev server sirve `/` y todas las rutas nuevas con HTTP 200.

```
HÁBITOS    → +Fitness, +Lectura
FINANZAS   → +Ahorro, +Presupuestos, Deudas (rebuild completo)
```

## Cómo verlo

Dev server ya corriendo en `http://localhost:3000` (proceso `bup9z9txo` / `buirstatr`). Si lo paraste:

```bash
cd "/Users/macbookpro/Desktop/ESTOICIMO ARCHIVOS METRICAS/APP ESTOICISMO/estoicismo-app"
pnpm dev:web
```

Rutas nuevas:

| Ruta | Qué es |
|---|---|
| `/habitos/fitness` | Sueño/calorías/peso/pasos · niveles griegos por lift · workouts con sets |
| `/habitos/lectura` | Cronómetro · libros · sesiones con resumen propio · racha lectora |
| `/finanzas/ahorro` | Metas con barra de progreso · abonar/retirar · ETA al ritmo actual |
| `/finanzas/presupuestos` | Topes mensuales por categoría · alertas escalonadas |
| `/finanzas/deudas` | (rebuild) Avalanche/snowball · simulador de extra · pagos con split |

## DB — migración pendiente de aplicar

**ACCIÓN REQUERIDA**: aplicar la migración nueva a Supabase:

```bash
cd "/Users/macbookpro/Desktop/ESTOICIMO ARCHIVOS METRICAS/APP ESTOICISMO/estoicismo-app"
# Vía CLI de Supabase si lo tienes configurado:
supabase db push
# O ejecutando manualmente en el dashboard SQL editor:
# supabase/migrations/20260425000000_fitness_lectura_savings_budgets_debts.sql
```

Tablas nuevas:
- `fitness_user_profile`, `fitness_metrics`, `fitness_exercises` (con seed de 18 ejercicios), `fitness_workouts`, `fitness_workout_sets`
- `reading_books`, `reading_sessions`
- `savings_goals`, `savings_contributions`
- `budgets`
- `finance_debt_payments`

Cambios en tablas existentes:
- `finance_debts` gana `original_balance NOT NULL` (auto-init = balance), `start_date`, `notes`
- `profiles` gana `payoff_strategy` (default 'avalanche')

RLS estándar manage-own en todas. fitness_exercises permite leer defaults (user_id IS NULL).

## Commits del trabajo (en orden, sobre `main`)

```
12104fd feat(nav+tests): sub-nav nuevo + tests de libs matemáticas
2f946b2 feat(deudas): rebuild con simulador, pagos y estrategias
cdfe08c feat(presupuestos): nuevo módulo Finanzas · Presupuestos por categoría
8e594e5 feat(ahorro): nuevo módulo Finanzas · Ahorro con metas y abonos
119d103 feat(lectura): nuevo módulo Hábitos · Lectura con cronómetro y resumen
7c93c2f feat(fitness): nuevo módulo Hábitos · Fitness con niveles griegos
7f4c281 feat(libs): hooks + libs matemáticas para los 5 nuevos módulos
fa0981f feat(db): schema for fitness, lectura, ahorro, presupuestos, debt-payments
```

Branch: `main`. No se ha hecho push.

## Tests

```bash
cd apps/web && pnpm test
# 17 suites, 184 tests, todos verdes
```

Cobertura específica de los nuevos módulos:
- `fitness-levels.test.ts` (15 tests): Epley, niveles griegos por lift, computeGlobalLevel
- `debt-amortization.test.ts` (22 tests): payoff, simulador, comparativa estrategias
- `budget-alerts.test.ts` (10 tests): estados por umbral, summary, proyección
- `savings-projection.test.ts` (8 tests): saved/percent/ETA, monthly required

## Decisiones de diseño

1. **Niveles fitness en cliente**, no en DB. Permite calibrar thresholds sin migración. Si quieres ajustarlos, edita `apps/web/lib/fitness/levels.ts` (constantes `LIFT_THRESHOLDS` y `REPS_ONLY_THRESHOLDS`).

2. **Resumen "con tus palabras" obligatorio en Lectura**. La filosofía es "procesar > memorizar". El usuario no puede guardar una sesión sin escribir resumen.

3. **`localCurrencies` en métricas vs DB**: el "spent" del mes para presupuestos se calcula en cliente. No escribimos un campo desnormalizado para evitar inconsistencias.

4. **Estrategia de payoff a nivel perfil** (no por deuda): el usuario tiene UNA estrategia activa global. Si quiere mezclar, eso es "custom" y reordena él.

5. **Validación manual** (no Zod) para mantener consistencia con la base existente.

## Innovaciones añadidas

- `BudgetsAlertBanner`: banner contextual en el dashboard de finanzas. Solo aparece si hay presupuestos cerca del límite o excedidos. Click → `/finanzas/presupuestos`.
- `DailyEssentialsCard`: tarjeta cross-module en el dashboard principal. Muestra fitness + lectura del día con quick-link.
- `Atajos` en Finanzas reorganizados: 5 columnas (calendario, tarjetas, ahorro, presupuestos, deudas).

## Lo que NO se hizo (pendiente para otra sesión)

- **Charts más sofisticados**: por ahora son sparklines SVG inline. Si quieres barras/area charts, valdría la pena meter recharts (~30KB).
- **Voice input para fitness**: el patrón ya existe en TransactionModal. Añadir similar a WorkoutModal sería ~1h.
- **Lookup de libros con API externa** (Google Books, OpenLibrary): mejor para iteración futura.
- **Histórico mensual de presupuestos**: actualmente sólo hay el "vigente" (period_start NULL). Para auditar abril vs mayo, hay que crear filas con period_start.
- **Notificaciones push** cuando un presupuesto cruza el threshold.
- **Edición in-place de sets** en workouts ya guardados. Por ahora puedes eliminar y agregar.

## Servidor de dev

Corriendo en background, log en `/tmp/estoicismo/dev_web2.log`. Si quieres parar:

```bash
lsof -i :3000 | awk 'NR>1{print $2}' | xargs kill 2>/dev/null
```

## Token de admin de Shopify (no relacionado, pero consta)

Sigue valido en `/Users/macbookpro/Desktop/ESTOICIMO ARCHIVOS METRICAS/.claude/settings.local.json`. Sin uso en esta sesión.
