import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@estoicismo/ui", "@estoicismo/supabase"],
};

export default nextConfig;
