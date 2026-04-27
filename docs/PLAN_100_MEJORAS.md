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
