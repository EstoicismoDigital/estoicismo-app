# Plan · 100 mejoras hacia "perfecta"

Status snapshot:
- 4 pilares operativos (Hábitos, Finanzas, Mentalidad, Negocio)
- + 2 transversales (Diario, Pegasso)
- 23 tablas, 26 rutas, 201 tests
- Logo y branding aplicados, dark mode listo

---

## A · UX/UI Polish (15)

1. Animaciones page-transition entre módulos
2. Empty states con frase estoica + CTA emocional (ya parcial)
3. Loading skeletons exactos por página (ya parcial)
4. Pull-to-refresh en mobile
5. Swipe-to-delete en listas mobile
6. **Cmd+K command palette global** — captura rápida cross-módulo ⭐
7. Toast positioning + duration tuning
8. Modal close gestures (confirmar si dirty)
9. Validación inline de formularios con feedback visual
10. Tour de onboarding completo (primera vez en la app)
11. Avatar / foto de perfil en topbar
12. Selector de paleta (3-4 temas)
13. Setting de tamaño de fuente (a11y)
14. Modo "reduce motion" respetado
15. Skip-to-content para screen readers

## B · Datos & Integraciones (15)

16. **Subida de imágenes vía Supabase Storage** (covers, fotos de meta) ⭐
17. CSV import para transacciones (export bancario)
18. Apple Health import (vía export ZIP)
19. Google Fit OAuth
20. Notion mirror read-only (página por libro/idea)
21. Daily email digest (cron + edge function)
22. iCal export (cumpleaños, días de pago, sesiones)
23. **PDF export del diario** ⭐
24. **Annual report generator** (PDF resumen del año) ⭐
25. Backup completo (JSON download)
26. Webhook para triggers externos
27. OCR de recibos (foto → monto + categoría)
28. Voice input multi-idioma
29. Spotify Now-Playing en meditación
30. Calendar feed sync

## C · Hábitos (10)

31. Templates marketplace (curados)
32. Habit dependencies (X requiere Y antes)
33. Habit pairing (sugerencias que se compounden)
34. Heatmap visual estilo GitHub
35. **Streak freeze (sick day pass)** ⭐
36. Habit accountability partner (compartir progreso)
37. Pomodoro integrado para hábitos de focus
38. Time-of-day analysis ("completas mejor en la mañana")
39. Weather-aware (no recordar correr si llueve)
40. Graduate / retire un hábito ya dominado

## D · Finanzas (15)

41. **Recurring transactions** (renta, salario, suscripciones) ⭐⭐
42. **Subscription tracker** (Netflix, Spotify, etc con renewal date) ⭐⭐
43. Receipt photo attachment a transacciones
44. **Multi-account support** (efectivo, banco, ahorros) ⭐
45. **Net worth tracking** (suma activos - deudas) ⭐
46. Investment portfolio manual
47. Currency conversion automática (XR API)
48. **Bill reminder notifications** ⭐
49. Spending insights (Pegasso suggesting)
50. Cash flow projection 60 días
51. Savings rate calculation
52. FIRE calculator (financial independence)
53. Emergency fund tracker (3-6 meses gastos)
54. Stock/crypto portfolio (manual)
55. Tax bucket category

## E · Fitness (10)

56. **Rest timer entre series** dentro del WorkoutModal ⭐⭐
57. **PR celebration animation** al romper récord ⭐
58. **Progressive overload suggestion** (después de 2 sesiones exitosas, +2.5kg) ⭐
59. **Plate calculator** (cuántos discos necesitas) ⭐
60. **Body measurements UI** (la tabla existe, falta UI) ⭐
61. **Photo progress** (before/after side-by-side) ⭐
62. Workout templates con un-click copy
63. Rest day detection ("4 entrenos seguidos, descansa")
64. Heart rate zones manual
65. Mood-after-workout correlation chart

## F · Lectura (5)

66. Goodreads CSV import
67. **Annual reading goal** (12 libros este año, contador) ⭐
68. Highlights/quotes per book (Kindle export)
69. Book recommendations de Pegasso
70. Reading challenges (1 filosofía, 1 ficción, 1 técnico)

## G · Mentalidad (10)

71. **Daily affirmations input + recall** ⭐
72. **Vision board** (grid de imágenes con metas) ⭐⭐
73. Gratitude streak first-class
74. **Future-self letter** (escribes a tu yo futuro, te llega en X meses) ⭐
75. Frecuencias Aura ampliadas (528, 432, 8 Hz binaurales)
76. Breathwork timed (4-7-8, box breathing, Wim Hof)
77. Meditation library (audio guiado)
78. **Mood tracker first-class** (no sólo per habit, propia tabla) ⭐
79. Journal prompts categorizados por mood
80. **Stoic exercise of the day** (premeditatio, vista desde arriba, etc) ⭐

## H · Pegasso IA (10)

81. **Weekly review auto-generated** (Pegasso lee tu data y escribe resumen) ⭐⭐
82. Pegasso lee tu diario (con permiso) para contexto
83. Pegasso lee tu finanzas para advice
84. Pegasso voice mode (TTS browser nativo)
85. **Suggested actions** (Pegasso crea hábito/transacción con confirmación) ⭐
86. Multi-language Pegasso (EN, PT-BR)
87. **Pinned insights** (guardar respuestas como "lecciones") ⭐
88. Conversation export PDF
89. Personalidades de Pegasso (estoico, paterno, hermano mayor, mentora)
90. Search in conversations

## I · Negocio (10)

91. **Goal milestones** (primer cliente, primer $10k) ⭐
92. Customer LTV calculation
93. Pipeline (lead → conversación → cliente → recurring)
94. **Invoice/receipt PDF generator** ⭐
95. Time tracking por proyecto/cliente
96. **Quick capture: "Pagué a María $500"** → auto-crea cliente + venta + tx ⭐
97. Goal-setting OKRs lite
98. Competitor tracker
99. Idea-to-action: convertir business_idea → profile activo + tasks iniciales
100. Receipt scanner para pagos recibidos

---

## Tonight's priority queue (top 20)

Calculé tiempo realista: arranco con los **⭐⭐ y ⭐ que dan más bang por commit**, en orden:

| # | Feature | Pilar | Tiempo |
|---|---|---|---|
| 1 | Recurring transactions + Subscription tracker | Finanzas | 90min |
| 2 | Net worth tracking | Finanzas | 30min |
| 3 | Multi-account (cuentas) | Finanzas | 60min |
| 4 | Bill reminder dates | Finanzas | 30min |
| 5 | Rest timer entre series | Fitness | 30min |
| 6 | Plate calculator | Fitness | 30min |
| 7 | PR celebration animation | Fitness | 30min |
| 8 | Body measurements UI | Fitness | 60min |
| 9 | Photo progress + Image upload general | Fitness + infra | 90min |
| 10 | Streak freeze (hábitos) | Hábitos | 45min |
| 11 | Vision board | Mentalidad | 60min |
| 12 | Stoic exercise of the day | Mentalidad | 30min |
| 13 | Mood tracker first-class | Mentalidad | 60min |
| 14 | Future-self letter | Mentalidad | 45min |
| 15 | Pegasso pinned insights | Pegasso | 30min |
| 16 | Pegasso weekly review | Pegasso | 60min |
| 17 | Annual reading goal | Lectura | 30min |
| 18 | Goal milestones (negocio) | Negocio | 45min |
| 19 | Quick capture cmd+K palette | UX | 90min |
| 20 | Annual report PDF | Datos | 90min |

Total estimado: ~14h. Pragmático: si me falta tiempo, los últimos 3 quedan para próxima sesión.

## Decisiones técnicas

- **Migración por feature** — no agruperé migraciones para mantener trazabilidad
- **Aplico vía DB pipeline** (`apply-migration.mjs`) ya configurada
- **Commits incrementales** — uno por feature
- **Tests sólo para libs puras** (no perder tiempo en RTL para UI esta noche)
- **Lazy-load** todo modal pesado nuevo
- **Sin librerías nuevas** salvo que ahorren mucho (`react-day-picker` para recurring, quizá `recharts` para mood charts)

---

## Resultado · sesión 2026-04-27

**Top-20 cerrado** + 6 bonus features. Total ~26 items.

| # | Feature | Status |
|---|---|---|
| 1 | Recurring + subscriptions | ✓ DB + UI + page |
| 2 | Net worth tracking | ✓ NetWorthCard en /finanzas |
| 3 | Multi-account | ✓ /finanzas/cuentas |
| 4 | Bill reminder dates | ✓ via due_day en recurring |
| 5 | Rest timer entre series | ✓ floating widget en QuickLog |
| 6 | Plate calculator | ✓ visual + per-side |
| 7 | PR celebration animation | ✓ confetti overlay 3.5s |
| 8 | Body measurements UI | ✓ 6 inputs auto-save |
| 9 | Photos progress (parcial) | ✓ image_url field, no Storage upload |
| 10 | Streak freeze infra | ✓ DB + lib (UI integration TBD) |
| 11 | Vision board | ✓ grid + categorías + weight |
| 12 | Stoic exercise of the day | ✓ 30 ejercicios determinísticos |
| 13 | Mood tracker first-class | ✓ tabla propia + auto-save |
| 14 | Future-self letter | ✓ sealed/ready/opened states |
| 15 | Pegasso pinned insights | ✓ /pegasso/insights + bubble actions |
| 16 | Pegasso weekly review | ✓ snapshot + structured prompt |
| 17 | Annual reading goal | ✓ con on-track indicator |
| 18 | Goal milestones (negocio) | ✓ progress bars vs sales/clients |
| 19 | Cmd+K command palette | ✓ global, kbd nav, fuzzy search |
| 20 | Annual report (anuario) | ✓ /anuario printable |

**Bonus completados en la noche**:
- ✓ Search in Pegasso conversations (#90)
- ✓ Breathwork timer (#76) — /reflexiones/respira con 5 patrones
- ✓ Backup JSON completo (#25) — 41 tablas
- ✓ Gratitude streak first-class (#73)
- ✓ Mood-aware journal prompts (#79)
- ✓ A11y: skip-to-content (#15) + reduce-motion (#14)

**Features queuadas para futuras sesiones** (parcial):
- Heatmap GitHub-style (ya hay 91d en /progreso, ampliar a 365d)
- Image upload via Supabase Storage (#16) — desbloquea avatares,
  vision board con upload, photos de progreso reales
- Time-of-day analysis (#38)
- Mood-after-workout correlation (#65)
- Idea-to-action conversion (#99)
- CSV import transacciones (#17)
- Workout templates one-click (#62)
- Pull-to-refresh mobile (#4)
- Tour de onboarding (#10)

**Migraciones aplicadas esta sesión**:
1. `20260427400000_finance_recurring_subscriptions.sql`
2. `20260427500000_habit_streak_freezes.sql`
3. `20260427600000_mentalidad_extended.sql`
4. `20260427700000_pegasso_pins_review.sql`
5. `20260427800000_reading_goals_business_milestones.sql`
6. `20260427900000_gratitude.sql`

---

## Resultado · sesión 2 (madrugada 2026-04-27 → 2026-04-28)

User pidió:
> "que sepas que vas a encontrar en cada cosa, un plan de que tienes que
> hacer todos los días a primera hora. que no pases tanto tiempo en la
> aplicación (más de 1 hora al día) … que se haga un habito llenar los
> ingresos, negocio, meditar y los habitos correspondientes, llenar la
> parte fitness etc."

### Centerpiece: `/hoy` — el ritual matutino

**Problema resuelto**: El usuario tenía que ir a 6 pantallas distintas
para llenar lo del día. Cada una con su propia interfaz. Tedioso.

**Solución**: Una sola pantalla en vertical. Llena en orden, todo
inline, en 10-15 minutos.

**9 secciones del ritual** (cada una con `done` autoderivado):
1. **Tu por qué** — afirmación/MPD con check "leído"
2. **¿Cómo amaneces?** — mood emoji (1 tap)
3. **Tres gracias** — 3 inputs, auto-save
4. **Hábitos de hoy** — checklist de los hábitos que aplican
5. **Plata** — 2 quick-rows (gasto + ingreso) con resumen del día
6. **Negocio** — quick-venta inline (si negocio activo)
7. **Cuerpo** — link rápido a fitness (si tiene perfil)
8. **Lectura** — minutos + páginas del libro actual
9. **Reflexión** — ejercicio estoico + journal prompt mood-aware

**Hero de /hoy**:
- Greeting por hora ("Buenos días, [nombre]")
- Ring de progreso con emojis tappables (saltan a la sección)
- Racha del ritual (días con ≥4 secciones completas)
- Nudge dinámico según hora + progreso

**Inline mini-loggers nuevos**:
- `QuickAddTransactionRow` — toggle income/expense, monto, categoría,
  Enter. Recuerda última categoría usada por kind.
- `QuickAddSaleRow` — venta con producto + cliente opcionales.
- `QuickAddReadingRow` — minutos + páginas, prefilled del libro actual.

**Lógica del ritual**:
- `lib/hoy/ritual.ts` define 9 secciones con flags available + done.
  Ritual "completo" cuando ≥4 de las disponibles están hechas.
- `useTodayRitual` lanza 16 selects en paralelo con auth single-shot.
- `useRitualStreak` scan de 60 días para construir la racha.
- `useTodaySkips` permite "saltar hoy" una sección sin perder racha
  (persistido en localStorage por día).

### Navegación reestructurada

- `/` ahora es `/hoy` (TodayClient). El dashboard de hábitos vivió en
  `/habitos`.
- BottomNav: "Hábitos" → "Hoy" con ícono Sun.
- Masthead: módulo "habits" etiquetado "Hoy", matches incluye
  `/habitos`, `/anuario`, etc.
- HABITS_SUBNAV ahora tiene: Hoy / Hábitos / Fitness / Lectura /
  Calendario / Progreso / Anuario / Notas.
- Mobile habits subnav ahora se muestra (antes solo finanzas/mentalidad).

### "¿Qué encuentras aquí?" en cada módulo

- Nuevo componente `ModuleHeroNav` — chips translúcidos en el hero
  oscuro mostrando las sub-secciones disponibles.
- Mounted en /finanzas, /reflexiones, /emprendimiento.
- DailyHeader (hero de /habitos) ahora dice "Hábitos · [fecha]" en
  vez de solo fecha.

### Cmd+K visible

- Botón "Buscar… ⌘K" en masthead desktop (lg+) para descubrimiento.
- Cmd+K palette ahora incluye nav-hoy en grupo Pilares.

### Embed mode

- `MoodTrackerCard`, `GratitudeCard`, `AffirmationStripe` aceptan
  prop `embed` que oculta su título/banner interno cuando viven en
  HoySection. Cero duplicación visual.

### Empty states más editoriales

- VisionBoardSection: "Lo que la mente ve, el cuerpo persigue."
- /hoy nudges contextuales según hora + progreso ("Empieza con
  cualquier sección. Da igual cuál.", "Día completo. Sin necesitar
  que nadie lo aplaudiera.", etc).

### Filosofía del rediseño

> Una pantalla por día. Llenas tu mañana en 10-15 min, todo lineal,
> cero modal. La consistencia construye el hábito.

El usuario abre la app, ve el ring, scrollea, llena, cierra. Si no
aplica una sección hoy (día de descanso, fin de semana sin negocio),
toca "saltar" y no rompe la racha.

---

## Resultado · sesión 3 (continuación 2026-04-28)

User pidió:
> "tienes un error en hoy. Y por favor separalo de habitos. Haz que
> habito tenga su propia sección, y mejora la navegación de las
> pestañas y continua con el plan"

### Fix crítico

- **Bug**: el dropdown de QuickAddTransactionRow mostraba "utensils Comida"
  / "briefcase Salario" porque HTML `<option>` no renderiza JSX. Las
  categorías guardan nombres de íconos lucide en `icon` que se mostraron
  como texto. Quité el prefix; agregué un dot del color de la categoría.

### Reestructuración: Hábitos como módulo propio

Top tabs ahora son **5** (eran 4):

```
Hoy · Hábitos · Finanzas · Mentalidad · Negocio
```

- Nueva ModuleKey "hoy" con accent dorado (data-module="hoy" reusa
  --brand-habits via globals.css).
- /habitos es top-tab, no sub-page de Hoy.
- HOY_SUBNAV ligero: solo Hoy + Anuario (lo cumulativo cross-modular).
- HABITS_SUBNAV completo: Hábitos / Fitness / Lectura / Calendario /
  Progreso / Revisión / Historial.
- Mobile BottomNav: Hoy / Hábitos / Finanzas / Mentalidad / Negocio
  (5 tabs, sin Ajustes — Ajustes se movió al mobile top bar).
- Cmd+K palette: nav-hoy y nav-habitos como entries distintos.

### Subnav visualmente mejorado

- Cada item del subnav ahora tiene emoji prefijo: ☀️ Hoy, ✓ Hábitos,
  💪 Fitness, 📖 Lectura, 📈 Resumen, 🏦 Cuentas, 💳 Tarjetas,
  🔁 Recurrentes, 🐖 Ahorro, 🎯 Presupuestos, ⚖️ Deudas, 🧘 Meditación,
  🌬 Respira, etc.
- Reconocimiento visual rápido sin tener que leer todo.

### Features nuevas continuando el plan

**#65 Mood × workout correlation** — `MoodCorrelationCard` en
/habitos/fitness compara mood promedio en días con workout vs sin.
Color verde si delta positivo, rojo si negativo. Insight contextual
("El cuerpo te lo paga", "Revisa intensidad o momento", etc).

**#99 Idea-to-action** — `ActivateIdeaModal` convierte una BusinessIdea
en perfil de negocio activo + crea 5 tareas iniciales clásicas
(define producto, identifica cliente, pon precio, MVP en 7 días, cobra).
Botón cohete en cada IdeaCard. Marca la idea con prefijo ✓ (historial).

**#48 Bill reminder banner** — `UpcomingDueBanner` que aparece sutil
en /finanzas (5 días) y /hoy plata section (3 días) cuando hay
recurrencias o suscripciones próximas a vencer. Solo renderiza si
hay items — discreto.

**Lista de últimos movimientos en /hoy** — la sección Plata ahora
muestra los 3 movimientos más recientes del día con dot de color +
nota + monto. El user valida visualmente "sí, registré ese gasto".

### Filosofía continuada

5 módulos verticales, cada uno con identity propia (color, icono,
subnav). El user sabe dónde está y qué encontrará. Hábitos vive
junto a Hoy pero como vecino — el ritual del día (Hoy) NO es lo
mismo que la administración de hábitos (Hábitos).
