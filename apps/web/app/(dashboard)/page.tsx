import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../lib/supabase-server";
import { HabitsDashboard } from "./HabitsDashboard";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return <HabitsDashboard />;
}
