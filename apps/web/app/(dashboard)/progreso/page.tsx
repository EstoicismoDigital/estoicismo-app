import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../../lib/supabase-server";
import { ProgresoClient } from "./ProgresoClient";

export default async function ProgresoPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return <ProgresoClient />;
}
