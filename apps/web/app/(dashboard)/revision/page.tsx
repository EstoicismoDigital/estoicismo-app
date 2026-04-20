import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../../lib/supabase-server";
import { RevisionClient } from "./RevisionClient";

export default async function RevisionPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return <RevisionClient />;
}
