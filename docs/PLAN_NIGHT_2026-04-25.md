# Plan de desarrollo nocturno · 2026-04-25 → 26

Objetivo: 5 features grandes + innovaciones, ~8h autónomas.

## Features

### 1. Hábitos · Fitness (`/habitos/fitness`)
**DB**: `fitness_user_profile`, `fitness_metrics` (sleep/cal/weight diario), `fitness_exercises` (catálogo + custom), `fitness_workouts`, `fitness_workout_sets`.

**UI**:
- Dashboard con tarjetas de métricas (sueño, calorías, peso) + gráfico de progresión 30d
- Lista de workouts con CTA "Nueva sesión"
- Modal de workout: nombre, fecha, ejercicios[], cada ejercicio con sets[] (peso, reps)
- Vista por ejercicio: histórico + 1RM estimado + nivel actual
- **Sistema de niveles dioses griegos** (`lib/fitness/levels.ts`):
  - Mortal · Perseo · Heracles · Apolo · Atlas · Titán · Zeus · Olimpo I/II/III
  - Thresholds calculados como ratio bw para Squat/Bench/Deadlift/OHP, reps absolutas para Pull-ups
  - Nivel global = promedio ponderado de los lifts principales
- Tips contextuales según nivel + objetivo (fuerza/hipertrofia/resistencia)

### 2. Hábitos · Lectura (`/habitos/lectura`)
**DB**: `reading_books` (título, autor, total_pages, current_page, image_url, started_at, finished_at, is_finished), `reading_sessions` (book_id, duration_seconds, pages_from, pages_to, summary, mood, started_at).

**UI** (mismo patrón que Meditación):
- Tarjeta de "libro actual" con progreso %
- Cronómetro con play/pause/reset (Date.now() based, resistente a background throttling)
- Al terminar: input de páginas leídas + textarea para "resumen con tus palabras" + estado de ánimo (1-5)
- Historial de sesiones
- Lista de libros (todos, en curso, terminados)
- Estadísticas: tiempo total leído, libros terminados, racha de días con lectura, páginas/día

### 3. Finanzas · Fondo de Ahorro (`/finanzas/ahorro`)
**DB**: `savings_goals` (name, target_amount, currency, deadline, image_url, icon, color, is_completed, completed_at), `savings_contributions` (goal_id, amount, occurred_on, note, transaction_id opcional).

**UI**:
- Grid de tarjetas con barra de progreso por meta
- Modal crear/editar meta (nombre, monto objetivo, deadline opcional, color/icono)
- Botón "Abonar" → modal con monto + opción de "registrar como gasto en categoría Ahorro" (genera finance_transaction enlazada)
- Cómputos: % completado, monto faltante, mensual requerido para llegar al deadline, ETA al ritmo actual
- Marcar como completada (animation/toast celebratorio)

### 4. Finanzas · Presupuestos (`/finanzas/presupuestos`)
**DB**: `budgets` (category_id, period='monthly', amount, currency, alert_threshold default 80%, period_start auto = mes actual). Una fila por categoría/mes; los del mes anterior quedan archivados como histórico.

**UI**:
- Lista de categorías de gasto con su presupuesto + gasto del mes (computed)
- Barra de progreso con colores por % usado: verde 0-50%, lima 50-75%, ámbar 75-90%, naranja 90-100%, rojo +100%
- Modal: ajustar presupuesto por categoría
- Banner en dashboard de finanzas: "X categorías cerca del límite"
- Alertas (toast) al detectar cruce de threshold tras crear transacción

### 5. Finanzas · Sistema Inteligente de Deudas (rebuild de `/finanzas/deudas`)
**DB**: enhance `finance_debts` con `original_balance`, `start_date`, `notes`. Nueva tabla `finance_debt_payments` (debt_id, amount, principal_paid, interest_paid, occurred_on, note, transaction_id). Profile gana `payoff_strategy` ('avalanche'|'snowball'|'custom').

**UI**:
- Cabecera: estrategia activa (avalancha/bola de nieve/custom) + métricas globales (deuda total, interés mensual estimado, libre en X meses)
- Lista ordenada por estrategia con badges "Pagar primero" / "Mínimo"
- Tarjeta por deuda: balance, APR, mínimo, próximo pago, % pagado del original, ETA si solo pago mínimo
- Botón "Registrar pago" → modal con monto; calcula automáticamente split capital/interés
- **Simulador**: slider de "extra mensual" → muestra nueva fecha de liquidación, total de interés ahorrado vs solo mínimo
- Tabla de amortización (próximos 12 meses) por deuda
- Recomendación contextual: "Si pagas $X extra a [Deuda Y], sales 6 meses antes y ahorras $Z"

**Lib `lib/debt/amortization.ts`**:
- `monthlyInterest(balance, aprPercent)` 
- `simulatePayoff(debt, monthlyPayment, maxMonths=600)` → array de meses con balance/principal/interest
- `payoffMonths(debt, monthlyPayment)` → número de meses
- `recommendOrder(debts, strategy)` → debts[] reordenadas
- `compareStrategies(debts, extraMonthly)` → { avalanche: { months, totalInterest }, snowball: { months, totalInterest } }

## Phases

| # | Fase | Tiempo | Output |
|---|------|--------|--------|
| 1 | DB migration + types + queries (5 módulos en uno) | 60min | migration `.sql`, archivos en `packages/supabase/src/`, index actualizado |
| 2 | Hooks + libs de matemáticas | 45min | `useFitness`, `useReading`, `useSavings`, `useBudgets`, `useDebts`; `lib/fitness/levels`, `lib/debt/amortization` |
| 3 | Fitness UI (page + components) | 90min | `/habitos/fitness/` con CRUD workout + métricas + niveles |
| 4 | Lectura UI (page + components) | 60min | `/habitos/lectura/` con timer + libros + sesiones |
| 5 | Ahorro UI | 50min | `/finanzas/ahorro/` con goals + contributions |
| 6 | Presupuestos UI | 60min | `/finanzas/presupuestos/` con cards + alertas |
| 7 | Deudas UI rebuild | 90min | `/finanzas/deudas/` rebuild con simulador + tabla |
| 8 | AppShell sub-nav + tests + commits | 60min | navegación nueva, tests para libs de matemáticas |
| 9 | Polish + innovaciones | restante | charts simples, animations, dashboard cross-module |

## Decisiones tomadas autónomamente

1. **Sin Zod**: el codebase usa validación manual; mantengo consistencia
2. **Subrutas bajo módulos existentes** (no crear módulo nuevo top-level) para no romper nav
3. **Tests sólo para libs puras** (matemáticas, niveles, alertas) — RTL para componentes lo dejo si sobra tiempo
4. **Sin librería de charts**: uso SVG inline para sparklines/progressions simples
5. **Niveles como cómputo derivado** en cliente — no en DB, así puedo iterar las thresholds sin migration
6. **Budget period = mensual** sólo (no anual); simplifica MVP
7. **Reading sin API externa** de libros — entrada manual de título/autor/páginas
8. **Voice input para fitness**: lo dejo fuera del MVP, foco en sets/reps manuales

## Convenciones

- Nombres tablas: `<modulo>_<entidad>` (fitness_workouts, reading_sessions...)
- Nombres archivos packages: `<modulo>.ts` (fitness.ts, reading.ts...)
- Hooks: `use<Modulo>` (useFitness, useReading...)
- Components: PascalCase, dentro de `components/<modulo>/`
- Pages: `(dashboard)/<parent>/<sub>/page.tsx` + `<Sub>Client.tsx`

## Commits

Uno por fase grande (1-7). Mensaje:
- `feat(fitness): módulo gym con niveles griegos`
- `feat(lectura): módulo de lectura con cronómetro y resumen`
- `feat(ahorro): fondos de ahorro con metas y abonos`
- `feat(presupuestos): presupuestos por categoría con alertas`
- `feat(deudas): rebuild con simulador de amortización y estrategias`
