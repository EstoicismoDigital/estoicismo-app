import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../../lib/supabase-server";
import { AjustesClient } from "./AjustesClient";

export default async function AjustesPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, timezone")
    .eq("id", user.id)
    .single<{ plan: "free" | "premium"; timezone: string }>();

  return (
    <AjustesClient
      email={user.email ?? ""}
      plan={profile?.plan ?? "free"}
      timezone={profile?.timezone ?? "UTC"}
    />
  );
}
