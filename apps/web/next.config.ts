import type { NextConfig } from "next";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
}

const nextConfig: NextConfig = {
  transpilePackages: ["@estoicismo/ui", "@estoicismo/supabase"],
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
  },
};

export default nextConfig;
