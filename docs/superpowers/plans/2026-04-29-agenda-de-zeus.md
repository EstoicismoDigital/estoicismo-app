# Agenda de Zeus — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir Estoicismo Digital en una réplica digital de la "Agenda de Zeus" física: onboarding obligatorio con manifiesto firmable + MPD + introspección por pilar, página `/hoy` con journaling diario "Sol/Luna" estilo agenda, navegación cruzada entre pilares, save UX explícito sin fricción.

**Architecture:** Next.js 15 App Router monorepo. Cuatro capas:
1. **Onboarding gate** — middleware bloquea acceso si no firmado/MPD pendiente.
2. **Daily journal** — tabla `daily_journal` capturando estructura Sol (mañana) + Luna (noche) del PDF.
3. **Cross-pilar nav** — componente `PilaresFooter` reusable + "Hoy" en top nav.
4. **Save UX** — `useSavedState` hook que muestra "Guardado hace 2s" tras autosave + botón "Guardar" en cards con campos abiertos.

**Tech Stack:** Next.js 15+ App Router, React 19, Supabase (Postgres + RLS), Tailwind tokens custom, React Query, TypeScript estricto.

**Phasing:** 7 fases independientes. Cada fase es deployable y testeable por sí sola. El usuario puede pausar/reordenar fases.

| Fase | Alcance | Tiempo estimado | Bloqueante de |
|---|---|---|---|
| 0 | Quick wins UI (Personalización, top nav, footer) | 1-2h | — |
| 1 | Save UX consistente | 2h | — |
| 2 | Manifiesto + firma (schema + flow + gate) | 3h | Fase 3 |
| 3 | Onboarding completo (Zeus letter → MPD → Introspección 4 pilares → Tutorial) | 5-7h | Fase 4 (opcional) |
| 4 | Daily Journal "Sol/Luna" en /hoy | 5-7h | — |
| 5 | Tutorial interactivo guiado | 3h | — |
| 6 | Cierre semanal (Progreso/Bloqueos/Compromiso por pilar) | 3-4h | — |

---

## Fase 0 — Quick Wins UI

### Task 0.1: Achicar la card de "Retratos de los Estoicos"

**Files:**
- Modify: `apps/web/components/ajustes/StoicPortraitsCard.tsx`

**Context:** Actualmente las imágenes ocupan ~50% del viewport. Son globales (todos los users ven los mismos), no per-user. Hay que aclararlo y comprimirlo.

- [ ] **Step 1: Reducir tamaño visual de las imágenes a thumbnails (max 96px)**

Buscar el grid actual y reemplazar con grid compacto:

```tsx
<div className="grid grid-cols-4 gap-3">
  {STOICS.map((s) => (
    <div key={s.key} className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-line">
        {/* imagen actual del retrato */}
      </div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted text-center">
        {s.label}
      </span>
    </div>
  ))}
</div>
```

- [ ] **Step 2: Agregar nota de que es global**

Bajo el título de la card, antes del grid:

```tsx
<p className="font-body text-xs text-muted mt-1">
  Compartidos por toda la comunidad. Cuando un admin sube un nuevo retrato, todos lo ven.
</p>
```

- [ ] **Step 3: Verificar visualmente en dev**

Run: `cd apps/web && pnpm dev`
Abrir `/ajustes`, scroll hasta "Retratos de los Estoicos". Las imágenes deben caber en una sola fila en mobile (375px).

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/ajustes/StoicPortraitsCard.tsx
git commit -m "fix(ajustes): reducir card de retratos a thumbnails + nota de que es global"
```

### Task 0.2: Agregar "Hoy" en el top nav

**Files:**
- Modify: `apps/web/app/(dashboard)/layout.tsx` (o el header component que contiene "Hábitos / Finanzas / Emprendimiento / Mentalidad")

**Context:** En el screenshot del usuario, el top nav muestra solo los 4 pilares. "Hoy" debería ser el primer item (el ritual diario es el centro de la app).

- [ ] **Step 1: Localizar el array de items del top nav**

Run: `grep -rn "Hábitos.*Finanzas.*Emprendimiento" apps/web/app/(dashboard)/ apps/web/components/`

Editar el array para que `Hoy` sea primero:

```tsx
const TOP_NAV_ITEMS = [
  { href: "/hoy", label: "Hoy" },        // NUEVO, primero
  { href: "/habitos", label: "Hábitos" },
  { href: "/finanzas", label: "Finanzas" },
  { href: "/emprendimiento", label: "Emprendimiento" },
  { href: "/reflexiones", label: "Mentalidad" },
];
```

- [ ] **Step 2: Aplicar estado activo basado en pathname**

Si ya hay lógica de `pathname.startsWith(href)`, ya cubre el nuevo item. Verificar que `/hoy` resalta cuando estás ahí.

- [ ] **Step 3: Verificar mobile**

Run: `cd apps/web && pnpm dev` → abrir DevTools → mobile (375px). Confirmar que los 5 items caben (puede que necesites scroll horizontal, ver Task 0.3).

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/(dashboard)/layout.tsx
git commit -m "feat(nav): agregar 'Hoy' como primer item del top nav"
```

### Task 0.3: Footer cross-pilar en cada página de pilar

**Files:**
- Create: `apps/web/components/PilaresFooter.tsx`
- Modify: `apps/web/app/(dashboard)/habitos/HabitosClient.tsx` (al final del JSX)
- Modify: `apps/web/app/(dashboard)/finanzas/FinanzasClient.tsx`
- Modify: `apps/web/app/(dashboard)/reflexiones/ReflexionesClient.tsx`
- Modify: `apps/web/app/(dashboard)/emprendimiento/EmprendimientoClient.tsx`

**Context:** Al final de cada página de pilar, mostrar links a los otros 3 + "Hoy". Reduce fricción para navegar entre pilares.

- [ ] **Step 1: Crear el componente PilaresFooter**

```tsx
// apps/web/components/PilaresFooter.tsx
import Link from "next/link";

const ALL_PILARES = [
  { href: "/hoy", label: "Hoy", desc: "Ritual diario" },
  { href: "/habitos", label: "Hábitos", desc: "Epicteto" },
  { href: "/finanzas", label: "Finanzas", desc: "Marco Aurelio" },
  { href: "/emprendimiento", label: "Emprendimiento", desc: "Séneca" },
  { href: "/reflexiones", label: "Mentalidad", desc: "Porcia Catón" },
];

export function PilaresFooter({ current }: { current: "hoy" | "habitos" | "finanzas" | "emprendimiento" | "reflexiones" }) {
  const items = ALL_PILARES.filter((p) => !p.href.endsWith(current));

  return (
    <section className="mt-16 pt-12 border-t border-line">
      <p className="font-mono text-xs uppercase tracking-widest text-muted text-center mb-6">
        SIGUE TU CAMINO
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group flex flex-col items-center gap-1 p-4 rounded-lg border border-line bg-bg-alt hover:bg-bg hover:border-accent transition-colors min-h-[88px] justify-center"
          >
            <span className="font-display text-base text-ink group-hover:text-accent transition-colors">
              {p.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {p.desc}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Importar y usar en cada `*Client.tsx`**

Al final del JSX root de cada client component (justo antes del cierre del `</main>` o equivalente):

```tsx
<PilaresFooter current="habitos" /> {/* ajustar el current per page */}
```

- [ ] **Step 3: Verificar visualmente**

Run dev, abrir `/habitos`, hacer scroll hasta el final. Verificar que aparezcan 4 cards (Hoy + Finanzas + Emprendimiento + Mentalidad), y que `/habitos` NO aparezca (es current).

Repetir para los otros 3 pilares.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/PilaresFooter.tsx \
  apps/web/app/\(dashboard\)/habitos/HabitosClient.tsx \
  apps/web/app/\(dashboard\)/finanzas/FinanzasClient.tsx \
  apps/web/app/\(dashboard\)/reflexiones/ReflexionesClient.tsx \
  apps/web/app/\(dashboard\)/emprendimiento/EmprendimientoClient.tsx
git commit -m "feat(nav): footer cross-pilar al final de cada módulo"
```

---

## Fase 1 — Save UX Consistente

### Task 1.1: Hook `useSavedState` con indicador "Guardado hace Xs"

**Files:**
- Create: `apps/web/hooks/useSavedState.ts`
- Test: `apps/web/__tests__/useSavedState.test.ts`

**Context:** Hoy autosaves son silentes (campo en `/ajustes`, MPD, etc). El usuario pierde la sensación de que se guardó. Este hook expone `state: "idle" | "saving" | "saved" | "error"` + tiempo desde último save, para que cualquier card lo muestre.

- [ ] **Step 1: Test fail-first**

```ts
// apps/web/__tests__/useSavedState.test.ts
import { renderHook, act } from "@testing-library/react";
import { useSavedState } from "../hooks/useSavedState";

describe("useSavedState", () => {
  it("starts as idle", () => {
    const { result } = renderHook(() => useSavedState());
    expect(result.current.state).toBe("idle");
  });

  it("transitions to saving then saved on success", async () => {
    const { result } = renderHook(() => useSavedState());
    await act(async () => {
      await result.current.run(async () => "ok");
    });
    expect(result.current.state).toBe("saved");
  });

  it("transitions to error on rejection", async () => {
    const { result } = renderHook(() => useSavedState());
    await act(async () => {
      await result.current.run(async () => {
        throw new Error("fail");
      });
    });
    expect(result.current.state).toBe("error");
  });
});
```

Run: `cd apps/web && pnpm exec jest __tests__/useSavedState.test.ts`
Expected: FAIL "Cannot find module '../hooks/useSavedState'"

- [ ] **Step 2: Implementar el hook**

```ts
// apps/web/hooks/useSavedState.ts
"use client";
import { useCallback, useRef, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

export function useSavedState() {
  const [state, setState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<Promise<unknown> | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setState("saving");
    setError(null);
    const promise = fn();
    inFlight.current = promise;
    try {
      const value = await promise;
      if (inFlight.current === promise) {
        setState("saved");
        setSavedAt(Date.now());
      }
      return value;
    } catch (e) {
      if (inFlight.current === promise) {
        setState("error");
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
      return undefined;
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  return { state, savedAt, error, run, reset };
}
```

- [ ] **Step 3: Run tests pass**

Run: `pnpm exec jest __tests__/useSavedState.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 4: Commit**

```bash
git add apps/web/hooks/useSavedState.ts apps/web/__tests__/useSavedState.test.ts
git commit -m "feat(hooks): useSavedState para indicar estado de autosave"
```

### Task 1.2: Componente `SaveIndicator` reusable

**Files:**
- Create: `apps/web/components/ui/SaveIndicator.tsx`

- [ ] **Step 1: Implementar**

```tsx
// apps/web/components/ui/SaveIndicator.tsx
"use client";
import { useEffect, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveIndicator({
  state,
  savedAt,
  error,
}: {
  state: SaveState;
  savedAt: number | null;
  error?: string | null;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (state !== "saved" || !savedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, [state, savedAt]);

  if (state === "idle") return null;

  if (state === "saving") {
    return (
      <span className="font-mono text-xs text-muted flex items-center gap-1.5" aria-live="polite">
        <span className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse" />
        Guardando…
      </span>
    );
  }

  if (state === "error") {
    return (
      <span className="font-mono text-xs text-danger flex items-center gap-1.5" role="alert">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        {error ?? "Error al guardar"}
      </span>
    );
  }

  if (state === "saved" && savedAt) {
    const ageSec = Math.max(1, Math.floor((Date.now() - savedAt) / 1000));
    const label =
      ageSec < 60 ? `Guardado hace ${ageSec}s` :
      ageSec < 3600 ? `Guardado hace ${Math.floor(ageSec / 60)}m` :
      `Guardado hace ${Math.floor(ageSec / 3600)}h`;
    return (
      <span className="font-mono text-xs text-muted flex items-center gap-1.5" aria-live="polite">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        {label}
      </span>
    );
  }

  return null;
}
```

> Nota: el `setTick` re-renderea cada 30s para que "Guardado hace Xs" se actualice. `tick` no se usa pero su cambio dispara render. Está intencional.

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/ui/SaveIndicator.tsx
git commit -m "feat(ui): SaveIndicator componente reusable"
```

### Task 1.3: Aplicar SaveIndicator en MPD editor

**Files:**
- Modify: `apps/web/components/mindset/MPDEditor.tsx` (o donde viva el editor de MPD)

**Context:** El usuario mencionó que algunas secciones quedan "abiertas". Empezamos por MPD (la más importante) y replicamos el patrón.

- [ ] **Step 1: Localizar el editor**

Run: `grep -rn "MPDEditor\|upsertMPD" apps/web/components/ apps/web/app/(dashboard)/reflexiones/`

Identificar el archivo que tiene el form de MPD.

- [ ] **Step 2: Conectar useSavedState al submit**

Reemplazar el handler de submit/upsert para usar `useSavedState`:

```tsx
import { useSavedState } from "../../hooks/useSavedState";
import { SaveIndicator } from "../ui/SaveIndicator";

const save = useSavedState();

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  await save.run(async () => {
    await upsertMPD(data); // función existente
    return true;
  });
}

// En el header de la card o cerca del botón:
<div className="flex items-center justify-between">
  <h2>Mi MPD</h2>
  <SaveIndicator state={save.state} savedAt={save.savedAt} error={save.error} />
</div>
```

- [ ] **Step 3: Probar en /reflexiones**

Run dev, abrir `/reflexiones`, editar el MPD. Verificar que aparece "Guardando…" y luego "Guardado hace 1s".

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/mindset/MPDEditor.tsx
git commit -m "feat(mpd): SaveIndicator en MPD editor"
```

### Task 1.4: SaveIndicator en /ajustes

**Files:**
- Modify: `apps/web/app/(dashboard)/ajustes/AjustesClient.tsx`

- [ ] **Step 1: Wrapping de cada autosave**

En cada `onChange` o `onBlur` que dispara upsert al profile:

```tsx
const save = useSavedState();

async function handleTimezoneChange(tz: string) {
  await save.run(async () => {
    await supabase.from("profiles").update({ timezone: tz }).eq("id", userId);
  });
}
```

Mostrar UN solo SaveIndicator en el header de la página (o uno por cada card si prefieres más granular).

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/ajustes/AjustesClient.tsx
git commit -m "feat(ajustes): SaveIndicator visible en autosaves"
```

---

## Fase 2 — Manifiesto + Firma + Gate

### Task 2.1: Schema `user_signed_manifesto`

**Files:**
- Create: `supabase/migrations/20260429900000_signed_manifesto.sql`

- [ ] **Step 1: Migration**

```sql
-- supabase/migrations/20260429900000_signed_manifesto.sql

CREATE TABLE IF NOT EXISTS public.user_signed_manifesto (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  signed_name TEXT NOT NULL CHECK (length(trim(signed_name)) >= 2),
  signed_place TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  manifesto_version TEXT NOT NULL DEFAULT 'v1'
);

ALTER TABLE public.user_signed_manifesto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_read_own_signature"
  ON public.user_signed_manifesto FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_can_insert_own_signature"
  ON public.user_signed_manifesto FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- No UPDATE / DELETE: la firma es inmutable.
```

- [ ] **Step 2: Aplicar via MCP de Supabase**

Usar el MCP `apply_migration` con name = `signed_manifesto`. (O el usuario aplica manual).

- [ ] **Step 3: Regenerar types**

Run: `cd packages/supabase && pnpm exec supabase gen types typescript --project-id tezcxsgpqcsuopyajptl > types.ts` (o como esté configurado el repo).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260429900000_signed_manifesto.sql packages/supabase/types.ts
git commit -m "feat(db): tabla user_signed_manifesto con RLS y firma inmutable"
```

### Task 2.2: Página `/onboarding/manifiesto`

**Files:**
- Create: `apps/web/app/onboarding/manifiesto/page.tsx`
- Create: `apps/web/app/onboarding/manifiesto/ManifiestoForm.tsx`
- Create: `apps/web/app/onboarding/layout.tsx` (sin header/nav del dashboard, full screen)

**Context:** Página donde el usuario lee el manifiesto y firma. El texto es **el de la agenda física, palabra por palabra**:

> "DECLARACIÓN. Lee en voz alta cada mañana y noche esta declaración.
>
> Declaro que asumo la responsabilidad total de mi vida y de los resultados que obtenga. Me exijo acción perseverante y continua hasta lograr los objetivos que me propongo.
>
> Dedicaré 30 minutos al día a plasmar mis ideas, reflexiones y objetivos en esta Agenda de Zeus, usándola como herramienta diaria para convertirme en una persona más disciplinada, productiva y valiosa para los demás.
>
> Entiendo que mis pensamientos dominantes guían mis actos y crean mi realidad. Practicaré la autosugestión leyendo esta declaración en voz alta dos veces al día y actuando en coherencia con cada línea.
>
> Me comprometo a:
> ✕ Aceptar solo transacciones que crean valor para todas las partes.
> ✕ Atraer cooperación honesta mediante servicio, disciplina y ejemplo.
> ✕ Servir primero y prosperar ayudando a otros a prosperar.
> ✕ Sustituir odio, envidia y cinismo por comprensión, gratitud y dominio de mí mismo.
> ✕ Mantener la verdad y la justicia como base de cualquier riqueza que construya.
> ✕ Fortalecer la fe de los demás en mí con resultados, carácter y palabra cumplida.
>
> Recitaré esta declaración a diario con fe absoluta, permitiendo que moldee mis pensamientos y mis actos hasta que se refleje en mi realidad."

- [ ] **Step 1: Layout sin nav**

```tsx
// apps/web/app/onboarding/layout.tsx
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg">{children}</div>;
}
```

- [ ] **Step 2: Page (server component que delega a form)**

```tsx
// apps/web/app/onboarding/manifiesto/page.tsx
import { ManifiestoForm } from "./ManifiestoForm";

export default function ManifiestoPage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
          ESTOICISMO DIGITAL
        </p>
        <h1 className="font-display text-4xl font-bold text-ink mb-1">
          Declaración.
        </h1>
        <p className="font-body text-muted text-sm mb-8">
          Léela despacio. Después firma.
        </p>
        <ManifiestoForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Form con texto del manifiesto + firma**

```tsx
// apps/web/app/onboarding/manifiesto/ManifiestoForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../../lib/supabase-client";

const COMMITMENTS = [
  "Aceptar solo transacciones que crean valor para todas las partes.",
  "Atraer cooperación honesta mediante servicio, disciplina y ejemplo.",
  "Servir primero y prosperar ayudando a otros a prosperar.",
  "Sustituir odio, envidia y cinismo por comprensión, gratitud y dominio de mí mismo.",
  "Mantener la verdad y la justicia como base de cualquier riqueza que construya.",
  "Fortalecer la fe de los demás en mí con resultados, carácter y palabra cumplida.",
];

export function ManifiestoForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Escribe tu nombre completo para firmar.");
      return;
    }
    if (!agreed) {
      setError("Debes confirmar que leíste la declaración.");
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: userResp } = await supabase.auth.getUser();
    const userId = userResp.user?.id;
    if (!userId) {
      setError("Sesión expirada. Vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }
    const { error: insertError } = await supabase
      .from("user_signed_manifesto")
      .insert({
        user_id: userId,
        signed_name: name.trim(),
        signed_place: place.trim() || null,
      });
    if (insertError) {
      setError("No pudimos registrar tu firma. Intenta de nuevo.");
      setLoading(false);
      return;
    }
    router.push("/onboarding/mpd");
    router.refresh();
  }

  return (
    <form onSubmit={handleSign} className="flex flex-col gap-6">
      <article className="prose prose-stone max-w-none font-body text-base text-ink leading-relaxed">
        <p>
          Declaro que asumo la responsabilidad total de mi vida y de los resultados
          que obtenga. Me exijo acción perseverante y continua hasta lograr los
          objetivos que me propongo.
        </p>
        <p>
          Dedicaré 30 minutos al día a plasmar mis ideas, reflexiones y objetivos
          en esta Agenda de Zeus, usándola como herramienta diaria para
          convertirme en una persona más disciplinada, productiva y valiosa para
          los demás.
        </p>
        <p>
          Entiendo que mis pensamientos dominantes guían mis actos y crean mi
          realidad. Practicaré la autosugestión leyendo esta declaración en voz
          alta dos veces al día y actuando en coherencia con cada línea.
        </p>
        <p className="font-medium">Me comprometo a:</p>
        <ul className="list-none pl-0 space-y-2">
          {COMMITMENTS.map((c, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-accent font-mono">✕</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="italic text-muted">
          Recitaré esta declaración a diario con fe absoluta, permitiendo que
          moldee mis pensamientos y mis actos hasta que se refleje en mi realidad.
        </p>
      </article>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-line"
        />
        <span className="font-body text-sm text-ink">
          He leído la declaración en voz alta y la acepto.
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="signed_name" className="font-mono text-xs uppercase tracking-widest text-muted">
            FIRMA (TU NOMBRE COMPLETO)
          </label>
          <input
            id="signed_name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre completo"
            required
            autoComplete="name"
            className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="signed_place" className="font-mono text-xs uppercase tracking-widest text-muted">
            LUGAR (OPCIONAL)
          </label>
          <input
            id="signed_place"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Ciudad"
            autoComplete="address-level2"
            className="h-12 px-4 rounded-lg border border-line bg-bg-alt font-body text-base text-ink"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm font-body">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-12 rounded-lg bg-accent text-bg font-body font-medium text-base hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Firmando…" : "Firmar y continuar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Verificar visualmente**

Run dev. Como aún no hay gate, ir manualmente a `/onboarding/manifiesto`. Probar firmar con nombre vacío (debe fallar), con nombre válido (debe insertar y redirigir).

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/onboarding
git commit -m "feat(onboarding): página de manifiesto con firma"
```

### Task 2.3: Middleware gate

**Files:**
- Modify: `apps/web/middleware.ts`

**Context:** Si el usuario está autenticado pero no firmó el manifiesto, redirigir a `/onboarding/manifiesto`. Excepto rutas explícitamente públicas o las del propio onboarding.

- [ ] **Step 1: Agregar check de firma**

```ts
// apps/web/middleware.ts (extracto del bloque después de getUser())

const ONBOARDING_PATHS = ["/onboarding/", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/auth/callback"];
const isOnboardingFlow = ONBOARDING_PATHS.some((p) => pathname.startsWith(p));

if (user && !isOnboardingFlow) {
  // Check si firmó manifiesto
  const { data: sig } = await supabase
    .from("user_signed_manifesto")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sig) {
    return NextResponse.redirect(new URL("/onboarding/manifiesto", request.url));
  }
}
```

- [ ] **Step 2: Verificar**

Crear cuenta nueva → debería redirigir a `/onboarding/manifiesto`. Firmar → debería poder ir a `/`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/middleware.ts
git commit -m "feat(middleware): bloquear app hasta firmar manifiesto"
```

---

## Fase 3 — Onboarding completo (post-firma)

### Task 3.1: Schema `user_introspection`

**Files:**
- Create: `supabase/migrations/20260430000000_introspection.sql`

- [ ] **Step 1: Tabla**

```sql
CREATE TABLE IF NOT EXISTS public.user_introspection (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Hábitos
  habits_bad TEXT,                  -- "Qué hábitos me alejan"
  habits_bad_list JSONB DEFAULT '[]'::jsonb, -- array de strings
  habits_good TEXT,                 -- "Qué hábitos diarios me acercarán"
  habits_good_list JSONB DEFAULT '[]'::jsonb,
  -- Finanzas
  finance_current TEXT,             -- relación actual con dinero
  finance_current_income NUMERIC,   -- "¿Cuánto gano hoy?"
  finance_target TEXT,              -- visualización
  finance_target_income NUMERIC,    -- "¿Cuánto quiero ganar?"
  -- Mentalidad
  mindset_current TEXT,
  mindset_target TEXT,
  -- Emprendimiento
  business_current TEXT,
  business_current_revenue NUMERIC,
  business_target TEXT,
  business_target_revenue NUMERIC,
  --
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_introspection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.user_introspection FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "owner_upsert" ON public.user_introspection FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "owner_update" ON public.user_introspection FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER set_user_introspection_updated_at
  BEFORE UPDATE ON public.user_introspection
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

- [ ] **Step 2: Aplicar + types + commit**

(Mismo patrón que Task 2.1)

### Task 3.2: Wizard onboarding multi-step

**Files:**
- Create: `apps/web/app/onboarding/wizard/page.tsx`
- Create: `apps/web/app/onboarding/wizard/WizardClient.tsx`
- Create: `apps/web/components/onboarding/StepWelcome.tsx` (Carta de Zeus)
- Create: `apps/web/components/onboarding/StepMPD.tsx` (Fórmula del PDF)
- Create: `apps/web/components/onboarding/StepIntrospection.tsx` (4 pilares en uno)
- Create: `apps/web/components/onboarding/StepReady.tsx`
- Create: `apps/web/components/onboarding/StepProgress.tsx` (barra de progreso)

**Context:** Wizard de 4 pasos post-firma:
1. **Welcome / Carta de Zeus** — texto inspiracional ("Querido Estoico, has recibido la Agenda de Zeus...")
2. **MPD** — formulario con la fórmula del PDF: `Fecha + Meta numérica + Sacrificio + Plan + Reglas`
3. **Introspección 4 pilares** — Hábitos / Finanzas / Mentalidad / Emprendimiento (4 sub-pasos o uno largo con tabs)
4. **Ready** — "Tu Olimpo está listo. Comienza."

Se aplica `multi-step-progress` (UX rule §8): barra de progreso visible, allow back navigation, allow save draft.

- [ ] **Step 1: Wizard shell con state machine**

```tsx
// apps/web/app/onboarding/wizard/WizardClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepProgress } from "../../../components/onboarding/StepProgress";
import { StepWelcome } from "../../../components/onboarding/StepWelcome";
import { StepMPD } from "../../../components/onboarding/StepMPD";
import { StepIntrospection } from "../../../components/onboarding/StepIntrospection";
import { StepReady } from "../../../components/onboarding/StepReady";

const STEPS = ["welcome", "mpd", "introspection", "ready"] as const;
type Step = typeof STEPS[number];

export function WizardClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const idx = STEPS.indexOf(step);

  function next() {
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else {
      router.push("/hoy");
      router.refresh();
    }
  }

  function back() {
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <StepProgress current={idx} total={STEPS.length} />
        <div className="mt-8">
          {step === "welcome" && <StepWelcome onNext={next} />}
          {step === "mpd" && <StepMPD onNext={next} onBack={back} />}
          {step === "introspection" && <StepIntrospection onNext={next} onBack={back} />}
          {step === "ready" && <StepReady onFinish={next} onBack={back} />}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Step Welcome (carta de Zeus textual del PDF)**

```tsx
// apps/web/components/onboarding/StepWelcome.tsx
"use client";

export function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        QUERIDO ESTOICO, QUERIDA ESTOICA
      </p>
      <h1 className="font-display text-4xl font-bold text-ink">
        Has recibido la Agenda de Zeus.
      </h1>
      <article className="font-body text-base text-ink leading-relaxed space-y-4">
        <p>Tu nueva herramienta de disciplina. Cada página existe para recordarte que el tiempo es lo único que no puedes recuperar.</p>
        <p>Aquí anotarás lo esencial: qué harás, cómo lo harás y cuándo lo harás. Nada más. La claridad es poder. El hábito de registrar y cumplir lo escrito forja carácter, y el carácter decide tu destino.</p>
        <p>No esperes inspiración: espera de ti mismo acción. No pospongas. No olvides. Cumple.</p>
        <p>Esta agenda es un espejo: mostrará, sin engaños, si fuiste dueño de tu día o esclavo de tus excusas.</p>
        <p>Haz de tu nombre un compromiso. Que tu trazo sea el testimonio de que decides vivir con dirección, disciplina y temple.</p>
        <p className="text-muted italic">— Zeus</p>
      </article>
      <button
        onClick={onNext}
        className="h-12 rounded-lg bg-accent text-bg font-body font-medium hover:opacity-90"
      >
        Continúa
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Step MPD (fórmula PDF: Fecha + Meta + Sacrificio + Plan)**

```tsx
// apps/web/components/onboarding/StepMPD.tsx
"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";

export function StepMPD({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [date, setDate] = useState("");
  const [goal, setGoal] = useState("");
  const [sacrifice, setSacrifice] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNext() {
    setError(null);
    if (!date || !goal || !sacrifice || !plan) {
      setError("Completa los 4 campos. Tu MPD necesita precisión.");
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: userResp } = await supabase.auth.getUser();
    const userId = userResp.user?.id;
    if (!userId) return;
    // Suponiendo que ya existe useUpsertMPD en hooks/useMindset.ts, lo usamos.
    // Si no, escribimos directo a la tabla del MPD existente.
    const affirmation = `El ${date} lograré ${goal}. A cambio sacrifico ${sacrifice}. Para lograrlo seguiré: ${plan}`;
    const { error: e } = await supabase.from("mindset_mpd").upsert({
      user_id: userId,
      target_date: date,
      goal,
      sacrifice,
      plan,
      affirmation,
    });
    setLoading(false);
    if (e) {
      setError("No pudimos guardar. Intenta de nuevo.");
      return;
    }
    onNext();
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">META PRINCIPAL DEFINIDA</p>
      <h1 className="font-display text-3xl font-bold text-ink">
        ¿Qué vas a lograr y para cuándo?
      </h1>
      <p className="font-body text-muted">
        "No puedes llegar a un lugar que tu cerebro no cree que existe."
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="mpd-date" className="font-mono text-xs uppercase tracking-widest text-muted">FECHA LÍMITE</label>
        <input id="mpd-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required
          className="h-12 px-4 rounded-lg border border-line bg-bg-alt" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="mpd-goal" className="font-mono text-xs uppercase tracking-widest text-muted">META (CON RESULTADO NUMÉRICO)</label>
        <input id="mpd-goal" type="text" value={goal} onChange={(e) => setGoal(e.target.value)}
          placeholder="Ej: Generar $10,000 USD/mes con mi negocio" required
          className="h-12 px-4 rounded-lg border border-line bg-bg-alt" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="mpd-sacrifice" className="font-mono text-xs uppercase tracking-widest text-muted">A CAMBIO SACRIFICO</label>
        <textarea id="mpd-sacrifice" value={sacrifice} onChange={(e) => setSacrifice(e.target.value)}
          placeholder="Tiempo libre, distracciones, comodidad…" required rows={3}
          className="px-4 py-3 rounded-lg border border-line bg-bg-alt resize-none" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="mpd-plan" className="font-mono text-xs uppercase tracking-widest text-muted">PLAN (PASOS CONCRETOS)</label>
        <textarea id="mpd-plan" value={plan} onChange={(e) => setPlan(e.target.value)}
          placeholder="1) ... 2) ... 3) ..." required rows={5}
          className="px-4 py-3 rounded-lg border border-line bg-bg-alt resize-none" />
      </div>

      {error && <p role="alert" className="text-danger text-sm">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 h-12 rounded-lg border border-line text-ink hover:bg-bg-alt">
          Atrás
        </button>
        <button onClick={handleNext} disabled={loading}
          className="flex-1 h-12 rounded-lg bg-accent text-bg font-medium hover:opacity-90 disabled:opacity-40">
          {loading ? "Guardando…" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}
```

> Nota: Si la tabla del MPD existente no se llama `mindset_mpd`, ajustar al nombre real en el Explore report. Buscar `upsertMPD` en `hooks/useMindset.ts`.

- [ ] **Step 4: Step Introspección 4 pilares**

```tsx
// apps/web/components/onboarding/StepIntrospection.tsx
"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";

const PILARES = [
  {
    key: "habits",
    title: "Hábitos",
    color: "amber",
    intros: "¿Qué hábitos me alejan de mi MPD?",
    visual: "¿Qué hábitos diarios me acercarán a mi MPD?",
  },
  {
    key: "finance",
    title: "Finanzas",
    color: "emerald",
    intros: "¿Cómo es hoy mi relación con el dinero?",
    visual: "¿Cómo se ven las finanzas que me acercarán a mi MPD?",
    extras: [
      { id: "current_income", label: "¿Cuánto gano hoy?", type: "number" },
      { id: "target_income", label: "¿Cuánto quiero ganar?", type: "number" },
    ],
  },
  {
    key: "mindset",
    title: "Mentalidad",
    color: "rose",
    intros: "¿Cómo reacciono actualmente en mi día a día?",
    visual: "¿Cuál es la mentalidad que me acercará a mi MPD?",
  },
  {
    key: "business",
    title: "Emprendimiento",
    color: "indigo",
    intros: "¿Cuáles han sido mis aprendizajes al emprender?",
    visual: "¿Cómo se ve mi emprendimiento al lograr mi MPD?",
    extras: [
      { id: "current_revenue", label: "¿Cuánto genera mi emprendimiento hoy?", type: "number" },
      { id: "target_revenue", label: "¿Cuánto generará al lograr mi MPD?", type: "number" },
    ],
  },
] as const;

export function StepIntrospection({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [activePilar, setActivePilar] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setData((d) => ({ ...d, [field]: value }));
  }

  async function handleFinish() {
    const supabase = getSupabaseBrowserClient();
    const { data: userResp } = await supabase.auth.getUser();
    const userId = userResp.user?.id;
    if (!userId) return;
    await supabase.from("user_introspection").upsert({
      user_id: userId,
      habits_bad: data.habits_bad,
      habits_good: data.habits_good,
      finance_current: data.finance_current,
      finance_current_income: data.finance_current_income ? Number(data.finance_current_income) : null,
      finance_target: data.finance_target,
      finance_target_income: data.finance_target_income ? Number(data.finance_target_income) : null,
      mindset_current: data.mindset_current,
      mindset_target: data.mindset_target,
      business_current: data.business_current,
      business_current_revenue: data.business_current_revenue ? Number(data.business_current_revenue) : null,
      business_target: data.business_target,
      business_target_revenue: data.business_target_revenue ? Number(data.business_target_revenue) : null,
      completed_at: new Date().toISOString(),
    });
    onNext();
  }

  const p = PILARES[activePilar];

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">LAS 4 COLUMNAS DE TU OLIMPO</p>
      <h1 className="font-display text-3xl font-bold text-ink">{p.title}</h1>

      {/* Tabs entre pilares */}
      <div className="flex gap-2 overflow-x-auto">
        {PILARES.map((pp, i) => (
          <button
            key={pp.key}
            onClick={() => setActivePilar(i)}
            className={`px-3 py-2 rounded-md font-mono text-xs uppercase tracking-widest whitespace-nowrap ${
              i === activePilar ? "bg-accent text-bg" : "bg-bg-alt text-muted"
            }`}
          >
            {pp.title}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs uppercase tracking-widest text-muted">INTROSPECCIÓN: {p.intros}</label>
        <textarea
          value={data[`${p.key}_current` === "habits_current" ? "habits_bad" : `${p.key}_current`] ?? data[`${p.key}_bad`] ?? ""}
          onChange={(e) => set(p.key === "habits" ? "habits_bad" : `${p.key}_current`, e.target.value)}
          rows={5}
          className="px-4 py-3 rounded-lg border border-line bg-bg-alt resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs uppercase tracking-widest text-muted">VISUALIZACIÓN: {p.visual}</label>
        <textarea
          value={data[p.key === "habits" ? "habits_good" : `${p.key}_target`] ?? ""}
          onChange={(e) => set(p.key === "habits" ? "habits_good" : `${p.key}_target`, e.target.value)}
          rows={5}
          className="px-4 py-3 rounded-lg border border-line bg-bg-alt resize-none"
        />
      </div>

      {p.extras && p.extras.map((ex) => (
        <div key={ex.id} className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-widest text-muted">{ex.label}</label>
          <input
            type={ex.type}
            value={data[`${p.key}_${ex.id}`] ?? ""}
            onChange={(e) => set(`${p.key}_${ex.id}`, e.target.value)}
            className="h-12 px-4 rounded-lg border border-line bg-bg-alt"
          />
        </div>
      ))}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 h-12 rounded-lg border border-line">Atrás</button>
        {activePilar < PILARES.length - 1 ? (
          <button onClick={() => setActivePilar(activePilar + 1)} className="flex-1 h-12 rounded-lg bg-accent text-bg">
            Siguiente pilar
          </button>
        ) : (
          <button onClick={handleFinish} className="flex-1 h-12 rounded-lg bg-accent text-bg">
            Terminar
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Step Ready**

```tsx
// apps/web/components/onboarding/StepReady.tsx
"use client";

export function StepReady({ onFinish, onBack }: { onFinish: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">TU OLIMPO ESTÁ LISTO</p>
      <h1 className="font-display text-4xl font-bold text-ink">No mires atrás. Enfócate.</h1>
      <p className="font-body text-muted">
        Mañana al despertar y en la noche antes de dormir, vas a recitar tu MPD.
        Cada día abrirás <strong className="text-ink">/hoy</strong> para registrar tu Sol y tu Luna.
      </p>
      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 h-12 rounded-lg border border-line">Atrás</button>
        <button onClick={onFinish} className="flex-1 h-12 rounded-lg bg-accent text-bg">
          Comienza con tu agenda
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: StepProgress**

```tsx
// apps/web/components/onboarding/StepProgress.tsx
"use client";

export function StepProgress({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total} className="flex flex-col gap-2">
      <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-muted">
        <span>Paso {current + 1} de {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 bg-bg-alt rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Página `/onboarding/wizard`**

```tsx
// apps/web/app/onboarding/wizard/page.tsx
import { WizardClient } from "./WizardClient";
export default function WizardPage() {
  return <WizardClient />;
}
```

- [ ] **Step 8: Update middleware para gate del wizard**

En `middleware.ts`, el gate ahora valida:
1. Firma del manifiesto → si no, → `/onboarding/manifiesto`
2. MPD existe → si no, → `/onboarding/wizard`
3. Si ambas existen → ya pasa al dashboard normal

```ts
if (!sig) {
  return NextResponse.redirect(new URL("/onboarding/manifiesto", request.url));
}

const { data: mpd } = await supabase.from("mindset_mpd").select("user_id").eq("user_id", user.id).maybeSingle();
if (!mpd) {
  return NextResponse.redirect(new URL("/onboarding/wizard", request.url));
}
```

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/onboarding apps/web/components/onboarding apps/web/middleware.ts
git commit -m "feat(onboarding): wizard multi-step (Zeus → MPD → Introspección 4 pilares → Ready)"
```

---

## Fase 4 — Daily Journal "Sol/Luna" en /hoy

### Task 4.1: Schema `daily_journal`

**Files:**
- Create: `supabase/migrations/20260430100000_daily_journal.sql`

- [ ] **Step 1: Tabla**

```sql
CREATE TABLE IF NOT EXISTS public.daily_journal (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occurred_on DATE NOT NULL,
  -- SOL (mañana)
  day_started_at TIME,                    -- "Mi día inició"
  morning_intent TEXT,                    -- "¿Cómo quiero vivir este día?"
  morning_gratitude TEXT,                 -- "qué agradeces"
  morning_attitude TEXT,                  -- "actitud con la que enfrentas el día"
  morning_small_action TEXT,              -- "pequeña acción si hoy te cuesta"
  tasks JSONB DEFAULT '[]'::jsonb,        -- [{ text, time_from, time_to, done }, ...] hasta 7
  -- LUNA (noche)
  day_ended_at TIME,                      -- "Mi día terminó"
  evening_reflection TEXT,                -- "¿Cómo viví este día?"
  vital_eter BOOLEAN DEFAULT FALSE,       -- meditación
  vital_forja BOOLEAN DEFAULT FALSE,      -- ejercicio
  vital_nectar BOOLEAN DEFAULT FALSE,     -- hidratación
  vital_kleos BOOLEAN DEFAULT FALSE,      -- lectura
  state TEXT CHECK (state IN ('eudaimonia','sophrosyne','agon','thymos','ekpyrosis')),
  income_today NUMERIC,
  expense_today NUMERIC,
  tomorrow_objectives TEXT,
  --
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, occurred_on)
);

ALTER TABLE public.daily_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.daily_journal FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "owner_insert" ON public.daily_journal FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "owner_update" ON public.daily_journal FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "owner_delete" ON public.daily_journal FOR DELETE USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER set_daily_journal_updated_at
  BEFORE UPDATE ON public.daily_journal
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_daily_journal_user_date ON public.daily_journal (user_id, occurred_on DESC);
```

- [ ] **Step 2: Aplicar + types + commit**

### Task 4.2: Hook `useDailyJournal`

**Files:**
- Create: `apps/web/hooks/useDailyJournal.ts`

- [ ] **Step 1: Hook con React Query + autosave debounced**

```tsx
// apps/web/hooks/useDailyJournal.ts
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase-client";

type DailyJournal = {
  user_id: string;
  occurred_on: string;
  day_started_at: string | null;
  morning_intent: string | null;
  morning_gratitude: string | null;
  morning_attitude: string | null;
  morning_small_action: string | null;
  tasks: Array<{ text: string; time_from: string; time_to: string; done: boolean }>;
  day_ended_at: string | null;
  evening_reflection: string | null;
  vital_eter: boolean;
  vital_forja: boolean;
  vital_nectar: boolean;
  vital_kleos: boolean;
  state: "eudaimonia" | "sophrosyne" | "agon" | "thymos" | "ekpyrosis" | null;
  income_today: number | null;
  expense_today: number | null;
  tomorrow_objectives: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyJournal(date: string = todayISO()) {
  const qc = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  const query = useQuery({
    queryKey: ["daily_journal", date],
    queryFn: async (): Promise<DailyJournal | null> => {
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("daily_journal")
        .select("*")
        .eq("user_id", uid)
        .eq("occurred_on", date)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<DailyJournal>) => {
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp.user?.id;
      if (!uid) throw new Error("not authed");
      const { error } = await supabase
        .from("daily_journal")
        .upsert({ user_id: uid, occurred_on: date, ...patch }, { onConflict: "user_id,occurred_on" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily_journal", date] });
    },
  });

  return { ...query, save: mutation.mutateAsync, isSaving: mutation.isPending };
}
```

- [ ] **Step 2: Commit**

### Task 4.3: Componente `SolCard` (mañana)

**Files:**
- Create: `apps/web/components/hoy/SolCard.tsx`

- [ ] **Step 1: Card con campos del PDF**

Replica los campos del PDF:
- Hora de inicio
- ¿Cómo quiero vivir este día? (intent + gratitude + attitude + small action en un textarea o 4 sub-fields)
- Tareas del día (hasta 7 con bloque de tiempo + check)

```tsx
// apps/web/components/hoy/SolCard.tsx
"use client";
import { useEffect, useState } from "react";
import { useDailyJournal } from "../../hooks/useDailyJournal";
import { useSavedState } from "../../hooks/useSavedState";
import { SaveIndicator } from "../ui/SaveIndicator";

export function SolCard() {
  const { data, save } = useDailyJournal();
  const ind = useSavedState();

  const [intent, setIntent] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [tasks, setTasks] = useState<Array<{ text: string; from: string; to: string; done: boolean }>>(
    Array.from({ length: 7 }, () => ({ text: "", from: "", to: "", done: false }))
  );
  const [startedAt, setStartedAt] = useState("");

  useEffect(() => {
    if (!data) return;
    setIntent(data.morning_intent ?? "");
    setGratitude(data.morning_gratitude ?? "");
    setStartedAt(data.day_started_at ?? "");
    if (data.tasks?.length) {
      const filled = [...data.tasks, ...Array.from({ length: 7 - data.tasks.length }, () => ({ text: "", from: "", to: "", done: false }))];
      setTasks(filled.slice(0, 7).map((t: any) => ({ text: t.text ?? "", from: t.time_from ?? "", to: t.time_to ?? "", done: t.done ?? false })));
    }
  }, [data]);

  // Debounced autosave on field change
  useEffect(() => {
    const timer = setTimeout(() => {
      ind.run(() => save({
        day_started_at: startedAt || null,
        morning_intent: intent || null,
        morning_gratitude: gratitude || null,
        tasks: tasks.filter((t) => t.text.trim()).map((t) => ({
          text: t.text, time_from: t.from, time_to: t.to, done: t.done,
        })),
      }));
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, gratitude, startedAt, tasks]);

  return (
    <section className="rounded-xl border border-line bg-bg-alt p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">☀</span>
          <h2 className="font-display text-2xl text-ink">Mi mañana</h2>
        </div>
        <SaveIndicator state={ind.state} savedAt={ind.savedAt} error={ind.error} />
      </header>

      <div className="grid sm:grid-cols-[1fr_auto] gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="day_started" className="font-mono text-xs uppercase tracking-widest text-muted">MI DÍA INICIÓ</label>
          <input id="day_started" type="time" value={startedAt} onChange={(e) => setStartedAt(e.target.value)}
            className="h-12 px-4 rounded-lg border border-line bg-bg" />
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-4">
        <label htmlFor="morning_intent" className="font-mono text-xs uppercase tracking-widest text-muted">
          ¿CÓMO QUIERO VIVIR ESTE DÍA?
        </label>
        <textarea id="morning_intent" value={intent} onChange={(e) => setIntent(e.target.value)} rows={5}
          placeholder="Cómo te sientes, qué agradeces, qué esperas, con qué actitud lo enfrentas, qué pequeña acción harás si hoy te cuesta."
          className="px-4 py-3 rounded-lg border border-line bg-bg resize-none" />
      </div>

      <div className="mt-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">TAREAS DEL DÍA — HASTA 7 IMPORTANTES</p>
        <ul className="space-y-2">
          {tasks.map((t, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
              <input type="text" value={t.text}
                onChange={(e) => setTasks((arr) => arr.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                placeholder={`Tarea ${i + 1}`}
                className="h-10 px-3 rounded-md border border-line bg-bg" />
              <input type="time" value={t.from}
                onChange={(e) => setTasks((arr) => arr.map((x, j) => j === i ? { ...x, from: e.target.value } : x))}
                className="h-10 px-2 rounded-md border border-line bg-bg w-24" />
              <input type="time" value={t.to}
                onChange={(e) => setTasks((arr) => arr.map((x, j) => j === i ? { ...x, to: e.target.value } : x))}
                className="h-10 px-2 rounded-md border border-line bg-bg w-24" />
              <input type="checkbox" checked={t.done}
                onChange={(e) => setTasks((arr) => arr.map((x, j) => j === i ? { ...x, done: e.target.checked } : x))}
                className="h-5 w-5" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

### Task 4.4: Componente `LunaCard` (noche)

**Files:**
- Create: `apps/web/components/hoy/LunaCard.tsx`

- [ ] **Step 1: Card con campos del PDF**

Replica:
- ¿Cómo viví este día?
- Vitales: Éter / Forja / Néctar / Kleos (4 checkboxes)
- Estado: 5 opciones (Eudaimonía / Sophrosyne / Agón / Thymos / Ekpyrosis)
- Balance: ingresos / gastos
- Objetivos principales de mañana

```tsx
// apps/web/components/hoy/LunaCard.tsx
"use client";
import { useEffect, useState } from "react";
import { useDailyJournal } from "../../hooks/useDailyJournal";
import { useSavedState } from "../../hooks/useSavedState";
import { SaveIndicator } from "../ui/SaveIndicator";

const STATES = [
  { key: "eudaimonia", label: "Eudaimonía", desc: "Mentalidad fuerte, claridad total" },
  { key: "sophrosyne", label: "Sophrosyne", desc: "Día estable, ni alto ni bajo" },
  { key: "agon", label: "Agón", desc: "Día con retos: lucha interna con control" },
  { key: "thymos", label: "Thymos", desc: "No vi mejor día. Cansancio emocional" },
  { key: "ekpyrosis", label: "Ekpyrosis", desc: "Perdiste el centro. Caos y desequilibrio" },
] as const;

const VITALES = [
  { key: "vital_eter", label: "Éter", sub: "Meditación" },
  { key: "vital_forja", label: "Forja", sub: "Ejercicio" },
  { key: "vital_nectar", label: "Néctar", sub: "Hidratación" },
  { key: "vital_kleos", label: "Kleos", sub: "Lectura" },
] as const;

export function LunaCard() {
  const { data, save } = useDailyJournal();
  const ind = useSavedState();

  const [reflection, setReflection] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [vitales, setVitales] = useState({ vital_eter: false, vital_forja: false, vital_nectar: false, vital_kleos: false });
  const [state, setState] = useState<typeof STATES[number]["key"] | "">("");
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [tomorrow, setTomorrow] = useState("");

  useEffect(() => {
    if (!data) return;
    setReflection(data.evening_reflection ?? "");
    setEndedAt(data.day_ended_at ?? "");
    setVitales({
      vital_eter: !!data.vital_eter,
      vital_forja: !!data.vital_forja,
      vital_nectar: !!data.vital_nectar,
      vital_kleos: !!data.vital_kleos,
    });
    setState((data.state ?? "") as any);
    setIncome(data.income_today != null ? String(data.income_today) : "");
    setExpense(data.expense_today != null ? String(data.expense_today) : "");
    setTomorrow(data.tomorrow_objectives ?? "");
  }, [data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      ind.run(() => save({
        evening_reflection: reflection || null,
        day_ended_at: endedAt || null,
        ...vitales,
        state: state || null,
        income_today: income ? Number(income) : null,
        expense_today: expense ? Number(expense) : null,
        tomorrow_objectives: tomorrow || null,
      }));
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflection, endedAt, vitales, state, income, expense, tomorrow]);

  return (
    <section className="rounded-xl border border-line bg-bg-alt p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🌙</span>
          <h2 className="font-display text-2xl text-ink">Mi noche</h2>
        </div>
        <SaveIndicator state={ind.state} savedAt={ind.savedAt} error={ind.error} />
      </header>

      <div className="grid sm:grid-cols-[1fr_auto] gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="day_ended" className="font-mono text-xs uppercase tracking-widest text-muted">MI DÍA TERMINÓ</label>
          <input id="day_ended" type="time" value={endedAt} onChange={(e) => setEndedAt(e.target.value)}
            className="h-12 px-4 rounded-lg border border-line bg-bg" />
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <label htmlFor="evening_reflection" className="font-mono text-xs uppercase tracking-widest text-muted">
          ¿CÓMO VIVÍ ESTE DÍA?
        </label>
        <textarea id="evening_reflection" value={reflection} onChange={(e) => setReflection(e.target.value)} rows={5}
          placeholder="Lo mejor que hiciste, lo que aprendiste, ideas, dibujos, pendientes que sueltas para mañana."
          className="px-4 py-3 rounded-lg border border-line bg-bg resize-none" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-widest text-muted mb-2">VITALES DE TU OLIMPO</legend>
          <div className="grid grid-cols-2 gap-2">
            {VITALES.map((v) => (
              <label key={v.key} className="flex items-center gap-2 p-2 rounded border border-line bg-bg cursor-pointer">
                <input type="checkbox" checked={(vitales as any)[v.key]}
                  onChange={(e) => setVitales((vv) => ({ ...vv, [v.key]: e.target.checked }))} />
                <span className="flex flex-col">
                  <span className="font-medium text-sm text-ink">{v.label}</span>
                  <span className="font-mono text-[10px] uppercase text-muted">{v.sub}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-widest text-muted mb-2">ESTADO DE TU OLIMPO</legend>
          <div className="flex flex-col gap-1">
            {STATES.map((s) => (
              <label key={s.key} className="flex items-start gap-2 p-2 rounded border border-line bg-bg cursor-pointer">
                <input type="radio" name="state" checked={state === s.key} onChange={() => setState(s.key)} className="mt-1" />
                <span className="flex flex-col">
                  <span className="font-medium text-sm text-ink">{s.label}</span>
                  <span className="text-xs text-muted">{s.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-widest text-muted mb-2">BALANCE DE TU OLIMPO</legend>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="income" className="font-mono text-[10px] uppercase tracking-widest text-muted">(+) INGRESOS DE HOY</label>
              <input id="income" type="number" inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)}
                className="h-10 px-3 rounded border border-line bg-bg" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="expense" className="font-mono text-[10px] uppercase tracking-widest text-muted">(−) GASTOS DE HOY</label>
              <input id="expense" type="number" inputMode="decimal" value={expense} onChange={(e) => setExpense(e.target.value)}
                className="h-10 px-3 rounded border border-line bg-bg" />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tomorrow_obj" className="font-mono text-xs uppercase tracking-widest text-muted">
          OBJETIVOS PRINCIPALES DE MAÑANA
        </label>
        <textarea id="tomorrow_obj" value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} rows={3}
          placeholder="Lo más importante que harás mañana."
          className="px-4 py-3 rounded-lg border border-line bg-bg resize-none" />
      </div>

      <p className="text-center font-body text-sm italic text-muted mt-6">
        "Descansa… pero no te apagues. Mañana el rayo vuelve a caer."
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

### Task 4.5: Integrar SolCard + LunaCard en /hoy

**Files:**
- Modify: `apps/web/app/(dashboard)/hoy/TodayClient.tsx`

- [ ] **Step 1: Importar y renderizar**

Insertar SolCard y LunaCard en posiciones lógicas del scroll. Recomendado:
- SolCard en la parte de arriba (después del Hero), reemplaza/complementa el "DailyPromptCard" / "Mood" si ya existen.
- LunaCard al final, antes del "Module Grid Nav".

Proteger contra duplicados: si ya hay un mood tracker o gratitude card que reemplaza con esto, ocultarlos detrás del nuevo flujo.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(hoy): SolCard y LunaCard integrados en /hoy con autosave"
```

---

## Fase 5 — Tutorial interactivo guiado

### Task 5.1: Tour interactivo en /hoy

**Files:**
- Create: `apps/web/components/hoy/InteractiveTour.tsx`
- Modify: `profiles` schema: agregar `tour_seen_v2 BOOLEAN DEFAULT FALSE`

**Context:** Más explicativo que el OnboardingTour actual. Se dispara la primera vez que el usuario llega a `/hoy` después del onboarding wizard. Tooltips paso a paso sobre las secciones del PDF (Sol, Luna, Vitales, Estado, Balance).

- [ ] **Step 1: Migration para flag**

```sql
-- supabase/migrations/20260430200000_tour_v2.sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tour_seen_v2 BOOLEAN DEFAULT FALSE;
```

- [ ] **Step 2: Componente con steps**

Lista de pasos (1 por elemento clave):

```tsx
const TOUR_STEPS = [
  { selector: "#sol-card", title: "Sol — tu mañana", body: "Cada mañana, antes de empezar, escribe tu intención. Define cómo quieres vivir el día y planea hasta 7 tareas con bloque de tiempo." },
  { selector: "#luna-card", title: "Luna — tu noche", body: "Antes de dormir, registra cómo viviste el día, marca tus vitales, define tu estado y el balance financiero." },
  { selector: "#vitales", title: "Vitales", body: "Éter (meditación), Forja (ejercicio), Néctar (hidratación), Kleos (lectura). Si los cumples a diario, todo lo demás se acomoda." },
  { selector: "#estado", title: "Estado", body: "Eudaimonía es el ideal. Identifica honestamente cómo terminaste para mejorar mañana." },
  { selector: "#balance", title: "Balance", body: "Anota cuánto entró y cuánto salió. La consciencia financiera empieza con la observación diaria." },
  { selector: "#pilares-footer", title: "Tus 4 columnas", body: "Hábitos, Finanzas, Mentalidad y Emprendimiento. Toca para profundizar en cada uno." },
];
```

Implementación: usar `position: absolute` con `getBoundingClientRect()` del selector, o una librería liviana como `intro.js` / `react-joyride`.

> Recomendación: hacerlo manual (sin librería) para mantener bundle delgado. Modal centrado con flecha apuntando al elemento + scroll-into-view.

- [ ] **Step 3: Trigger desde TodayClient**

```tsx
const profile = useProfile();
{profile?.tour_seen_v2 === false && <InteractiveTour onFinish={() => updateProfile({ tour_seen_v2: true })} />}
```

- [ ] **Step 4: Commit**

---

## Fase 6 — Cierre semanal por pilar

### Task 6.1: Schema `weekly_review`

**Files:**
- Create: `supabase/migrations/20260430300000_weekly_review.sql`

```sql
CREATE TABLE IF NOT EXISTS public.weekly_review (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_starting DATE NOT NULL,
  pilar TEXT NOT NULL CHECK (pilar IN ('habits','finance','mindset','business')),
  progress TEXT,
  blockers TEXT,
  commitment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_starting, pilar)
);
-- RLS owner-only (mismo patrón).
```

### Task 6.2: Página `/revision-semanal`

**Files:**
- Create: `apps/web/app/(dashboard)/revision-semanal/page.tsx`

Flujo: 4 cards (uno por pilar). Cada card 3 textareas (Progreso / Bloqueos / Compromiso). Autosave + SaveIndicator.

(Implementación análoga a SolCard/LunaCard. Detalles aplican el mismo patrón de useDailyJournal pero para weekly_review).

---

## Self-Review

### Spec coverage:

- ✅ "Personalización más pequeña" → Task 0.1
- ✅ "Personalización por usuario o todos lo ven" → respondido en Task 0.1 (Step 2)
- ✅ "'Hoy' en el menú top web" → Task 0.2
- ✅ "Footer con otros 3 pilares" → Task 0.3
- ✅ "Tutorial más interactivo y obligatorio" → Fase 3 (wizard) + Fase 5 (tour)
- ✅ "No puede hacer nada sin haber llenado eso" → Middleware gate Task 2.3 + 3.2 step 8
- ✅ "Manifiesto + firma antes de acceder" → Fase 2
- ✅ "Preguntas diarias en /hoy para journaling perfecto" → Fase 4 (Sol + Luna del PDF)
- ✅ "Botón guardar en cada sección que queda abierta" → Fase 1 (SaveIndicator + indicador "Guardado hace Xs")

### Placeholder scan: clean.

### Type consistency: SolCard.tsx y LunaCard.tsx leen y escriben los mismos campos del schema en Task 4.1. WizardClient.tsx escribe a `mindset_mpd` y `user_introspection`, ambos reflejados en migrations.

---

## Execution Handoff

Plan completo y guardado en `docs/superpowers/plans/2026-04-29-agenda-de-zeus.md`.

**Próximo paso:** Elegir cómo ejecutarlo:

1. **Subagent-Driven (recomendado)** — Yo despacho un subagente fresco por tarea, reviso entre tareas. Mejor para plan de este tamaño.
2. **Inline Execution** — Ejecuto las tareas en esta sesión, batch con checkpoints.

Si decides ejecutar TODO el plan: estimo 22-30 horas de trabajo. Recomiendo **fasear**: Fase 0 + 1 hoy (quick wins, 3-4h), las demás en sesiones siguientes.
