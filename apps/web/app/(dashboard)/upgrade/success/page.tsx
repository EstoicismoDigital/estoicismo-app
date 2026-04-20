import Link from "next/link";

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  // Read searchParams (not verified here — the webhook handles verification)
  await searchParams;

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-xl text-center py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
          BIENVENIDO A PREMIUM
        </p>
        <h1 className="font-display italic text-4xl sm:text-5xl font-bold text-ink mb-4">
          Tu viaje estoico, ahora sin límites
        </h1>
        <p className="font-body text-muted text-base sm:text-lg mb-10">
          Tu suscripción está activa. Todos los features premium están
          desbloqueados.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] h-12 px-6 rounded-lg bg-accent text-white font-body font-medium text-base hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-opacity"
        >
          Ir a mi dashboard
        </Link>
      </div>
    </main>
  );
}
