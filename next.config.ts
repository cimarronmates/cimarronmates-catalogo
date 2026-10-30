import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos ya se guardan como WebP liviano en Supabase; se sirven directo
    // para no depender de la cuota de transformaciones de Vercel (plan Hobby).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
