/** @type {import('next').NextConfig} */
const isCI = process.env.CI === "true";

const nextConfig = {
  // Configurações condicionais para CI vs desenvolvimento local
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  images: {
    unoptimized: true,
  },
  // Adicionar configurações de performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // Configurações para melhor compatibilidade com navegador Windsurf
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
