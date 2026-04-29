# Migraciones pendientes — Agenda de Zeus

Tras los commits de las Fases 0-6, hay **5 migraciones nuevas** que tienes que aplicar
en Supabase **producción** para que las features funcionen completamente.

Mientras NO las apliques, el código frontend está hecho para fallar suavemente
(fail-open en middleware, errores 42P01 ignorados en hooks): la app sigue
funcionando como antes, pero las nuevas secciones aparecerán vacías.

> Proyecto Supabase: `tezcxsgpqcsuopyajptl` (estoicismo-digital)

## Migraciones a aplicar (en orden)

| # | Archivo | Crea | Bloquea fase |
|---|---|---|---|
| 1 | `20260429900000_signed_manifesto.sql` | tabla `user_signed_manifesto` | Fase 2 (manifiesto + gate) |
| 2 | `20260430000000_user_introspection.sql` | tabla `user_introspection` | Fase 3 (wizard onboarding) |
| 3 | `20260430100000_daily_journal.sql` | tabla `daily_journal` | Fase 4 (Sol/Luna en /hoy) |
| 4 | `20260430200000_tour_seen_v2.sql` | columna `profiles.tour_seen_v2` | Fase 5 (tutorial interactivo) |
| 5 | `20260430300000_weekly_review.sql` | tabla `weekly_review` | Fase 6 (/revision-semanal) |

## Cómo aplicarlas — 3 opciones

### Opción A: Dashboard de Supabase (la más fácil)

1. https://supabase.com/dashboard/project/tezcxsgpqcsuopyajptl/sql/new
2. Por cada archivo, en orden:
   - Abre el archivo `supabase/migrations/<nombre>.sql` en el repo
   - Copia todo el contenido
   - Pégalo en el SQL editor
   - Click **Run**
   - Verifica "Success" sin errores
3. Repite con los 5 archivos.

### Opción B: Supabase CLI (si lo tienes configurado)

```bash
cd "/Users/macbookpro/Desktop/ESTOICIMO ARCHIVOS METRICAS/APP ESTOICISMO/estoicismo-app"
supabase link --project-ref tezcxsgpqcsuopyajptl
supabase db push
```

> Esto aplica TODAS las migraciones nuevas que detecte (el repo ya está
> orden correcto por timestamp).

### Opción C: Pídeme aplicarlas vía MCP

En el siguiente prompt me dices "aplica las 5 migraciones pendientes vía MCP".
Yo te pediré confirmación explícita y las aplico una a una.

## Después de aplicarlas

1. **Verificar que el manifesto gate se activa**:
   - Crea cuenta nueva en `app.estoicismodigital.com/sign-up`
   - Debería redirigir automáticamente a `/onboarding/manifiesto`
   - Firma → debería redirigir a `/onboarding/wizard`
   - Completa el wizard → debería llegar a `/`

2. **Verificar Sol/Luna**:
   - Abre `/` o `/hoy`
   - Deben aparecer dos secciones nuevas: "☀ Mi mañana" y "🌙 Mi noche"
   - Escribe en ambas → indicador "Guardando…" → "Guardado hace 1s"

3. **Verificar /revision-semanal**:
   - Abre el shortcut "📓 Cierre semanal" al final de `/hoy`
   - 4 cards de pilares con prompts

4. **Verificar tutorial interactivo** (solo cuentas nuevas):
   - Después del wizard, al llegar a `/`, debe aparecer el overlay con
     tooltips paso a paso sobre Sol/Luna.

## Si algo falla

- **Error "permission denied"** al aplicar SQL → revisa que estés usando
  el rol correcto (service_role / postgres).
- **Error "function set_updated_at does not exist"** → ya existe en migraciones
  anteriores. Si por alguna razón se borró, búscala en
  `supabase/migrations/20260419000000_init.sql`.
- **Usuarios existentes quedan bloqueados en /onboarding/manifiesto** → es
  esperado por diseño. Si quieres "grandfatherearlos", inserta una fila por
  cada user en `user_signed_manifesto` con su `signed_name = email`:

```sql
INSERT INTO public.user_signed_manifesto (user_id, signed_name, signed_at, manifesto_version)
SELECT id, COALESCE(raw_user_meta_data->>'name', email), now(), 'v1'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

  Y mismo patrón para `mindset_mpd` si quieres saltarles el wizard
  (no recomendado — perdiste lo más importante de la agenda).
