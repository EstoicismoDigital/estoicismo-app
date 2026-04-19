# Hábitos MVP — Design Spec

> **Para implementadores:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans` para ejecutar el plan de implementación que deriva de este spec.

**Goal:** Construir el módulo de Hábitos funcional en la app móvil — crear, completar, editar y eliminar hábitos con rachas, historial semanal y notificaciones locales.

**Plataforma:** Mobile únicamente (`apps/mobile`). La web queda con el dashboard placeholder.

**Plan anterior completado:** Plan 1 (Foundation) — monorepo, auth, onboarding, tab bar, Supabase conectado.

---

## Decisiones de diseño

| Decisión | Elección |
|---|---|
| Frecuencia | Diario **o** X veces por semana (3×, 4×, 5×) |
| Layout principal | Header oscuro + cards blancas con barrita semanal |
| Completar hábito | Tap en el círculo (optimistic update) |
| Crear hábito | Modal pantalla completa (todos los campos visibles) |
| Colores de hábito | 8 colores vivos curados (ver paleta abajo) |
| Recordatorios | Notificaciones locales vía `expo-notifications` |
| Arquitectura de datos | TanStack Query + mutaciones optimistas |
| Free tier | Máx. 3 hábitos activos, historial 7 días visible |

### Paleta de 8 colores para hábitos

```
Azul:      #4F8EF7
Esmeralda: #3DBF8A
Coral:     #E8714A
Violeta:   #A56CF0
Ámbar:     #F0B429
Rosa:      #E85D7A
Turquesa:  #2BBDCE
Tierra:    #8B6F47  ← acento del sistema
```

---

## Estructura de archivos

```
apps/mobile/
├── app/(tabs)/habitos/
│   ├── _layout.tsx          ← Stack con headerShown: false (ya existe, no tocar)
│   └── index.tsx            ← Pantalla principal (reemplaza placeholder)
├── components/habits/
│   ├── HabitCard.tsx        ← Card: emoji · nombre · racha · check · 7 días
│   ├── HabitModal.tsx       ← Modal crear/editar (pantalla completa)
│   └── EmptyHabits.tsx      ← Estado vacío con CTA
├── hooks/
│   ├── useHabits.ts         ← TanStack Query hooks (list, toggle, create, update, delete)
│   └── useStreak.ts         ← Cálculo de racha desde habit_logs
└── lib/
    ├── habits.ts            ← Queries Supabase (CRUD habits + logs)
    └── notifications.ts     ← expo-notifications: permisos + schedule/cancel
```

---

## Pantalla principal (`habitos/index.tsx`)

### Header (oscuro, `colors.bgDeep`)
- Label mono: `HOY · LUNES 19 ABR` (fecha actual)
- Título en Lora italic: frase estoica del día (aleatoria, cacheada en `AsyncStorage` con clave `stoic_quote_YYYY-MM-DD`)
- Progreso: número grande `2` + label mono `DE 3 HÁBITOS COMPLETADOS`

### Cuerpo
- `FlatList` de `HabitCard` componentes
- Estado vacío → `EmptyHabits` con botón "Crear primer hábito"
- FAB `+` (posición absoluta, bottom: `insets.bottom + 72`, right: `spacing.lg`)

### Interacciones
- **Tap FAB** → abre `HabitModal` en modo `create`
- **Tap check** → toggle optimista (ver flujo abajo)
- **Long press card** → `ActionSheetIOS` (iOS) / `Alert` con opciones (Android): Editar · Archivar · Eliminar
- **Free tier:** si `habits.length >= 3` y el usuario es `plan: 'free'`, tap FAB → `Alert` informativo "Límite del plan gratuito — próximamente podrás desbloquear más hábitos"

---

## Componente `HabitCard`

```
┌─────────────────────────────────────────┐
│ ▌ 🧘  Meditar              🔥 12   (✓) │  ← borde izq. en color del hábito
│    ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬ ─── ─── ───        │  ← 7 puntos: L M X J V S D
└─────────────────────────────────────────┘
```

- Borde izquierdo de 3px en el `color` del hábito
- Emoji (16px) + nombre (Inter SemiBold 14px) + racha (JetBrains Mono 10px acento)
- Círculo check: 24×24, tap → toggle
  - Pendiente: borde `colors.line`
  - Completado: fondo `colors.success` con `✓`
- Barrita semanal: 7 segmentos (L–D semana actual)
  - Completado: `colors.success`
  - Hoy completado: color del hábito
  - Hoy pendiente: borde 1.5px color del hábito, fondo vacío
  - Otros días vacíos: `colors.line`
- `minHeight: 44` para touch target (Apple HIG)

---

## Modal crear/editar (`HabitModal`)

Pantalla completa (`presentation: 'modal'` en Expo Router). Campos:

| Campo | Control | Validación |
|---|---|---|
| Nombre | `TextInput` | Requerido, máx. 40 chars |
| Emoji | Grid 4×5 de 20 emojis curados | Requerido (default: `🎯`) |
| Color | Grid 4×2 de 8 colores | Requerido (default: `#8B6F47`) |
| Frecuencia | Segmented: Diario / 3× / 4× / 5× por semana | Requerido (default: Diario) |
| Recordatorio | Toggle + `DateTimePicker` (modo time) | Opcional |

**Emojis curados (20):**
`🎯 🧘 📚 🏃 💧 ✍️ 🌿 💪 🧠 ⭐ 🎨 🎵 🍎 😴 🧹 💊 🚴 🧗 📝 🌅`

**Guardar:**
1. Valida nombre no vacío
2. `INSERT` o `UPDATE` en `habits`
3. Si tiene recordatorio: llama `scheduleHabitNotification(habit)`
4. Si se elimina recordatorio: llama `cancelHabitNotification(habit.id)`
5. Cierra modal, invalida query `['habits']`

---

## Flujo toggle optimista (`useHabits.ts`)

```typescript
// onMutate: actualiza cache antes de la llamada
// onError: revierte al estado anterior
// onSettled: hace refetch para sincronizar

const toggleHabit = useMutation({
  mutationFn: ({ habitId, date, isCompleted }) =>
    isCompleted
      ? deleteHabitLog(habitId, date)
      : insertHabitLog(habitId, date),
  onMutate: async ({ habitId, date, isCompleted }) => {
    await queryClient.cancelQueries({ queryKey: ['habits', 'logs', date] });
    const prev = queryClient.getQueryData(['habits', 'logs', date]);
    queryClient.setQueryData(['habits', 'logs', date], (old) =>
      // actualización optimista del estado local
    );
    return { prev };
  },
  onError: (_, __, ctx) => {
    queryClient.setQueryData(['habits', 'logs', date], ctx.prev);
    Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
});
```

---

## Cálculo de racha (`useStreak.ts`)

```
racha = 0
día = ayer (si hoy no completado) o hoy (si completado)
mientras habit_logs contiene día:
  racha++
  día = día - 1
```

- Se calcula en el cliente a partir de los logs que TanStack Query ya tiene en cache
- Período máximo a revisar: `plan === 'free'` → 7 días; `plan === 'premium'` → ilimitado (de facto los últimos 365)
- Para free tier: si la racha real supera 7 días, se muestra `7+` con candado premium

---

## Notificaciones (`notifications.ts`)

```typescript
// Pedir permisos (solo cuando el usuario activa su primer recordatorio)
async function requestPermissions(): Promise<boolean>

// Programar notificación diaria a la hora elegida
async function scheduleHabitNotification(habit: Habit): Promise<void>
// Usa: Notifications.scheduleNotificationAsync con trigger: { hour, minute, repeats: true }
// identifier: `habit-${habit.id}` (para poder cancelarla)

// Cancelar notificación de un hábito
async function cancelHabitNotification(habitId: string): Promise<void>
// Usa: Notifications.cancelScheduledNotificationAsync(`habit-${habitId}`)

// Cancelar todas (al eliminar cuenta o hacer logout)
async function cancelAllHabitNotifications(): Promise<void>
```

- Para hábitos con frecuencia semanal (ej: 3×/sem), se programan notificaciones en los días que el usuario tiene el hábito activo. La distribución por defecto es uniforme (ej: L · X · V para 3×/sem).
- El permiso de notificaciones se pide la primera vez que el usuario activa un recordatorio, no al abrir la app.

---

## Supabase queries (`habits.ts`)

```typescript
// Lista todos los hábitos activos del usuario
fetchHabits(userId: string): Promise<Habit[]>

// Logs de hoy (o de la semana actual)
fetchHabitLogs(userId: string, from: Date, to: Date): Promise<HabitLog[]>

// Crear hábito
createHabit(data: CreateHabitInput): Promise<Habit>

// Actualizar hábito
updateHabit(id: string, data: Partial<CreateHabitInput>): Promise<Habit>

// Archivar (soft delete)
archiveHabit(id: string): Promise<void>
// → UPDATE habits SET is_archived = true

// Insertar log (completar)
insertHabitLog(habitId: string, userId: string, date: string): Promise<void>

// Eliminar log (descompletar)
deleteHabitLog(habitId: string, date: string): Promise<void>
```

### Tipo `frequency` JSONB

```typescript
type Frequency =
  | 'daily'
  | { times: 3 | 4 | 5; period: 'week' }
```

---

## TypeScript types

```typescript
interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;         // emoji
  color: string;        // hex, uno de los 8 colores curados
  frequency: Frequency;
  reminder_time: string | null;  // "HH:MM" o null
  is_archived: boolean;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;  // DATE "YYYY-MM-DD"
  note: string | null;
}
```

---

## Tests

- `apps/mobile/__tests__/habits.test.tsx` — smoke tests:
  - Renderiza `HabitCard` con check pendiente
  - Renderiza `HabitCard` con check completado
  - `useStreak` calcula racha correctamente con logs consecutivos
  - `useStreak` retorna 0 cuando no hay logs

---

## Fuera de alcance (Plan 3+)

- Pantalla de detalle/historial completo de un hábito
- Estadísticas (gráficas, porcentaje de cumplimiento mensual)
- Streak freeze (el campo existe en DB, no se usa aún)
- Compartir racha / social
- Web: hábitos en Next.js dashboard
