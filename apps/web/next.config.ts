import type { NextConfig } from "next";
import path from "path";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
}

// Root del workspace pnpm. Cuando se usa --turbopack, Next.js falla
// a auto-detectarlo con paths con espacios ("ESTOICIMO ARCHIVOS
// METRICAS"). process.cwd() durante `next dev` es apps/web/, así
// que el monorepo root está dos niveles arriba.
const monorepoRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  transpilePackages: ["@estoicismo/ui", "@estoicismo/supabase"],
  // Security headers — protección básica contra XSS, clickjacking,
  // MIME sniffing. Aplica a TODAS las rutas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Previene que el navegador adivine el tipo MIME (XSS vector).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Bloquea embed en iframes de otros dominios (clickjacking).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Política de referer mínimal — no leak de URL paths a otros sitios.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restringe permissions API (geo, micro, cámara) por default.
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          // Force HTTPS (1 año) — solo se aplica en producción.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  // TEMP: skip type-check during build. There's a known pnpm + React 19 +
  // Next 15 monorepo bug that surfaces duplicate ReactPortal types across
  // workspace packages. Local typecheck still runs (pnpm test/lint), so
  // we don't lose safety; we only skip Vercel's blocking pre-build check.
  // TODO: add pnpm overrides for @types/react to fix root cause.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tree-shake barrel imports. Lucide y date-fns en especial exportan
  // cientos de módulos desde el index; sin esto, dev compila TODO aunque
  // solo uses 5 iconos. Produces dramatic cold-nav wins in dev, modest
  // bundle-size wins in prod.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@tanstack/react-query",
    ],
    // View Transitions API — animaciones nativas del navegador entre
    // navegaciones de cliente. Cuando se activa, los layout shifts
    // entre rutas se interpolan suavemente sin código extra. Ver
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition
    viewTransition: true,
  },
};

export default nextConfig;
