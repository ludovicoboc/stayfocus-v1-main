/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remover configurações que ignoram erros - deixar ESLint e TypeScript funcionarem
  images: {
    unoptimized: true,
  },
  // Adicionar configurações de performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Configurações para melhor compatibilidade com navegador Windsurf
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
  // Configurações de servidor para desenvolvimento
  devIndicators: {
    buildActivity: false,
  },
}

export default nextConfig
