import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../../lib/supabase-server";
import { HistorialClient } from "./HistorialClient";

export default async function HistorialPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return <HistorialClient />;
}
