import { notFound } from "next/navigation";
import { createSupabaseServer } from "../../../../lib/supabase-server";
import { HabitDetailClient } from "./HabitDetailClient";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Auth guard is enforced by middleware (supabase-server.ts is only
  // used here for the habit-existence check below — RLS ensures only
  // the user's own habits are visible).
  const supabase = await createSupabaseServer();
  const { id } = await params;
  const { data: habit, error } = await supabase
    .from("habits")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error || !habit) notFound();

  return <HabitDetailClient habitId={id} />;
}
