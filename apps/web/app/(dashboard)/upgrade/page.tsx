import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../../lib/supabase-server";
import PricingCards from "./PricingCards";

export default async function UpgradePage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single<{ plan: "free" | "premium" }>();

  if (profile?.plan === "premium") redirect("/upgrade/success");

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
            PREMIUM
          </p>
          <h1 className="font-display italic text-4xl sm:text-5xl font-bold text-ink mb-4">
            Desbloquea todo tu potencial
          </h1>
          <p className="font-body text-muted text-base sm:text-lg">
            Hábitos ilimitados, streak freezes, y más
          </p>
        </div>

        <PricingCards />

        <p className="text-center font-body text-muted text-sm mt-10">
          Cancela cuando quieras. Sin compromiso.
        </p>
      </div>
    </main>
  );
}
