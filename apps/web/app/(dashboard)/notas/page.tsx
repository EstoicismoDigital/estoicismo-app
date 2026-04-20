import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../../lib/supabase-server";
import { NotasClient } from "./NotasClient";

export default async function NotasPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return <NotasClient />;
}
