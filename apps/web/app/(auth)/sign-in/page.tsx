import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
          ESTOICISMO DIGITAL
        </p>
        <h1 className="font-display text-4xl font-bold text-ink mb-6">
          Bienvenido de vuelta.
        </h1>

        <Suspense fallback={<div className="h-72" />}>
          <SignInForm />
        </Suspense>

        <p className="text-center font-body text-muted text-sm mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/sign-up" className="text-accent font-medium hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
