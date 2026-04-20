import { redirect, notFound } from "next/navigation";
import { createSupabaseServer } from "../../../../lib/supabase-server";
import { HabitDetailClient } from "./HabitDetailClient";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;
  // Minimal server-side existence check so we 404 instead of rendering an
  // empty client. Row-level security guarantees this is the user's habit.
  const { data: habit, error } = await supabase
    .from("habits")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error || !habit) notFound();

  return <HabitDetailClient habitId={id} />;
}
