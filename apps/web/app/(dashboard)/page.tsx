import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../lib/supabase-server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
          ESTOICISMO DIGITAL
        </p>
        <h1 className="font-display text-4xl font-bold text-ink mb-4">
          Bienvenido.
        </h1>
        <p className="font-body text-muted">
          Módulo de Hábitos próximamente — Plan 2.
        </p>
      </div>
    </main>
  );
}
