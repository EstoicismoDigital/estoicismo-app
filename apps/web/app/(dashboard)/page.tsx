import { HabitsDashboard } from "./HabitsDashboard";

// Auth guard lives in middleware — see apps/web/middleware.ts.
// Keeping this page as a thin pass-through means no Supabase client init
// on navigation, so going /finanzas → / doesn't eat an extra roundtrip.
export default function DashboardPage() {
  return <HabitsDashboard />;
}
