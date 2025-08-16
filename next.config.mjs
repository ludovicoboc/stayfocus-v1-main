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
}

export default nextConfig
