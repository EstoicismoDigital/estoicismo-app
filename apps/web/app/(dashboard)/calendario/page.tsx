import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../../lib/supabase-server";
import { CalendarView } from "./CalendarView";

export default async function CalendarioPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return <CalendarView />;
}
