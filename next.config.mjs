/** @type {import('next').NextConfig} */
import path from 'path';
import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  // 🚀 CONFIGURAÇÕES BÁSICAS DE BUILD
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  
  // 📦 CONFIGURAÇÃO DE PACOTES EXTERNOS
  serverExternalPackages: [
    '@supabase/supabase-js',
    '@supabase/realtime-js',
    '@supabase/postgrest-js'
  ],

  // 📱 OTIMIZAÇÕES MOBILE ESPECÍFICAS  
  experimental: {
    // Configuração mínima para estabilidade
    optimizeServerReact: true,
  },
  
  // 🖼️ OTIMIZAÇÃO DE IMAGENS PARA MOBILE
  images: {
    // Re-habilitar otimização para produção
    unoptimized: process.env.NODE_ENV === 'development',
    
    // Formatos modernos
    formats: ['image/webp', 'image/avif'],
    
    // Tamanhos responsivos para mobile
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Qualidade otimizada para mobile - configuração movida para loader específico
    // quality: 80, // Removido - não suportado nesta versão
    
    // Placeholder para melhor UX - configuração movida para componente
    // placeholder: 'blur', // Removido - não suportado nesta versão
    
    // Domínios externos permitidos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https', 
        hostname: 'via.placeholder.com',
      }
    ]
  },
  
  // ⚡ WEBPACK OTIMIZAÇÕES PARA MOBILE
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle splitting para mobile
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor crítico (carregamento prioritário)
          'vendor-critical': {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'vendor-critical',
            priority: 50,
            chunks: 'all',
            enforce: true
          },
          
          // UI Library (Radix UI)
          'vendor-ui': {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'vendor-ui',
            priority: 40,
            chunks: 'all'
          },
          
          // Supabase (API client)
          'vendor-supabase': {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'vendor-supabase',
            priority: 35,
            chunks: 'all'
          },
          
          // Charts (Recharts - lazy load)
          'vendor-charts': {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: 'vendor-charts',
            priority: 30,
            chunks: 'async' // Apenas async para lazy loading
          },
          
          // Icons (Lucide)
          'vendor-icons': {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'vendor-icons',
            priority: 25,
            chunks: 'all'
          },
          
          // Utilities
          'vendor-utils': {
            test: /[\\/]node_modules[\\/](date-fns|clsx|class-variance-authority)[\\/]/,
            name: 'vendor-utils',
            priority: 20,
            chunks: 'all'
          },
          
          // Vendor padrão (outras libs)
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            chunks: 'all'
          },
          
          // Common chunks para componentes internos
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'all',
            enforce: true
          }
        }
      };
      
      // Tree shaking agressivo para mobile
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Minimização otimizada
      config.optimization.minimize = true;
    }
    
    // Alias para otimizações - garantir resolução de path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd()),
    };
    
    // Plugin para analisar bundle
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analysis.html'
        })
      );
    }
    
    return config;
  },
  
  // 🔒 HEADERS DE SEGURANÇA E PERFORMANCE MOBILE
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
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Mobile optimizations
          {
            key: "X-UA-Compatible",
            value: "IE=edge",
          },
          {
            key: "viewport",
            value: "width=device-width, initial-scale=1, viewport-fit=cover",
          }
        ],
      },
      
      // Cache agressivo para assets estáticos (mobile)
      {
        source: '/(_next/static|images)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding'
          }
        ]
      },
      
      // Preload crítico para mobile
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: [
              '</fonts/geist.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
              '</favicon.ico>; rel=preload; as=image',
              '</icon-192x192.png>; rel=preload; as=image'
            ].join(', ')
          }
        ]
      },
      
      // Service Worker headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ]
      },
      
      // API routes com cache curto
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600' // 5min client, 10min CDN
          }
        ]
      }
    ];
  },
  
  // 🎯 REDIRECTS E REWRITES MOBILE
  async rewrites() {
    return {
      beforeFiles: [
        // PWA redirects
        {
          source: '/app',
          destination: '/'
        }
      ],
      afterFiles: [
        // Fallback para SPA routing
        {
          source: '/((?!api|_next|_static|favicon.ico|sw.js|manifest).*)',
          destination: '/'
        }
      ],
      fallback: []
    };
  },
  
  // 📊 COMPRESSION E OTIMIZAÇÕES
  compress: true,
  
  // 🚀 CONFIGURAÇÕES DE BUILD MOBILE
  output: 'standalone', // Para containerização
  
  // 🎨 SASS/CSS otimizado
  sassOptions: {
    includePaths: ['./styles'],
    prependData: `@import "variables.scss";`
  },
  
  // 📈 PERFORMANCE BUDGETS MOBILE - Removido (não suportado nesta versão)
  // performanceBudget: {
  //   // Orçamento para mobile
  //   maxAssetSize: 250000,      // 250KB por asset
  //   maxEntrypointSize: 400000, // 400KB entrypoint inicial
  //   hints: "error"
  // },
  
  // 🔄 CONFIGURAÇÕES DE DESENVOLVIMENTO
  ...(process.env.NODE_ENV === 'development' && {
    // Dev apenas
    reactStrictMode: true,
    // swcMinify: true, // Removido - configuração global
  }),
  
  // 🎯 CONFIGURAÇÕES DE PRODUÇÃO
  ...(process.env.NODE_ENV === 'production' && {
    // Produção apenas
    poweredByHeader: false,
    reactStrictMode: false, // Desabilitar em prod para performance
    
    // Compilação otimizada - removido swcMinify (configuração global)
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn']
      }
    }
  })
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-static",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-font-assets",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-image",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-js-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-style-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-data",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:json|xml|csv)$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "static-data-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin
        if (!isSameOrigin) return false
        const pathname = url.pathname
        // Exclude /api/auth/ and /api/login from being cached
        if (pathname.startsWith("/api/auth/")) return false
        if (pathname.startsWith("/api/login")) return false
        // Cache all other API routes
        return pathname.startsWith("/api/")
      },
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "apis",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 10 // fall back to cache if API does not response within 10 seconds
      }
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin
        if (!isSameOrigin) return false
        const pathname = url.pathname
        if (pathname.startsWith("/api/")) return false
        return true
      },
      handler: "NetworkFirst",
      options: {
        cacheName: "others",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
})(nextConfig);
