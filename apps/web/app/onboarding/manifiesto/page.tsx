import { ManifiestoForm } from "./ManifiestoForm";

export const metadata = {
  title: "Declaración · Estoicismo Digital",
  description: "Lee y firma la declaración antes de comenzar.",
};

export default function ManifiestoPage() {
  return (
    <main className="min-h-screen bg-bg flex items-start sm:items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
          ESTOICISMO DIGITAL
        </p>
        <h1 className="font-display text-4xl font-bold text-ink mb-1">
          Declaración.
        </h1>
        <p className="font-body text-muted text-sm mb-8">
          Léela despacio. Después firma.
        </p>
        <ManifiestoForm />
      </div>
    </main>
  );
}
