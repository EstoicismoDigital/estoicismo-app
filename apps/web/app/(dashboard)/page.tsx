import { TodayClient } from "./hoy/TodayClient";

// Auth guard lives in middleware — see apps/web/middleware.ts.
// `/` ahora es el ritual del día (`TodayClient`). El dashboard de
// hábitos vive en `/habitos`. Mantenemos esto como pass-through
// inline (sin redirect) para evitar un round-trip extra al abrir
// la app en cada navegación.
export default function DashboardPage() {
  return <TodayClient />;
}
